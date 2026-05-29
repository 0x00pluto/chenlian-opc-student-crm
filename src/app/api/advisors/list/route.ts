export const runtime = "nodejs";

import { eq } from "drizzle-orm";

import { jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { ensureDb } from "@/lib/db/bootstrap";
import { advisors } from "@/lib/db/schema";

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const db = ensureDb();
  const items = await db
    .select()
    .from(advisors)
    .where(eq(advisors.status, "active"));

  return jsonOk({ items });
}
