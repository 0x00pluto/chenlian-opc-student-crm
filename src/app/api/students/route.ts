export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { and, desc, eq, like, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { isAdminRole, studentFilterAdvisorId } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { advisors, students } from "@/lib/db/schema";
import { normalizePhone } from "@/lib/phone";
import { stringifyTags } from "@/lib/tags";

const createSchema = z.object({
  phone: z.string().min(1),
  name: z.string().min(1),
  source: z.enum(["manual", "hudongba", "other"]).optional(),
  assignedAdvisorId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const advisorIdParam = searchParams.get("advisorId");
  const db = ensureDb();
  const advisorFilter = studentFilterAdvisorId(user);

  const conditions = [];
  if (advisorFilter) {
    conditions.push(eq(students.assignedAdvisorId, advisorFilter));
  } else if (advisorIdParam && isAdminRole(user.role)) {
    conditions.push(eq(students.assignedAdvisorId, advisorIdParam));
  }
  if (q) {
    conditions.push(
      or(like(students.name, `%${q}%`), like(students.phone, `%${q}%`))!,
    );
  }

  const rows = await db
    .select({
      student: students,
      advisorName: advisors.name,
    })
    .from(students)
    .leftJoin(advisors, eq(students.assignedAdvisorId, advisors.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(students.updatedAt));

  return jsonOk({
    items: rows.map((r) => ({
      ...r.student,
      advisorName: r.advisorName,
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("请填写姓名和手机号");

  const phone = normalizePhone(parsed.data.phone);
  const db = ensureDb();

  const [existing] = await db
    .select()
    .from(students)
    .where(eq(students.phone, phone))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "该手机号已存在", existingId: existing.id },
      { status: 409 },
    );
  }

  const assignedAdvisorId =
    parsed.data.assignedAdvisorId ??
    (user.role === "advisor" ? user.advisorId : null);

  if (!assignedAdvisorId) {
    return jsonError("请指定班主任");
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(students).values({
    id,
    phone,
    name: parsed.data.name.trim(),
    assignedAdvisorId,
    source: parsed.data.source ?? "manual",
    tags: stringifyTags(parsed.data.tags ?? []),
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await db.select().from(students).where(eq(students.id, id));
  return jsonOk(created, 201);
}
