-- FABLE 5 schema
-- SQLite now; written to be a drop-in match for Postgres/Supabase later.
-- JSON payloads are stored as TEXT (SQLite has no native JSON type; Postgres
-- can widen these columns to JSONB without changing app code).

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  industry TEXT,
  business_type TEXT,
  business_size TEXT,
  goals TEXT,
  pain_points TEXT,
  budget_range TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  diagnosis_json TEXT,
  recommended_package_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recommended_package_id) REFERENCES packages(id)
);

CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL,
  description TEXT,
  price_range TEXT,
  deliverables_json TEXT,
  timeline_weeks INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  package_id TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scoping',
  scope_json TEXT,
  price_quote TEXT,
  timeline_weeks INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (package_id) REFERENCES packages(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium',
  build_brief_json TEXT,
  review_json TEXT,
  assignee TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loops (
  id TEXT PRIMARY KEY,
  loop_type TEXT NOT NULL,
  client_id TEXT,
  project_id TEXT,
  task_id TEXT,
  lead_id TEXT,
  proposal_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  input_json TEXT,
  output_json TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  project_id TEXT,
  author TEXT NOT NULL DEFAULT 'system',
  body TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sales Mode -----------------------------------------------------------
-- Captures leads from in-person conversations, email replies, referrals,
-- and cold outreach, and carries them through to proposals + follow-ups.
-- A lead becomes a client (clients.id) once won.

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  business_type TEXT,
  pain_points TEXT,
  requested_service TEXT,
  budget_range TEXT,
  urgency TEXT NOT NULL DEFAULT 'medium',
  source TEXT NOT NULL DEFAULT 'other',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  diagnosis_json TEXT,
  offer_match_json TEXT,
  close_probability INTEGER,
  close_probability_json TEXT,
  client_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'other',
  summary TEXT NOT NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  scope_json TEXT,
  price_range TEXT,
  timeline_weeks INTEGER,
  deliverables_json TEXT,
  next_step TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  proposal_id TEXT,
  channel TEXT NOT NULL DEFAULT 'email',
  due_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  email_subject TEXT,
  email_body TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE SET NULL
);

-- Sales-specific activity feed, separate from the ops activity_log so the
-- CEO's sales timeline doesn't get mixed with build/delivery activity.
CREATE TABLE IF NOT EXISTS sales_activity (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_loops_client ON loops(client_id);
CREATE INDEX IF NOT EXISTS idx_loops_project ON loops(project_id);
CREATE INDEX IF NOT EXISTS idx_loops_lead ON loops(lead_id);
CREATE INDEX IF NOT EXISTS idx_loops_proposal ON loops(proposal_id);
CREATE INDEX IF NOT EXISTS idx_notes_client ON notes(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_lead ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_due ON follow_ups(due_at);
CREATE INDEX IF NOT EXISTS idx_sales_activity_entity ON sales_activity(entity_type, entity_id);
