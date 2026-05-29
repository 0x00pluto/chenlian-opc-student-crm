export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canTransferAdvisors } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { advisors, auditLogs, students } from "@/lib/db/schema";

const schema = z.object({
  targetAdvisorId: z.string(),
  studentIds: z.array(z.string()).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!canTransferAdvisors(user)) return jsonError("无权转移学员", 403);

  const { id: sourceAdvisorId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("请选择目标班主任");

  const db = ensureDb();
  const [source] = await db
    .select()
    .from(advisors)
    .where(eq(advisors.id, sourceAdvisorId))
    .limit(1);
  if (!source) return jsonError("源班主任不存在", 404);

  const [target] = await db
    .select()
    .from(advisors)
    .where(eq(advisors.id, parsed.data.targetAdvisorId))
    .limit(1);
  if (!target) return jsonError("目标班主任不存在", 404);

  let studentRows = await db
    .select()
    .from(students)
    .where(eq(students.assignedAdvisorId, sourceAdvisorId));

  if (parsed.data.studentIds?.length) {
    studentRows = studentRows.filter((s) =>
      parsed.data.studentIds!.includes(s.id),
    );
  }

  if (!studentRows.length) {
    return jsonError("没有可转移的学员");
  }

  const ids = studentRows.map((s) => s.id);
  const now = new Date().toISOString();

  await db
    .update(students)
    .set({
      assignedAdvisorId: parsed.data.targetAdvisorId,
      updatedAt: now,
    })
    .where(inArray(students.id, ids));

  await db.insert(auditLogs).values({
    id: randomUUID(),
    action: "advisor_transfer",
    entityType: "advisor",
    entityId: sourceAdvisorId,
    payload: JSON.stringify({
      sourceAdvisorId,
      targetAdvisorId: parsed.data.targetAdvisorId,
      studentIds: ids,
    }),
    operatorId: user.userId,
  });

  return jsonOk({ transferred: ids.length, studentIds: ids });
}
