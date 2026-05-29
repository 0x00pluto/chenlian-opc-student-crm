export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canAccessStudent } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { followUpLogs, studentAiInsights, students } from "@/lib/db/schema";
import { generateStudentInsight } from "@/lib/mock/ai";

const createSchema = z.object({
  content: z.string().min(1),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  const db = ensureDb();

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, id))
    .limit(1);
  if (!student) return jsonError("学员不存在", 404);
  if (!canAccessStudent(user, student.assignedAdvisorId)) {
    return jsonError("无权访问", 403);
  }

  const items = await db
    .select()
    .from(followUpLogs)
    .where(eq(followUpLogs.studentId, id))
    .orderBy(desc(followUpLogs.createdAt));

  return jsonOk({ items });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("请填写跟进内容");

  const db = ensureDb();
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, id))
    .limit(1);
  if (!student) return jsonError("学员不存在", 404);
  if (!canAccessStudent(user, student.assignedAdvisorId)) {
    return jsonError("无权访问", 403);
  }

  const advisorId = user.advisorId ?? student.assignedAdvisorId;
  const followUpId = randomUUID();
  const now = new Date().toISOString();

  await db.insert(followUpLogs).values({
    id: followUpId,
    studentId: id,
    advisorId,
    content: parsed.data.content.trim(),
    createdAt: now,
  });

  await db
    .update(students)
    .set({ lastFollowUpAt: now, updatedAt: now })
    .where(eq(students.id, id));

  const recent = await db
    .select()
    .from(followUpLogs)
    .where(eq(followUpLogs.studentId, id))
    .orderBy(desc(followUpLogs.createdAt))
    .limit(5);

  const insight = generateStudentInsight({
    studentName: student.name,
    followUpContent: parsed.data.content,
    recentFollowUps: recent.map((f) => f.content),
  });

  await db.insert(studentAiInsights).values({
    id: randomUUID(),
    studentId: id,
    triggerType: "follow_up_saved",
    triggerRefId: followUpId,
    summary: insight.summary,
    nextTalk: insight.nextTalk,
    hooks: insight.hooks,
    createdBy: user.userId,
    createdAt: now,
  });

  return jsonOk({ id: followUpId }, 201);
}
