export const runtime = "nodejs";

import { desc } from "drizzle-orm";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canViewAuditLogs } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { auditLogs, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!canViewAuditLogs(user)) return jsonError("无权访问", 403);

  const db = ensureDb();
  const rows = await db
    .select({
      log: auditLogs,
      operatorName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.operatorId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  return jsonOk({
    items: rows.map((r) => ({
      ...r.log,
      payload: JSON.parse(r.log.payload),
      operatorName: r.operatorName,
    })),
  });
}
