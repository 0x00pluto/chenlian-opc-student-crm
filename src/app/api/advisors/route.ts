export const runtime = "nodejs";

import { eq, sql } from "drizzle-orm";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { isAdminRole } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { advisors, students } from "@/lib/db/schema";

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!isAdminRole(user.role)) {
    return jsonError("无权访问", 403);
  }

  const db = ensureDb();
  const rows = await db
    .select({
      advisor: advisors,
      studentCount: sql<number>`count(${students.id})`.mapWith(Number),
    })
    .from(advisors)
    .leftJoin(students, eq(students.assignedAdvisorId, advisors.id))
    .groupBy(advisors.id);

  return jsonOk({
    items: rows.map((r) => ({
      ...r.advisor,
      studentCount: r.studentCount ?? 0,
    })),
  });
}
