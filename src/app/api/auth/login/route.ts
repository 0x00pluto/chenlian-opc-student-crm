export const runtime = "nodejs";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/http";
import { ensureDb } from "@/lib/db/bootstrap";
import { users } from "@/lib/db/schema";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError("请输入有效邮箱和密码");

  const db = ensureDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (!user) return jsonError("账号或密码错误", 401);
  if ((user.status ?? "active") !== "active") {
    return jsonError("账号已停用", 403);
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return jsonError("账号或密码错误", 401);

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.role = user.role as typeof session.role;
  session.advisorId = user.advisorId;
  session.isLoggedIn = true;
  await session.save();

  return jsonOk({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      advisorId: user.advisorId,
    },
  });
}

export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
