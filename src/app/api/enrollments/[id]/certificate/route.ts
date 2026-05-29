export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canAccessStudent } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { certificateIssues, enrollments, students } from "@/lib/db/schema";

const schema = z.object({
  note: z.string().optional(),
  issuedAt: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body ?? {});

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

  const issuedAt = parsed.success && parsed.data.issuedAt
    ? parsed.data.issuedAt
    : new Date().toISOString();

  const certId = randomUUID();
  await db.insert(certificateIssues).values({
    id: certId,
    enrollmentId: id,
    issuedAt,
    note: parsed.success ? parsed.data.note : undefined,
    createdBy: user.userId,
  });

  return jsonOk({ id: certId, issuedAt }, 201);
}
