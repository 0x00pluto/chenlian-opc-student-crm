export const runtime = "nodejs";

import { desc, eq } from "drizzle-orm";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canAccessStudent } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import {
  attendanceRecords,
  cohorts,
  enrollments,
  students,
} from "@/lib/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const { id: cohortId } = await params;
  const db = ensureDb();

  const [cohort] = await db
    .select()
    .from(cohorts)
    .where(eq(cohorts.id, cohortId))
    .limit(1);
  if (!cohort) return jsonError("期班不存在", 404);

  const enrollmentRows = await db
    .select({
      enrollment: enrollments,
      student: students,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .where(eq(enrollments.cohortId, cohortId));

  const visibleRows = enrollmentRows.filter((row) =>
    canAccessStudent(user, row.student.assignedAdvisorId),
  );

  const items = await Promise.all(
    visibleRows.map(async (row) => {
      const records = await db
        .select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.enrollmentId, row.enrollment.id))
        .orderBy(desc(attendanceRecords.sessionDate));
      return {
        enrollmentId: row.enrollment.id,
        studentId: row.student.id,
        studentName: row.student.name,
        studentPhone: row.student.phone,
        enrollmentStatus: row.enrollment.status,
        records,
        lastSessionDate: records[0]?.sessionDate ?? null,
      };
    }),
  );

  return jsonOk({ cohort, items });
}
