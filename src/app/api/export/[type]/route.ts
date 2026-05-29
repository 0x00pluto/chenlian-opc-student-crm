export const runtime = "nodejs";

import { desc, eq } from "drizzle-orm";

import { jsonError, isErrorResponse, requireUser } from "@/lib/api/http";
import { studentFilterAdvisorId } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import {
  enrollments,
  followUpLogs,
  interviewRecords,
  students,
} from "@/lib/db/schema";

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  return lines.join("\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const { type } = await params;
  const db = ensureDb();
  const advisorFilter = studentFilterAdvisorId(user);

  let rows: Record<string, unknown>[] = [];

  if (type === "students") {
    const items = await db.select().from(students);
    rows = items
      .filter((s) =>
        advisorFilter ? s.assignedAdvisorId === advisorFilter : true,
      )
      .map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        source: s.source,
        lastFollowUpAt: s.lastFollowUpAt,
        tags: s.tags,
      }));
  } else if (type === "follow-ups") {
    const logs = await db
      .select()
      .from(followUpLogs)
      .orderBy(desc(followUpLogs.createdAt));
    for (const log of logs) {
      const [s] = await db
        .select()
        .from(students)
        .where(eq(students.id, log.studentId))
        .limit(1);
      if (!s) continue;
      if (advisorFilter && s.assignedAdvisorId !== advisorFilter) continue;
      rows.push({
        studentName: s.name,
        phone: s.phone,
        content: log.content,
        createdAt: log.createdAt,
      });
    }
  } else if (type === "enrollments") {
    const items = await db.select().from(enrollments);
    for (const e of items) {
      const [s] = await db
        .select()
        .from(students)
        .where(eq(students.id, e.studentId))
        .limit(1);
      if (!s) continue;
      if (advisorFilter && s.assignedAdvisorId !== advisorFilter) continue;
      rows.push({
        studentName: s.name,
        cohort: e.cohortSnapshotName,
        status: e.status,
        alumniStatus: e.alumniStatus,
        completedAt: e.completedAt,
      });
    }
  } else if (type === "interviews") {
    const items = await db.select().from(interviewRecords);
    for (const i of items) {
      const [e] = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.id, i.enrollmentId))
        .limit(1);
      if (!e) continue;
      const [s] = await db
        .select()
        .from(students)
        .where(eq(students.id, e.studentId))
        .limit(1);
      if (!s) continue;
      if (advisorFilter && s.assignedAdvisorId !== advisorFilter) continue;
      rows.push({
        studentName: s.name,
        cohort: e.cohortSnapshotName,
        result: i.result,
        comment: i.comment,
        createdAt: i.createdAt,
      });
    }
  } else {
    return jsonError("不支持的导出类型", 400);
  }

  const csv = toCsv(rows);
  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${Date.now()}.csv"`,
    },
  });
}
