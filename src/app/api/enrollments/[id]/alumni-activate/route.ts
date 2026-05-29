export const runtime = "nodejs";

import { eq } from "drizzle-orm";

import { randomUUID } from "crypto";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { isAdminRole } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { auditLogs, enrollments, students } from "@/lib/db/schema";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!isAdminRole(user.role)) return jsonError("仅管理员可激活校友", 403);

  const { id } = await params;
  const db = ensureDb();

  const [row] = await db
    .select({ enrollment: enrollments, student: students })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .where(eq(enrollments.id, id))
    .limit(1);

  if (!row) return jsonError("学籍不存在", 404);

  const now = new Date();
  const alumniExpiresAt = new Date(
    now.getTime() + 365 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const wasExpired = row.enrollment.alumniStatus === "expired";

  await db
    .update(enrollments)
    .set({
      alumniStatus: "active",
      alumniExpiresAt,
      updatedAt: now.toISOString(),
    })
    .where(eq(enrollments.id, id));

  await db.insert(auditLogs).values({
    id: randomUUID(),
    action: "alumni_activate",
    entityType: "enrollment",
    entityId: id,
    payload: JSON.stringify({
      studentId: row.student.id,
      wasExpired,
      alumniExpiresAt,
    }),
    operatorId: user.userId,
  });

  return jsonOk({ alumniStatus: "active", alumniExpiresAt });
}
