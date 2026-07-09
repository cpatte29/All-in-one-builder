import { db } from "@/lib/db";
import { parsePriceRange, formatMoney } from "./money";
import type {
  Alert,
  Confidence,
  DailyBrief,
  Forecasts,
  HealthComponent,
  LeadForecast,
  OpportunityItem,
  OverseerSnapshot,
  ProjectForecast,
  ProjectForecastItem,
  Recommendation,
  RevenueForecast,
  RiskItem,
  Severity,
  WorkloadForecast,
} from "./types";
import type { Client, Lead, Project, Proposal, Task, FollowUp } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const daysAgo = (iso: string) => (Date.now() - new Date(iso).getTime()) / DAY_MS;

/**
 * The Overseer's entire job: read the platform's data, never write to it,
 * and return a structured assessment. Every function below is a pure read.
 */
export function computeOverseerSnapshot(): OverseerSnapshot {
  const clients = db.prepare("SELECT * FROM clients").all() as Client[];
  const projects = db.prepare("SELECT * FROM projects").all() as Project[];
  const tasks = db.prepare("SELECT * FROM tasks").all() as Task[];
  const leads = db.prepare("SELECT * FROM leads").all() as Lead[];
  const proposals = db.prepare("SELECT * FROM proposals").all() as Proposal[];
  const followUps = db.prepare("SELECT * FROM follow_ups").all() as FollowUp[];

  const activeLeads = leads.filter((l) => l.status !== "won" && l.status !== "lost");
  const hotLeads = activeLeads.filter((l) => (l.close_probability ?? 0) >= 70);
  const warmLeads = activeLeads.filter((l) => {
    const s = l.close_probability ?? -1;
    return s >= 40 && s < 70;
  });
  const coldOrUnscoredLeads = activeLeads.filter((l) => !hotLeads.includes(l) && !warmLeads.includes(l));

  const now = new Date();
  const overdueFollowUps = followUps
    .filter((f) => f.status === "pending" && new Date(f.due_at) < now)
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

  const stalledProposals = proposals.filter(
    (p) => p.status === "sent" && p.sent_at && daysAgo(p.sent_at) >= 7
  );

  const hotLeadsWithoutProposal = hotLeads.filter(
    (l) => !["proposal_ready", "proposal_sent", "negotiating"].includes(l.status)
  );

  const staleRevisionTasks = tasks.filter((t) => t.status === "needs_revision" && daysAgo(t.updated_at) >= 3);

  const openTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const tasksDoneLast7Days = doneTasks.filter((t) => daysAgo(t.updated_at) <= 7);
  const staleOpenTasks = openTasks.filter((t) => daysAgo(t.created_at) >= 14);

  const wonLeads = leads.filter((l) => l.status === "won").length;
  const lostLeads = leads.filter((l) => l.status === "lost").length;
  const closedLeads = wonLeads + lostLeads;
  const winRate = closedLeads > 0 ? wonLeads / closedLeads : null;

  const declinedProposals = proposals.filter((p) => p.status === "declined").length;
  const decidedProposals = proposals.filter((p) => ["accepted", "declined"].includes(p.status)).length;
  const declineRate = decidedProposals > 0 ? declinedProposals / decidedProposals : null;

  const newLeadsLast7Days = leads.filter((l) => daysAgo(l.created_at) <= 7).length;

  const inFlightProjects = projects.filter((p) => p.status !== "delivered");

  // --- Health score -------------------------------------------------------
  const salesScore = clamp(
    50 +
      (activeLeads.length > 0 ? (hotLeads.length / activeLeads.length) * 40 : 0) +
      (newLeadsLast7Days > 0 ? 10 : -10) -
      overdueFollowUps.length * 5
  );
  const totalTasksForRate = tasks.length;
  const completionRate = totalTasksForRate > 0 ? doneTasks.length / totalTasksForRate : 1;
  const deliveryScore = clamp(completionRate * 100 - staleRevisionTasks.length * 8 - staleOpenTasks.length * 3);
  const revenueScore = clamp(
    50 + (winRate != null ? winRate * 40 : 0) + (inFlightProjects.length > 0 ? 10 : 0) - (declineRate ?? 0) * 30
  );
  const pendingFollowUps = followUps.filter((f) => f.status === "pending").length;
  const responsivenessScore = clamp(
    pendingFollowUps > 0 ? 100 - (overdueFollowUps.length / pendingFollowUps) * 100 : 100
  );

  const healthComponents: HealthComponent[] = [
    { label: "Sales Pipeline", score: Math.round(salesScore), weight: 0.3, detail: `${hotLeads.length} hot of ${activeLeads.length} active leads` },
    { label: "Delivery", score: Math.round(deliveryScore), weight: 0.3, detail: `${doneTasks.length}/${totalTasksForRate || 0} tasks done, ${staleRevisionTasks.length} stuck in revision` },
    { label: "Revenue", score: Math.round(revenueScore), weight: 0.25, detail: winRate != null ? `${Math.round(winRate * 100)}% win rate` : "Not enough closed leads yet" },
    { label: "Responsiveness", score: Math.round(responsivenessScore), weight: 0.15, detail: `${overdueFollowUps.length} of ${pendingFollowUps} pending follow-ups overdue` },
  ];
  const healthScore = Math.round(healthComponents.reduce((sum, c) => sum + c.score * c.weight, 0));
  const healthLabel = healthScore >= 85 ? "Excellent" : healthScore >= 70 ? "Healthy" : healthScore >= 50 ? "Watch" : "At Risk";

  // --- Alerts ---------------------------------------------------------
  const alerts: Alert[] = [];
  for (const f of overdueFollowUps) {
    const lead = leads.find((l) => l.id === f.lead_id);
    const overdueDays = Math.round(daysAgo(f.due_at));
    alerts.push({
      id: `fu-${f.id}`,
      severity: overdueDays >= 3 ? "critical" : "warning",
      title: `Follow-up overdue: ${lead?.business_name ?? "unknown lead"}`,
      detail: `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue.`,
      entityType: "lead",
      entityId: f.lead_id,
      href: `/leads/${f.lead_id}`,
    });
  }
  for (const p of stalledProposals) {
    const lead = leads.find((l) => l.id === p.lead_id);
    const sentDays = Math.round(daysAgo(p.sent_at!));
    alerts.push({
      id: `prop-${p.id}`,
      severity: sentDays >= 14 ? "critical" : "warning",
      title: `Stalled proposal: ${lead?.business_name ?? "unknown lead"}`,
      detail: `Sent ${sentDays} days ago with no accept/decline.`,
      entityType: "proposal",
      entityId: p.id,
      href: `/proposals/${p.id}`,
    });
  }
  for (const l of hotLeadsWithoutProposal) {
    alerts.push({
      id: `hot-${l.id}`,
      severity: "warning",
      title: `Hot lead has no proposal: ${l.business_name}`,
      detail: `Close probability ${l.close_probability}/100 — draft a proposal before it cools off.`,
      entityType: "lead",
      entityId: l.id,
      href: `/leads/${l.id}`,
    });
  }
  for (const t of staleRevisionTasks) {
    const project = projects.find((p) => p.id === t.project_id);
    alerts.push({
      id: `task-${t.id}`,
      severity: "warning",
      title: `Task stuck in revision: ${t.title}`,
      detail: `${Math.round(daysAgo(t.updated_at))} days since last review on ${project?.name ?? "project"}.`,
      entityType: "task",
      entityId: t.id,
      href: project ? `/projects/${project.id}` : "/tasks",
    });
  }
  const severityRank: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  // --- Risk detection -------------------------------------------------
  const risks: RiskItem[] = [];
  if (newLeadsLast7Days === 0) {
    risks.push({
      title: "Lead flow has stalled",
      detail: "No new leads captured in the last 7 days.",
      severity: "warning",
    });
  }
  if (declineRate != null && declineRate > 0.4 && decidedProposals >= 3) {
    risks.push({
      title: "High proposal decline rate",
      detail: `${Math.round(declineRate * 100)}% of decided proposals (${decidedProposals} total) were declined — check pricing or offer fit.`,
      severity: "warning",
    });
  }
  if (openTasks.length > 5 && tasksDoneLast7Days.length === 0) {
    risks.push({
      title: "Delivery velocity has flatlined",
      detail: `${openTasks.length} open tasks with zero completions in the last 7 days.`,
      severity: "critical",
    });
  }
  if (inFlightProjects.length >= 2) {
    const values = inFlightProjects.map((p) => parsePriceRange(p.price_quote).mid);
    const total = values.reduce((a, b) => a + b, 0);
    const maxVal = Math.max(...values);
    if (total > 0 && maxVal / total > 0.5) {
      const biggest = inFlightProjects[values.indexOf(maxVal)];
      risks.push({
        title: "Revenue concentrated in a single client",
        detail: `${biggest.name} is ${Math.round((maxVal / total) * 100)}% of in-flight project value.`,
        severity: "warning",
      });
    }
  }
  if (activeLeads.length >= 3 && coldOrUnscoredLeads.length / activeLeads.length > 0.6) {
    risks.push({
      title: "Most active leads are cold or undiagnosed",
      detail: `${coldOrUnscoredLeads.length} of ${activeLeads.length} active leads are cold or haven't run the Business Pain / Close Probability loops.`,
      severity: "info",
    });
  }

  // --- Opportunity detection -------------------------------------------
  const opportunities: OpportunityItem[] = [];
  if (hotLeads.length > 0) {
    opportunities.push({
      title: `${hotLeads.length} hot lead${hotLeads.length === 1 ? "" : "s"} ready to close`,
      detail: hotLeads.map((l) => `${l.business_name} (${l.close_probability}/100)`).join(", "),
    });
  }
  const sourceOutcomes = new Map<string, { won: number; lost: number }>();
  for (const l of leads) {
    if (l.status !== "won" && l.status !== "lost") continue;
    const entry = sourceOutcomes.get(l.source) ?? { won: 0, lost: 0 };
    if (l.status === "won") entry.won += 1;
    else entry.lost += 1;
    sourceOutcomes.set(l.source, entry);
  }
  let bestSource: { source: string; rate: number; n: number } | null = null;
  for (const [source, o] of sourceOutcomes) {
    const n = o.won + o.lost;
    if (n < 2) continue;
    const rate = o.won / n;
    if (!bestSource || rate > bestSource.rate) bestSource = { source, rate, n };
  }
  if (bestSource && bestSource.rate >= 0.5) {
    opportunities.push({
      title: `${bestSource.source.replace(/_/g, " ")} leads convert best`,
      detail: `${Math.round(bestSource.rate * 100)}% win rate across ${bestSource.n} closed leads from this source — worth leaning into.`,
    });
  }
  const singleProjectClients = clients.filter(
    (c) => c.status === "delivered" && projects.filter((p) => p.client_id === c.id).length === 1
  );
  if (singleProjectClients.length > 0) {
    opportunities.push({
      title: `${singleProjectClients.length} delivered client${singleProjectClients.length === 1 ? "" : "s"} could be upsold`,
      detail: singleProjectClients.map((c) => c.business_name).join(", ") + " — each has only shipped one project so far.",
    });
  }

  // --- Recommendations --------------------------------------------------
  const recommendations: Recommendation[] = [];
  const confidenceFor = (n: number, high: number, med: number): Confidence => (n >= high ? "High" : n >= med ? "Medium" : "Low");

  if (overdueFollowUps.length > 0) {
    recommendations.push({
      title: "Clear overdue follow-ups today",
      reason: "Overdue follow-ups directly erode close probability the longer they sit unanswered.",
      supportingData: [
        `${overdueFollowUps.length} follow-up(s) overdue`,
        `Oldest: ${leads.find((l) => l.id === overdueFollowUps[0].lead_id)?.business_name ?? "unknown"} — ${Math.round(daysAgo(overdueFollowUps[0].due_at))} days overdue`,
      ],
      confidence: confidenceFor(overdueFollowUps.length, 3, 1),
      suggestedAction: "Work the overdue list on the Follow-Ups page before taking new meetings.",
      category: "sales",
    });
  }
  if (hotLeadsWithoutProposal.length > 0) {
    recommendations.push({
      title: "Generate proposals for hot leads before they cool off",
      reason: "High close-probability leads without a proposal are the fastest path to revenue sitting idle.",
      supportingData: hotLeadsWithoutProposal.map((l) => `${l.business_name} — ${l.close_probability}/100`),
      confidence: confidenceFor(hotLeadsWithoutProposal.length, 2, 1),
      suggestedAction: "Run the Proposal Generation Loop for each lead listed.",
      category: "sales",
    });
  }
  if (stalledProposals.length > 0) {
    recommendations.push({
      title: "Follow up on stalled proposals",
      reason: "Proposals sent 7+ days ago with no response are at high risk of going cold.",
      supportingData: stalledProposals.map((p) => {
        const l = leads.find((x) => x.id === p.lead_id);
        return `${l?.business_name ?? "unknown"} — sent ${Math.round(daysAgo(p.sent_at!))} days ago`;
      }),
      confidence: confidenceFor(stalledProposals.length, 2, 1),
      suggestedAction: "Run the Follow-Up Email Loop and personally call the top one.",
      category: "sales",
    });
  }
  if (openTasks.length > 0 && tasksDoneLast7Days.length === 0) {
    recommendations.push({
      title: "Delivery capacity needs attention",
      reason: "No tasks completed in the last 7 days while the backlog holds steady or grows.",
      supportingData: [`${openTasks.length} open tasks`, `${tasksDoneLast7Days.length} completed in last 7 days`],
      confidence: confidenceFor(openTasks.length, 8, 3),
      suggestedAction: "Reprioritize the task board or pause new intake until backlog clears.",
      category: "ops",
    });
  }
  const concentrationRisk = risks.find((r) => r.title === "Revenue concentrated in a single client");
  if (concentrationRisk) {
    recommendations.push({
      title: "Diversify revenue away from a single client",
      reason: concentrationRisk.detail,
      supportingData: [concentrationRisk.detail],
      confidence: "Medium",
      suggestedAction: "Prioritize new lead generation so no single client dominates in-flight revenue.",
      category: "risk",
    });
  }
  if (singleProjectClients.length > 0) {
    recommendations.push({
      title: "Revisit delivered clients for a second project",
      reason: "Clients who already had one project delivered are the warmest possible upsell — no new trust to build.",
      supportingData: singleProjectClients.map((c) => c.business_name),
      confidence: confidenceFor(singleProjectClients.length, 2, 1),
      suggestedAction: "Log a conversation or send a check-in note proposing a next phase.",
      category: "opportunity",
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      title: "Pipeline looks healthy — no urgent action needed",
      reason: "No overdue follow-ups, stalled proposals, or delivery bottlenecks were detected.",
      supportingData: [`${activeLeads.length} active leads`, `${openTasks.length} open tasks`],
      confidence: "Medium",
      suggestedAction: "Keep capturing leads and running loops on schedule.",
      category: "ops",
    });
  }

  // --- Forecasts ----------------------------------------------------------
  const inFlightProjectValue = inFlightProjects.reduce((sum, p) => sum + parsePriceRange(p.price_quote).mid, 0);
  const activeProposals = proposals.filter((p) => p.status === "sent" || p.status === "accepted");
  const weightedPipelineValue = activeProposals.reduce((sum, p) => {
    const lead = leads.find((l) => l.id === p.lead_id);
    const probability = (lead?.close_probability ?? 40) / 100;
    return sum + parsePriceRange(p.price_range).mid * probability;
  }, 0);
  const revenue: RevenueForecast = {
    inFlightProjectValue,
    weightedPipelineValue,
    next30DayEstimate: inFlightProjectValue * 0.3 + weightedPipelineValue * 0.5,
    breakdown: [
      `${formatMoney(inFlightProjectValue)} across ${inFlightProjects.length} in-flight project(s)`,
      `${formatMoney(weightedPipelineValue)} weighted pipeline across ${activeProposals.length} active proposal(s)`,
    ],
  };

  const projectItems: ProjectForecastItem[] = inFlightProjects.map((p) => {
    const pTasks = tasks.filter((t) => t.project_id === p.id);
    const pDone = pTasks.filter((t) => t.status === "done").length;
    const percentDone = pTasks.length > 0 ? pDone / pTasks.length : 0;
    const elapsedWeeks = daysAgo(p.created_at) / 7;
    const expectedProgress = p.timeline_weeks ? clamp(elapsedWeeks / p.timeline_weeks, 0, 1) : 0;
    const client = clients.find((c) => c.id === p.client_id);
    return {
      projectId: p.id,
      name: p.name,
      clientName: client?.business_name ?? "unknown",
      percentDone: Math.round(percentDone * 100),
      behindSchedule: pTasks.length > 0 && percentDone + 0.15 < expectedProgress,
    };
  });
  const projectsForecast: ProjectForecast = {
    onTrack: projectItems.filter((i) => !i.behindSchedule).length,
    behindSchedule: projectItems.filter((i) => i.behindSchedule).length,
    nearingDelivery: projectItems.filter((i) => i.percentDone >= 80).length,
    items: projectItems,
  };

  const scoredActive = activeLeads.filter((l) => l.close_probability != null);
  const expectedWinsThisMonth =
    scoredActive.reduce((sum, l) => sum + (l.close_probability ?? 0) / 100, 0) +
    (activeLeads.length - scoredActive.length) * 0.15;
  const leadForecast: LeadForecast = {
    activeLeads: activeLeads.length,
    hotLeads: hotLeads.length,
    warmLeads: warmLeads.length,
    coldOrUnscored: coldOrUnscoredLeads.length,
    expectedWinsThisMonth: Math.round(expectedWinsThisMonth * 10) / 10,
  };

  const dailyVelocity = tasksDoneLast7Days.length / 7;
  const workload: WorkloadForecast = {
    openTasks: openTasks.length,
    weeklyVelocity: tasksDoneLast7Days.length,
    estDaysToClearBacklog: dailyVelocity > 0 ? Math.ceil(openTasks.length / dailyVelocity) : null,
    staleTaskCount: staleOpenTasks.length,
  };

  const forecasts: Forecasts = { revenue, projects: projectsForecast, leads: leadForecast, workload };

  // --- Daily brief ---------------------------------------------------
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const brief: DailyBrief = {
    headline:
      criticalCount > 0
        ? `${healthLabel} overall, but ${criticalCount} item${criticalCount === 1 ? "" : "s"} need${criticalCount === 1 ? "s" : ""} attention today.`
        : `Company health is ${healthLabel.toLowerCase()} (${healthScore}/100). No critical alerts.`,
    bullets: [
      `${activeLeads.length} active leads (${hotLeads.length} hot, ${warmLeads.length} warm)`,
      `${inFlightProjects.length} in-flight project(s), ${openTasks.length} open tasks`,
      `${followUps.filter((f) => f.status === "pending").length} follow-ups pending, ${overdueFollowUps.length} overdue`,
      `${formatMoney(revenue.next30DayEstimate)} estimated revenue over the next 30 days`,
    ],
  };

  return {
    generatedAt: new Date().toISOString(),
    healthScore,
    healthLabel,
    healthComponents,
    brief,
    alerts,
    risks,
    opportunities,
    recommendations,
    forecasts,
  };
}
