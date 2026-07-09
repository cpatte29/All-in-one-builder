import type { Lead } from "@/lib/types";

export type BoardColumn = "New" | "Warm" | "Hot" | "Proposal Sent" | "Won" | "Lost";

export const BOARD_COLUMNS: BoardColumn[] = ["New", "Warm", "Hot", "Proposal Sent", "Won", "Lost"];

export const BOARD_COLORS: Record<BoardColumn, string> = {
  New: "border-ink-600 bg-ink-800/60",
  Warm: "border-amber-500/30 bg-amber-500/5",
  Hot: "border-rose-500/30 bg-rose-500/5",
  "Proposal Sent": "border-violet-500/30 bg-violet-500/5",
  Won: "border-emerald-500/30 bg-emerald-500/5",
  Lost: "border-ink-700 bg-ink-900",
};

/**
 * Collapses the full lead status/scoring model into the 6-bucket board the
 * CEO scans in the field: New, Warm, Hot, Proposal Sent, Won, Lost.
 */
export function boardColumnForLead(lead: Lead): BoardColumn {
  if (lead.status === "won") return "Won";
  if (lead.status === "lost") return "Lost";
  if (lead.status === "proposal_sent" || lead.status === "negotiating") return "Proposal Sent";
  if (lead.close_probability != null) {
    if (lead.close_probability >= 70) return "Hot";
    if (lead.close_probability >= 40) return "Warm";
  }
  return "New";
}
