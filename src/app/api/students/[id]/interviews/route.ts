export const runtime = "nodejs";

import { desc, eq } from "drizzle-orm";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canAccessStudent } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import {
  enrollments,
  interviewRecords,
  students,
} from "@/lib/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const { id: studentId } = await params;
  const db = ensureDb();

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) return jsonError("学员不存在", 404);
  if (!canAccessStudent(user, student.assignedAdvisorId)) {
    return jsonError("无权访问", 403);
  }

  const rows = await db
    .select({
      interview: interviewRecords,
      enrollment: enrollments,
    })
    .from(interviewRecords)
    .innerJoin(enrollments, eq(interviewRecords.enrollmentId, enrollments.id))
    .where(eq(enrollments.studentId, studentId))
    .orderBy(desc(interviewRecords.createdAt));

  return jsonOk({
    items: rows.map((r) => ({
      ...r.interview,
      cohortSnapshotName: r.enrollment.cohortSnapshotName,
      enrollmentStatus: r.enrollment.status,
    })),
  });
}
