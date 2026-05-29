export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canAccessStudent } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { followUpLogs, studentAiInsights, students } from "@/lib/db/schema";
import { generateStudentInsight } from "@/lib/mock/ai";

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
    .from(studentAiInsights)
    .where(eq(studentAiInsights.studentId, id))
    .orderBy(desc(studentAiInsights.createdAt));

  return jsonOk({ items });
}

export async function POST(
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

  const recent = await db
    .select()
    .from(followUpLogs)
    .where(eq(followUpLogs.studentId, id))
    .orderBy(desc(followUpLogs.createdAt))
    .limit(5);

  const insight = generateStudentInsight({
    studentName: student.name,
    recentFollowUps: recent.map((f) => f.content),
  });

  const now = new Date().toISOString();
  const insightId = randomUUID();

  await db.insert(studentAiInsights).values({
    id: insightId,
    studentId: id,
    triggerType: "manual",
    summary: insight.summary,
    nextTalk: insight.nextTalk,
    hooks: insight.hooks,
    createdBy: user.userId,
    createdAt: now,
  });

  const [created] = await db
    .select()
    .from(studentAiInsights)
    .where(eq(studentAiInsights.id, insightId));

  return jsonOk(created, 201);
}
