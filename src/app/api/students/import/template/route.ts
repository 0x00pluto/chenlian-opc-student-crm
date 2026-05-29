export const runtime = "nodejs";

import { readFileSync } from "fs";
import path from "path";

import { isErrorResponse, requireUser } from "@/lib/api/http";
import { isAdminRole } from "@/lib/rbac";

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!isAdminRole(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const filePath = path.join(
    process.cwd(),
    "public/templates/hudongba-import.csv",
  );
  const content = readFileSync(filePath, "utf-8");

  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="hudongba-import-template.csv"',
    },
  });
}
