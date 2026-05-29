export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canAccessStudent } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { students, wecomBindings } from "@/lib/db/schema";
import { getMockCustomer } from "@/lib/mock/wecom";

const schema = z.object({
  studentId: z.string(),
  externalUserid: z.string(),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("参数无效");

  const customer = getMockCustomer(parsed.data.externalUserid);
  if (!customer) return jsonError("企微客户不存在", 404);

  const db = ensureDb();
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, parsed.data.studentId))
    .limit(1);

  if (!student) return jsonError("学员不存在", 404);
  if (!canAccessStudent(user, student.assignedAdvisorId)) {
    return jsonError("无权操作", 403);
  }

  const now = new Date().toISOString();
  await db.delete(wecomBindings).where(eq(wecomBindings.studentId, parsed.data.studentId));

  await db.insert(wecomBindings).values({
    id: randomUUID(),
    studentId: parsed.data.studentId,
    externalUserid: parsed.data.externalUserid,
    boundAt: now,
    boundBy: user.userId,
  });

  return jsonOk({ bound: true, externalUserid: parsed.data.externalUserid });
}
