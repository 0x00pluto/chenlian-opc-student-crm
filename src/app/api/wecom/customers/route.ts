export const runtime = "nodejs";

import { jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { searchMockCustomers } from "@/lib/mock/wecom";

export async function GET(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  return jsonOk({ items: searchMockCustomers(q) });
}
