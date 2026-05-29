export const runtime = "nodejs";

import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canConfigureWecom } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import { systemSettings } from "@/lib/db/schema";

const schema = z.object({
  corpId: z.string().optional(),
  agentId: z.string().optional(),
  mockEnabled: z.boolean().optional(),
});

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!canConfigureWecom(user)) return jsonError("无权访问", 403);

  const db = ensureDb();
  const rows = await db.select().from(systemSettings);
  const config: Record<string, string> = {};
  for (const r of rows) config[r.key] = r.value;

  return jsonOk({
    corpId: config.wecom_corp_id ?? "",
    agentId: config.wecom_agent_id ?? "",
    mockEnabled: config.wecom_mock !== "false",
  });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!canConfigureWecom(user)) return jsonError("无权操作", 403);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("参数无效");

  const db = ensureDb();
  const now = new Date().toISOString();
  const entries: { key: string; value: string }[] = [];

  if (parsed.data.corpId !== undefined) {
    entries.push({ key: "wecom_corp_id", value: parsed.data.corpId });
  }
  if (parsed.data.agentId !== undefined) {
    entries.push({ key: "wecom_agent_id", value: parsed.data.agentId });
  }
  if (parsed.data.mockEnabled !== undefined) {
    entries.push({
      key: "wecom_mock",
      value: parsed.data.mockEnabled ? "true" : "false",
    });
  }

  for (const e of entries) {
    await db
      .insert(systemSettings)
      .values({ key: e.key, value: e.value, updatedAt: now })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: e.value, updatedAt: now },
      });
  }

  return jsonOk({ ok: true });
}
