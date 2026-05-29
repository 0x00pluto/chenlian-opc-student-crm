export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canAccessStudent, studentFilterAdvisorId } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { cohorts, enrollments, students } from "@/lib/db/schema";

const createSchema = z.object({
  studentId: z.string(),
  cohortId: z.string(),
});

export async function GET(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const cohortId = searchParams.get("cohortId");
  const db = ensureDb();
  const advisorFilter = studentFilterAdvisorId(user);

  const rows = await db
    .select({
      enrollment: enrollments,
      student: students,
      cohort: cohorts,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .innerJoin(cohorts, eq(enrollments.cohortId, cohorts.id))
    .where(
      and(
        studentId ? eq(enrollments.studentId, studentId) : undefined,
        cohortId ? eq(enrollments.cohortId, cohortId) : undefined,
        advisorFilter
          ? eq(students.assignedAdvisorId, advisorFilter)
          : undefined,
      ),
    )
    .orderBy(desc(enrollments.createdAt));

  return jsonOk({ items: rows });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("请选择学员和期班");

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

  const status = cohort.requiresInterview ? "pending_interview" : "in_progress";
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(enrollments).values({
    id,
    studentId: parsed.data.studentId,
    cohortId: parsed.data.cohortId,
    cohortSnapshotName: cohort.name,
    status,
    createdBy: user.userId,
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, id));

  return jsonOk(created, 201);
}
