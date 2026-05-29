export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canAccessStudent } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { attendanceRecords, enrollments, students } from "@/lib/db/schema";

const schema = z.object({
  sessionDate: z.string().min(1),
  sessionLabel: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(
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
    return jsonError("无权访问", 403);
  }

  const items = await db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.enrollmentId, id))
    .orderBy(desc(attendanceRecords.sessionDate));

  return jsonOk({ items });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("请填写上课日期");

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
    return jsonError("已退费学籍不可签到");
  }

  const recordId = randomUUID();
  await db.insert(attendanceRecords).values({
    id: recordId,
    enrollmentId: id,
    sessionDate: parsed.data.sessionDate,
    sessionLabel: parsed.data.sessionLabel,
    note: parsed.data.note,
    createdBy: user.userId,
  });

  return jsonOk({ id: recordId }, 201);
}
