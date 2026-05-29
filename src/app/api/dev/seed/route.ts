export const runtime = "nodejs";

import { runSeed } from "@/lib/seed";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "生产环境禁止种子写入" }, { status: 403 });
  }
  const result = await runSeed();
  return Response.json(result);
}
