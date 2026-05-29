export const runtime = "nodejs";

import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("未登录", 401);
  return jsonOk({
    id: user.userId,
    email: user.email,
    name: user.name,
    role: user.role,
    advisorId: user.advisorId,
  });
}
