export const runtime = "nodejs";

import { eq } from "drizzle-orm";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canAccessStudent } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { enrollments, students } from "@/lib/db/schema";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  const db = ensureDb();

  const [row] = await db
    .select({ enrollment: enrollments, student: students })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .where(eq(enrollments.id, id))
    .limit(1);

  if (!row) return jsonError("学籍不存在", 404);
  if (!canAccessStudent(user, row.student.assignedAdvisorId)) {
    return jsonError("无权操作", 403);
  }
  if (row.enrollment.status === "refunded") {
    return jsonError("已退费学籍不可结业");
  }

  const now = new Date();
  const completedAt = now.toISOString();
  const alumniExpiresAt = new Date(
    now.getTime() + 365 * 24 * 60 * 60 * 1000,
  ).toISOString();

  await db
    .update(enrollments)
    .set({
      status: "completed",
      completedAt,
      alumniStatus: "active",
      alumniExpiresAt,
      updatedAt: completedAt,
    })
    .where(eq(enrollments.id, id));

  return jsonOk({ status: "completed", completedAt, alumniExpiresAt });
}
