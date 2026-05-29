export const runtime = "nodejs";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canManageUsers } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { users } from "@/lib/db/schema";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["advisor", "admin", "super_admin"]).optional(),
  advisorId: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!canManageUsers(user)) return jsonError("无权管理用户", 403);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("参数无效");

  const db = ensureDb();
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return jsonError("用户不存在", 404);

  if (parsed.data.role && parsed.data.role !== "super_admin" && target.role === "super_admin") {
    const supers = await db
      .select()
      .from(users)
      .where(eq(users.role, "super_admin"));
    const activeSupers = supers.filter(
      (u) => (u.status ?? "active") === "active" && u.id !== id,
    );
    if (!activeSupers.length && parsed.data.status !== "inactive") {
      return jsonError("不能移除最后一个超级管理员", 400);
    }
  }

  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.role) updates.role = parsed.data.role;
  if (parsed.data.advisorId !== undefined) updates.advisorId = parsed.data.advisorId;
  if (parsed.data.status) updates.status = parsed.data.status;

  await db.update(users).set(updates).where(eq(users.id, id));
  const [updated] = await db.select().from(users).where(eq(users.id, id));
  return jsonOk({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
    advisorId: updated.advisorId,
    status: updated.status,
  });
}
