import { NextResponse } from "next/server";

import type { SessionData } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/session";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser(): Promise<
  SessionData | NextResponse
> {
  const user = await getCurrentUser();
  if (!user) return jsonError("未登录", 401);
  return user;
}

export function isErrorResponse(
  value: SessionData | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse;
}
