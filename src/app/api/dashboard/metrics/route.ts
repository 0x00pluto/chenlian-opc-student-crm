export const runtime = "nodejs";

import { and, eq, gte, lte } from "drizzle-orm";

import { jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { refreshExpiredAlumni } from "@/lib/alumni";
import { canViewAllStudents, isAdminRole, studentFilterAdvisorId } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import {
  advisors,
  auditLogs,
  cohorts,
  enrollments,
  followUpLogs,
  interviewRecords,
  students,
} from "@/lib/db/schema";

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function GET(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(request.url);
  const { start, end } = monthRange();
  const rangeStart = searchParams.get("from") ?? start;
  const rangeEnd = searchParams.get("to") ?? end;
  const advisorIdParam = searchParams.get("advisorId");
  const advisorFilter = studentFilterAdvisorId(user);

  const db = ensureDb();
  await refreshExpiredAlumni(db);

  let scopeAdvisorId: string | null = advisorFilter;
  if (!advisorFilter && advisorIdParam && isAdminRole(user.role)) {
    scopeAdvisorId = advisorIdParam;
  }

  const studentScope = scopeAdvisorId
    ? eq(students.assignedAdvisorId, scopeAdvisorId)
    : undefined;

  const allStudents = await db
    .select()
    .from(students)
    .where(studentScope);

  const newStudentsInPeriod = allStudents.filter(
    (s) => s.createdAt >= rangeStart && s.createdAt <= rangeEnd,
  ).length;

  const enrollmentRows = await db
    .select({
      enrollment: enrollments,
      student: students,
      cohort: cohorts,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .innerJoin(cohorts, eq(enrollments.cohortId, cohorts.id))
    .where(studentScope);

  const newEnrollments = enrollmentRows.filter(
    (r) =>
      r.enrollment.createdAt >= rangeStart &&
      r.enrollment.createdAt <= rangeEnd,
  );

  const m1 =
    newStudentsInPeriod > 0
      ? (newEnrollments.length / newStudentsInPeriod) * 100
      : 0;

  const m2Den = newEnrollments.length;
  const m2Num = newEnrollments.filter(
    (r) => r.enrollment.status === "in_progress" || r.enrollment.status === "completed",
  ).length;
  const m2 = m2Den > 0 ? (m2Num / m2Den) * 100 : 0;

  const m3Num = enrollmentRows.filter(
    (r) =>
      r.enrollment.status === "completed" &&
      r.enrollment.completedAt &&
      r.enrollment.completedAt >= rangeStart &&
      r.enrollment.completedAt <= rangeEnd,
  ).length;
  const m3Den = enrollmentRows.filter(
    (r) => r.enrollment.status === "in_progress" || r.enrollment.status === "completed",
  ).length;
  const m3 = m3Den > 0 ? (m3Num / m3Den) * 100 : 0;

  const interviewEnrollments = enrollmentRows.filter((r) => r.cohort.requiresInterview);
  const interviews = await db.select().from(interviewRecords);
  const interviewEnrollmentIds = new Set(interviews.map((i) => i.enrollmentId));
  const withResult = interviewEnrollments.filter((r) =>
    interviewEnrollmentIds.has(r.enrollment.id),
  );
  const passed = interviews.filter((i) => i.result === "passed").length;
  const m4 = withResult.length > 0 ? (passed / withResult.length) * 100 : 0;

  const alumniActivations = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.action, "alumni_activate"),
        gte(auditLogs.createdAt, rangeStart),
        lte(auditLogs.createdAt, rangeEnd),
      ),
    );

  const scopedStudentIds = new Set(allStudents.map((s) => s.id));
  const m5Numerator = alumniActivations.filter((log) => {
    try {
      const payload = JSON.parse(log.payload) as {
        wasExpired?: boolean;
        studentId?: string;
      };
      if (!payload.wasExpired) return false;
      if (payload.studentId && !scopedStudentIds.has(payload.studentId)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }).length;

  const m5Denominator = enrollmentRows.filter(
    (r) =>
      r.enrollment.alumniExpiresAt &&
      r.enrollment.alumniExpiresAt >= rangeStart &&
      r.enrollment.alumniExpiresAt <= rangeEnd &&
      r.enrollment.status === "completed",
  ).length;

  const m5 =
    m5Denominator > 0 ? (m5Numerator / m5Denominator) * 100 : 0;

  const activeStudentIds = new Set(
    enrollmentRows
      .filter((r) => ["in_progress", "pending_interview"].includes(r.enrollment.status))
      .map((r) => r.student.id),
  );

  const followedStudentIds = new Set<string>();
  for (const sid of activeStudentIds) {
    const [log] = await db
      .select()
      .from(followUpLogs)
      .where(
        and(
          eq(followUpLogs.studentId, sid),
          gte(followUpLogs.createdAt, rangeStart),
          lte(followUpLogs.createdAt, rangeEnd),
        ),
      )
      .limit(1);
    if (log) followedStudentIds.add(sid);
  }

  const m6 =
    activeStudentIds.size > 0
      ? (followedStudentIds.size / activeStudentIds.size) * 100
      : 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const pendingFollowUp = allStudents.filter((s) => {
    const active = enrollmentRows.some(
      (r) =>
        r.student.id === s.id &&
        ["in_progress", "pending_interview"].includes(r.enrollment.status),
    );
    if (!active) return false;
    return !s.lastFollowUpAt || s.lastFollowUpAt < thirtyDaysAgo;
  });

  const alumniExpiring = enrollmentRows.filter(
    (r) =>
      r.enrollment.alumniStatus === "active" &&
      r.enrollment.alumniExpiresAt &&
      r.enrollment.alumniExpiresAt <=
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  );

  let advisorName: string | null = null;
  if (scopeAdvisorId) {
    const [adv] = await db
      .select()
      .from(advisors)
      .where(eq(advisors.id, scopeAdvisorId))
      .limit(1);
    advisorName = adv?.name ?? null;
  }

  return jsonOk({
    period: { from: rangeStart, to: rangeEnd },
    scope: canViewAllStudents(user) ? "team" : "personal",
    advisorId: scopeAdvisorId,
    advisorName,
    metrics: {
      m1: { label: "线索→报名转化率", value: Math.round(m1 * 10) / 10 },
      m2: { label: "报名→开课转化率", value: Math.round(m2 * 10) / 10 },
      m3: { label: "开课→结业转化率", value: Math.round(m3 * 10) / 10 },
      m4: { label: "面试通过率", value: Math.round(m4 * 10) / 10 },
      m5: { label: "校友激活率", value: m5 },
      m6: { label: "跟进覆盖率", value: Math.round(m6 * 10) / 10 },
    },
    pendingFollowUp: pendingFollowUp.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      lastFollowUpAt: s.lastFollowUpAt,
    })),
    alumniExpiring: alumniExpiring.map((r) => ({
      enrollmentId: r.enrollment.id,
      studentName: r.student.name,
      cohortName: r.enrollment.cohortSnapshotName,
      alumniExpiresAt: r.enrollment.alumniExpiresAt,
    })),
  });
}
