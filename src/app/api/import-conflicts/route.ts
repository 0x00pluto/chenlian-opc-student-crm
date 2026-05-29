export const runtime = "nodejs";

import { desc, eq } from "drizzle-orm";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { isAdminRole } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { importConflicts, students } from "@/lib/db/schema";

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!isAdminRole(user.role)) return jsonError("仅管理员可查看", 403);

  const db = ensureDb();
  const rows = await db
    .select({
      conflict: importConflicts,
      student: students,
    })
    .from(importConflicts)
    .innerJoin(students, eq(importConflicts.existingStudentId, students.id))
    .where(eq(importConflicts.status, "pending"))
    .orderBy(desc(importConflicts.id));

  return jsonOk({
    items: rows.map((r) => ({
      ...r.conflict,
      incomingData: JSON.parse(r.conflict.incomingData),
      existingStudent: r.student,
    })),
  });
}
