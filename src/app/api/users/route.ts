export const runtime = "nodejs";

import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canManageUsers } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { advisors, users } from "@/lib/db/schema";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["advisor", "admin", "super_admin"]),
  advisorId: z.string().optional(),
});

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!canManageUsers(user)) return jsonError("无权管理用户", 403);

  const db = ensureDb();
  const rows = await db
    .select({
      user: users,
      advisorName: advisors.name,
    })
    .from(users)
    .leftJoin(advisors, eq(users.advisorId, advisors.id))
    .orderBy(asc(users.email));

  return jsonOk({
    items: rows.map((r) => ({
      id: r.user.id,
      email: r.user.email,
      name: r.user.name,
      role: r.user.role,
      advisorId: r.user.advisorId,
      advisorName: r.advisorName,
      status: r.user.status ?? "active",
      createdAt: r.user.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!canManageUsers(user)) return jsonError("无权管理用户", 403);

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("请填写完整账号信息");

  if (parsed.data.role === "advisor" && !parsed.data.advisorId) {
    return jsonError("班主任角色需关联班主任档案");
  }

  const db = ensureDb();
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existing) return jsonError("邮箱已存在", 409);

  const id = randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await db.insert(users).values({
    id,
    email: parsed.data.email,
    passwordHash,
    name: parsed.data.name,
    role: parsed.data.role,
    advisorId: parsed.data.advisorId ?? null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  return jsonOk({ id, email: parsed.data.email }, 201);
}
