import { db, nowIso } from "@/lib/db";
import { executeLoop, logActivity } from "./engine";
import type { Task } from "@/lib/types";

export interface QualityReviewInput {
  taskId: string;
  passed: boolean;
  reviewerNotes?: string;
}

export interface QualityReviewOutput {
  passed: boolean;
  notes: string;
  nextStatus: "done" | "needs_revision";
}

/** Loop 7: Quality Review Loop — records a pass/fail review and moves the task forward or back. */
export function runQualityReviewLoop(input: QualityReviewInput) {
  return executeLoop<QualityReviewInput, QualityReviewOutput>(
    {
      type: "quality_review",
      run: ({ taskId, passed, reviewerNotes }) => {
        const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as Task | undefined;
        if (!task) throw new Error(`Task ${taskId} not found`);

        const nextStatus = passed ? "done" : "needs_revision";
        const notes = reviewerNotes?.trim() || (passed ? "Meets acceptance criteria." : "Needs revision before acceptance.");
        const review = { passed, notes, reviewedAt: nowIso() };

        db.prepare(`UPDATE tasks SET review_json = ?, status = ?, updated_at = ? WHERE id = ?`).run(
          JSON.stringify(review),
          nextStatus,
          nowIso(),
          taskId
        );

        logActivity(
          "task",
          taskId,
          "reviewed",
          `Quality review: ${passed ? "PASSED" : "FAILED"} — ${notes}`
        );

        return {
          output: { passed, notes, nextStatus },
          context: { taskId, projectId: task.project_id },
        };
      },
    },
    input
  );
}
