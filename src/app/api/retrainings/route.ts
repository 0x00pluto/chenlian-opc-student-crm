export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canAccessStudent, studentFilterAdvisorId } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import {
  cohorts,
  courseSeries,
  enrollments,
  retrainingRecords,
  students,
  users,
} from "@/lib/db/schema";

export async function GET(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const cohortId = searchParams.get("cohortId");
  const db = ensureDb();
  const advisorFilter = studentFilterAdvisorId(user);

  const conditions = [];
  if (advisorFilter) {
    conditions.push(eq(students.assignedAdvisorId, advisorFilter));
  }
  if (studentId) {
    conditions.push(eq(retrainingRecords.studentId, studentId));
  }
  if (cohortId) {
    conditions.push(eq(retrainingRecords.cohortId, cohortId));
  }

  const rows = await db
    .select({
      record: retrainingRecords,
      studentName: students.name,
      cohortName: cohorts.name,
      seriesName: courseSeries.name,
      operatorName: users.name,
    })
    .from(retrainingRecords)
    .innerJoin(students, eq(retrainingRecords.studentId, students.id))
    .innerJoin(cohorts, eq(retrainingRecords.cohortId, cohorts.id))
    .innerJoin(courseSeries, eq(retrainingRecords.seriesId, courseSeries.id))
    .leftJoin(users, eq(retrainingRecords.createdBy, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(retrainingRecords.attendedAt));

  return jsonOk({
    items: rows.map((r) => ({
      ...r.record,
      studentName: r.studentName,
      cohortName: r.cohortName,
      seriesName: r.seriesName,
      operatorName: r.operatorName,
    })),
  });
}

const schema = z.object({
  studentId: z.string(),
  cohortId: z.string(),
  attendedAt: z.string().min(1),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("参数无效");

  const db = ensureDb();
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, parsed.data.studentId))
    .limit(1);
  if (!student) return jsonError("学员不存在", 404);
  if (!canAccessStudent(user, student.assignedAdvisorId)) {
    return jsonError("无权操作", 403);
  }

  const [cohort] = await db
    .select()
    .from(cohorts)
    .where(eq(cohorts.id, parsed.data.cohortId))
    .limit(1);
  if (!cohort) return jsonError("期班不存在", 404);

  const history = await db
    .select()
    .from(enrollments)
    .innerJoin(cohorts, eq(enrollments.cohortId, cohorts.id))
    .where(
      and(
        eq(enrollments.studentId, parsed.data.studentId),
        eq(cohorts.seriesId, cohort.seriesId),
        or(
          eq(enrollments.status, "completed"),
          eq(enrollments.status, "in_progress"),
        ),
      ),
    )
    .limit(1);

  if (!history.length) {
    return jsonError("学员在该系列无历史学籍，不可登记复训");
  }

  const id = randomUUID();
  await db.insert(retrainingRecords).values({
    id,
    studentId: parsed.data.studentId,
    seriesId: cohort.seriesId,
    cohortId: parsed.data.cohortId,
    attendedAt: parsed.data.attendedAt,
    note: parsed.data.note,
    createdBy: user.userId,
  });

  return jsonOk({ id }, 201);
}
