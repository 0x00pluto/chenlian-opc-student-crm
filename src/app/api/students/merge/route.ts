export const runtime = "nodejs";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { isAdminRole } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { importConflicts, students } from "@/lib/db/schema";

const schema = z.object({
  conflictId: z.string(),
  strategy: z.enum(["keep_existing", "use_incoming", "skip"]),
  incomingName: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!isAdminRole(user.role)) return jsonError("仅管理员可合并", 403);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("参数无效");

  const db = ensureDb();
  const [conflict] = await db
    .select()
    .from(importConflicts)
    .where(eq(importConflicts.id, parsed.data.conflictId))
    .limit(1);

  if (!conflict || conflict.status !== "pending") {
    return jsonError("冲突记录不存在或已处理", 404);
  }

  if (parsed.data.strategy === "use_incoming") {
    const incoming = JSON.parse(conflict.incomingData) as { name?: string };
    const name = parsed.data.incomingName ?? incoming.name;
    if (name) {
      await db
        .update(students)
        .set({ name, updatedAt: new Date().toISOString() })
        .where(eq(students.id, conflict.existingStudentId));
    }
  }

  await db
    .update(importConflicts)
    .set({
      status: parsed.data.strategy === "skip" ? "skipped" : "resolved",
      resolvedAt: new Date().toISOString(),
    })
    .where(eq(importConflicts.id, parsed.data.conflictId));

  return jsonOk({ ok: true });
}
