export type ClientStatus =
  | "new"
  | "profiled"
  | "diagnosed"
  | "package_recommended"
  | "scoped"
  | "in_progress"
  | "delivered";

export type ProjectStatus =
  | "scoping"
  | "scoped"
  | "tasks_generated"
  | "in_build"
  | "in_review"
  | "delivered";

export type TaskStatus =
  | "backlog"
  | "ready_for_build"
  | "in_build"
  | "in_review"
  | "needs_revision"
  | "done";

export type TaskPriority = "low" | "medium" | "high";

export type LoopType =
  | "client_profile"
  | "business_diagnosis"
  | "package_recommendation"
  | "project_scope"
  | "task_generation"
  | "claude_build"
  | "quality_review"
  | "client_update"
  | "lead_capture"
  | "business_pain"
  | "offer_match"
  | "proposal_generation"
  | "follow_up_email"
  | "close_probability";

export interface Client {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  industry: string | null;
  business_type: string | null;
  business_size: string | null;
  goals: string | null;
  pain_points: string | null;
  budget_range: string | null;
  source: string | null;
  status: ClientStatus;
  diagnosis_json: string | null;
  recommended_package_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: string;
  tier: string;
  description: string | null;
  price_range: string | null;
  deliverables_json: string | null;
  timeline_weeks: number | null;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  package_id: string | null;
  name: string;
  status: ProjectStatus;
  scope_json: string | null;
  price_quote: string | null;
  timeline_weeks: number | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  build_brief_json: string | null;
  review_json: string | null;
  assignee: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoopRun {
  id: string;
  loop_type: LoopType;
  client_id: string | null;
  project_id: string | null;
  task_id: string | null;
  lead_id: string | null;
  proposal_id: string | null;
  status: "completed" | "failed";
  input_json: string | null;
  output_json: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  client_id: string | null;
  project_id: string | null;
  author: string;
  body: string;
  note_type: string;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  message: string;
  created_at: string;
}

// --- Sales Mode ----------------------------------------------------------

export type LeadStatus =
  | "new"
  | "diagnosed"
  | "matched"
  | "proposal_ready"
  | "proposal_sent"
  | "negotiating"
  | "won"
  | "lost";

export type LeadUrgency = "low" | "medium" | "high";

export type LeadSource = "referral" | "cold_outreach" | "in_person" | "email_reply" | "website" | "other";

export type ConversationChannel = "in_person" | "email" | "call" | "referral" | "other";

export type ProposalStatus = "draft" | "sent" | "accepted" | "declined";

export type FollowUpStatus = "pending" | "sent" | "done" | "skipped";

export type FollowUpChannel = "email" | "call" | "text";

export interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  business_type: string | null;
  pain_points: string | null;
  requested_service: string | null;
  budget_range: string | null;
  urgency: LeadUrgency;
  source: LeadSource;
  notes: string | null;
  status: LeadStatus;
  diagnosis_json: string | null;
  offer_match_json: string | null;
  close_probability: number | null;
  close_probability_json: string | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  channel: ConversationChannel;
  summary: string;
  occurred_at: string;
  created_at: string;
}

export interface Proposal {
  id: string;
  lead_id: string;
  package_name: string;
  scope_json: string | null;
  price_range: string | null;
  timeline_weeks: number | null;
  deliverables_json: string | null;
  next_step: string | null;
  status: ProposalStatus;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  proposal_id: string | null;
  channel: FollowUpChannel;
  due_at: string;
  status: FollowUpStatus;
  email_subject: string | null;
  email_body: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesActivityEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  message: string;
  created_at: string;
}
