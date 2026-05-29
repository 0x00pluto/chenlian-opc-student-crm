export const runtime = "nodejs";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canManageUsers } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { users } from "@/lib/db/schema";

const schema = z.object({
  password: z.string().min(6).optional(),
});

function randomPassword() {
  return `Opc${Math.random().toString(36).slice(2, 10)}!`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!canManageUsers(user)) return jsonError("无权管理用户", 403);

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const plain =
    parsed.success && parsed.data.password
      ? parsed.data.password
      : randomPassword();

  const db = ensureDb();
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return jsonError("用户不存在", 404);

  const passwordHash = await bcrypt.hash(plain, 10);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date().toISOString() })
    .where(eq(users.id, id));

  return jsonOk({ temporaryPassword: plain });
}
