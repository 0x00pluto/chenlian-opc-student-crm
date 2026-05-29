export const runtime = "nodejs";

import { desc, eq } from "drizzle-orm";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { isAdminRole } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { importBatches, users } from "@/lib/db/schema";

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!isAdminRole(user.role)) return jsonError("仅管理员可查看", 403);

  const db = ensureDb();
  const rows = await db
    .select({
      batch: importBatches,
      operatorName: users.name,
      operatorEmail: users.email,
    })
    .from(importBatches)
    .innerJoin(users, eq(importBatches.operatorId, users.id))
    .orderBy(desc(importBatches.createdAt))
    .limit(50);

  return jsonOk({
    items: rows.map((r) => ({
      ...r.batch,
      operatorName: r.operatorName,
      operatorEmail: r.operatorEmail,
    })),
  });
}
