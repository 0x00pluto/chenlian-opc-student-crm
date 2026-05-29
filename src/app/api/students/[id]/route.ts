export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canAccessStudent } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { advisors, auditLogs, students } from "@/lib/db/schema";
import { normalizePhone } from "@/lib/phone";
import { parseTags, stringifyTags } from "@/lib/tags";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  assignedAdvisorId: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  const db = ensureDb();

  const [row] = await db
    .select({
      student: students,
      advisorName: advisors.name,
    })
    .from(students)
    .leftJoin(advisors, eq(students.assignedAdvisorId, advisors.id))
    .where(eq(students.id, id))
    .limit(1);

  if (!row) return jsonError("学员不存在", 404);
  if (!canAccessStudent(user, row.student.assignedAdvisorId)) {
    return jsonError("无权访问", 403);
  }

  return jsonOk({
    ...row.student,
    tags: parseTags(row.student.tags),
    advisorName: row.advisorName,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("参数无效");

  const db = ensureDb();
  const [existing] = await db
    .select()
    .from(students)
    .where(eq(students.id, id))
    .limit(1);

  if (!existing) return jsonError("学员不存在", 404);
  if (!canAccessStudent(user, existing.assignedAdvisorId)) {
    return jsonError("无权访问", 403);
  }

  const updates: Partial<typeof students.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };

  if (parsed.data.name) updates.name = parsed.data.name.trim();
  if (parsed.data.tags) updates.tags = stringifyTags(parsed.data.tags);
  if (parsed.data.assignedAdvisorId) {
    updates.assignedAdvisorId = parsed.data.assignedAdvisorId;
  }

  if (parsed.data.phone) {
    const phone = normalizePhone(parsed.data.phone);
    if (phone !== existing.phone) {
      const [dup] = await db
        .select()
        .from(students)
        .where(eq(students.phone, phone))
        .limit(1);
      if (dup && dup.id !== id) {
        return jsonError("该手机号已被其他学员使用", 409);
      }
      await db.insert(auditLogs).values({
        id: randomUUID(),
        action: "student_phone_changed",
        entityType: "student",
        entityId: id,
        payload: JSON.stringify({
          from: existing.phone,
          to: phone,
        }),
        operatorId: user.userId,
      });
      updates.phone = phone;
    }
  }

  await db.update(students).set(updates).where(eq(students.id, id));
  const [updated] = await db.select().from(students).where(eq(students.id, id));
  return jsonOk({ ...updated, tags: parseTags(updated.tags) });
}
