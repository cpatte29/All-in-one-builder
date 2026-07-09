// Overseer Mode types. This module belongs to the Overseer only — it never
// generates code and never mutates client/project/task/lead/proposal data.
// It observes the platform and produces a structured assessment.

export type Confidence = "High" | "Medium" | "Low";
export type Severity = "critical" | "warning" | "info";

export interface HealthComponent {
  label: string;
  score: number; // 0-100
  weight: number; // fraction of total, sums to 1 across all components
  detail: string;
}

export interface DailyBrief {
  headline: string;
  bullets: string[];
}

export interface Alert {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  entityType: "lead" | "proposal" | "task" | "project" | "client";
  entityId: string;
  href: string;
}

export interface RiskItem {
  title: string;
  detail: string;
  severity: Severity;
}

export interface OpportunityItem {
  title: string;
  detail: string;
}

export interface Recommendation {
  title: string;
  reason: string;
  supportingData: string[];
  confidence: Confidence;
  suggestedAction: string;
  category: "risk" | "opportunity" | "sales" | "ops";
}

export interface RevenueForecast {
  inFlightProjectValue: number;
  weightedPipelineValue: number;
  next30DayEstimate: number;
  breakdown: string[];
}

export interface ProjectForecastItem {
  projectId: string;
  name: string;
  clientName: string;
  percentDone: number;
  behindSchedule: boolean;
}

export interface ProjectForecast {
  onTrack: number;
  behindSchedule: number;
  nearingDelivery: number;
  items: ProjectForecastItem[];
}

export interface LeadForecast {
  activeLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldOrUnscored: number;
  expectedWinsThisMonth: number;
}

export interface WorkloadForecast {
  openTasks: number;
  weeklyVelocity: number;
  estDaysToClearBacklog: number | null;
  staleTaskCount: number;
}

export interface Forecasts {
  revenue: RevenueForecast;
  projects: ProjectForecast;
  leads: LeadForecast;
  workload: WorkloadForecast;
}

export interface OverseerSnapshot {
  generatedAt: string;
  healthScore: number;
  healthLabel: string;
  healthComponents: HealthComponent[];
  brief: DailyBrief;
  alerts: Alert[];
  risks: RiskItem[];
  opportunities: OpportunityItem[];
  recommendations: Recommendation[];
  forecasts: Forecasts;
}

export interface OverseerSnapshotRow {
  id: string;
  health_score: number;
  headline: string;
  snapshot_json: string;
  created_at: string;
}
