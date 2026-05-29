export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import Papa from "papaparse";
import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { isAdminRole } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import {
  advisors,
  auditLogs,
  importBatches,
  importConflicts,
  students,
} from "@/lib/db/schema";
import { normalizePhone } from "@/lib/phone";
import { stringifyTags } from "@/lib/tags";

export async function POST(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!isAdminRole(user.role)) return jsonError("仅管理员可导入", 403);

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return jsonError("请上传 CSV 文件");

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const db = ensureDb();
  const batchId = randomUUID();
  let created = 0;
  let merged = 0;
  let skipped = 0;
  let pending = 0;
  const failures: { row: number; reason: string }[] = [];

  let advisorId = user.advisorId;
  if (!advisorId && isAdminRole(user.role)) {
    const [first] = await db.select().from(advisors).limit(1);
    advisorId = first?.id ?? null;
  }
  if (!advisorId) return jsonError("当前账号未关联班主任，无法导入");

  await db.insert(importBatches).values({
    id: batchId,
    status: "processing",
    totalRows: parsed.data.length,
    operatorId: user.userId,
  });

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i];
    const phoneRaw = raw.phone ?? raw["手机号"] ?? "";
    const nameRaw = raw.name ?? raw["姓名"] ?? "";
    const note = raw.import_note ?? raw["备注"];

    if (!phoneRaw) {
      skipped++;
      failures.push({ row: i + 2, reason: "缺少手机号" });
      continue;
    }

    const phone = normalizePhone(phoneRaw);
    const name = nameRaw.trim();
    if (!name) {
      skipped++;
      failures.push({ row: i + 2, reason: "缺少姓名" });
      continue;
    }

    const [existing] = await db
      .select()
      .from(students)
      .where(eq(students.phone, phone))
      .limit(1);

    if (!existing) {
      await db.insert(students).values({
        id: randomUUID(),
        phone,
        name,
        assignedAdvisorId: advisorId,
        source: "hudongba",
        importNote: note,
        tags: stringifyTags([]),
      });
      created++;
      continue;
    }

    if (existing.name === name) {
      await db
        .update(students)
        .set({
          importNote: note ?? existing.importNote,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(students.id, existing.id));
      merged++;
    } else {
      await db.insert(importConflicts).values({
        id: randomUUID(),
        batchId,
        phone,
        incomingData: JSON.stringify({ name, import_note: note }),
        existingStudentId: existing.id,
      });
      pending++;
    }
  }

  await db
    .update(importBatches)
    .set({
      status: "completed",
      createdCount: created,
      mergedCount: merged,
      skippedCount: skipped,
      pendingCount: pending,
      report: JSON.stringify({ failures }),
    })
    .where(eq(importBatches.id, batchId));

  await db.insert(auditLogs).values({
    id: randomUUID(),
    action: "student_import",
    entityType: "import_batch",
    entityId: batchId,
    payload: JSON.stringify({
      batchId,
      created,
      merged,
      skipped,
      pending,
      failureCount: failures.length,
    }),
    operatorId: user.userId,
  });

  return jsonOk({
    batchId,
    created,
    merged,
    skipped,
    pending,
    failures,
  });
}
