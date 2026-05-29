export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canAccessStudent } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import {
  cohorts,
  enrollments,
  interviewRecords,
  students,
} from "@/lib/db/schema";
import { generateInterviewExtract } from "@/lib/mock/ai";

const schema = z.object({
  result: z.enum(["passed", "failed"]),
  comment: z.string().optional(),
  transcript: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("请提交面试结论");

  const db = ensureDb();
  const [row] = await db
    .select({
      enrollment: enrollments,
      student: students,
      cohort: cohorts,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .innerJoin(cohorts, eq(enrollments.cohortId, cohorts.id))
    .where(eq(enrollments.id, id))
    .limit(1);

  if (!row) return jsonError("学籍不存在", 404);
  if (!canAccessStudent(user, row.student.assignedAdvisorId)) {
    return jsonError("无权操作", 403);
  }
  if (!row.cohort.requiresInterview) {
    return jsonError("该期班无需面试");
  }
  if (row.enrollment.status === "refunded") {
    return jsonError("已退费学籍不可操作");
  }

  const newStatus =
    parsed.data.result === "passed" ? "in_progress" : "interview_failed";
  const now = new Date().toISOString();
  const aiExtract = generateInterviewExtract({
    studentName: row.student.name,
    transcript: parsed.data.transcript,
    comment: parsed.data.comment,
  });

  await db.insert(interviewRecords).values({
    id: randomUUID(),
    enrollmentId: id,
    result: parsed.data.result,
    comment: parsed.data.comment,
    transcript: parsed.data.transcript,
    aiExtract,
    createdBy: user.userId,
    createdAt: now,
  });

  await db
    .update(enrollments)
    .set({ status: newStatus, updatedAt: now })
    .where(eq(enrollments.id, id));

  return jsonOk({ status: newStatus });
}
