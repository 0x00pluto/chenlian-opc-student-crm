export const runtime = "nodejs";

/** 企微回调占位：V1.0 Mock 模式不处理真实事件 */
export async function POST() {
  return Response.json({ ok: true, mode: "mock" });
}
