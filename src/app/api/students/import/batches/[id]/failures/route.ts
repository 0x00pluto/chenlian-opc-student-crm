export const runtime = "nodejs";

import { eq } from "drizzle-orm";

import { jsonError, isErrorResponse, requireUser } from "@/lib/api/http";
import { isAdminRole } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { importBatches } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!isAdminRole(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const db = ensureDb();
  const [batch] = await db
    .select()
    .from(importBatches)
    .where(eq(importBatches.id, id))
    .limit(1);

  if (!batch) return jsonError("批次不存在", 404);

  let failures: { row: number; reason: string }[] = [];
  try {
    const report = JSON.parse(batch.report) as {
      failures?: { row: number; reason: string }[];
    };
    failures = report.failures ?? [];
  } catch {
    failures = [];
  }

  const lines = ["行号,失败原因", ...failures.map((f) => `${f.row},"${f.reason}"`)];
  const csv = lines.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="import-failures-${id}.csv"`,
    },
  });
}
