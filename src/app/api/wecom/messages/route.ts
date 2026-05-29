export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canAccessStudent } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { chatMessages, students, wecomBindings } from "@/lib/db/schema";

const sendSchema = z.object({
  studentId: z.string(),
  content: z.string().min(1),
});

export async function GET(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) return jsonError("缺少 studentId");

  const db = ensureDb();
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) return jsonError("学员不存在", 404);
  if (!canAccessStudent(user, student.assignedAdvisorId)) {
    return jsonError("无权访问", 403);
  }

  const [binding] = await db
    .select()
    .from(wecomBindings)
    .where(eq(wecomBindings.studentId, studentId))
    .limit(1);

  const items = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.studentId, studentId))
    .orderBy(asc(chatMessages.sentAt));

  return jsonOk({ binding, items });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return jsonError("请填写消息内容");

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

  const [binding] = await db
    .select()
    .from(wecomBindings)
    .where(eq(wecomBindings.studentId, parsed.data.studentId))
    .limit(1);

  if (!binding) return jsonError("请先绑定企微客户", 400);

  const advisorId = user.advisorId ?? student.assignedAdvisorId;
  const now = new Date().toISOString();
  const msgId = randomUUID();

  await db.insert(chatMessages).values({
    id: msgId,
    studentId: parsed.data.studentId,
    advisorId,
    direction: "out",
    msgType: "text",
    content: parsed.data.content.trim(),
    wecomMsgId: `mock_${msgId}`,
    sentAt: now,
  });

  setTimeout(async () => {
    const db2 = ensureDb();
    await db2.insert(chatMessages).values({
      id: randomUUID(),
      studentId: parsed.data.studentId,
      advisorId,
      direction: "in",
      msgType: "text",
      content: "收到，谢谢老师！",
      wecomMsgId: `mock_reply_${Date.now()}`,
      sentAt: new Date().toISOString(),
    });
  }, 2000);

  return jsonOk({ id: msgId }, 201);
}
