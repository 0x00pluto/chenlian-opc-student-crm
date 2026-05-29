export const runtime = "nodejs";

import { eq, sql } from "drizzle-orm";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canManageUsers } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { advisors, students } from "@/lib/db/schema";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!canManageUsers(user)) return jsonError("无权操作", 403);

  const { id } = await params;
  const db = ensureDb();

  const [countRow] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(students)
    .where(eq(students.assignedAdvisorId, id));

  if ((countRow?.count ?? 0) > 0) {
    return jsonError("请先完成学员转移后再停用", 400);
  }

  await db
    .update(advisors)
    .set({ status: "inactive", updatedAt: new Date().toISOString() })
    .where(eq(advisors.id, id));

  return jsonOk({ status: "inactive" });
}
