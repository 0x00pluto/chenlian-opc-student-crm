export const runtime = "nodejs";

import { asc, eq } from "drizzle-orm";

import { jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { ensureDb } from "@/lib/db/bootstrap";
import { cohorts, courseCategories, courseSeries } from "@/lib/db/schema";

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const db = ensureDb();
  const rows = await db
    .select({
      cohort: cohorts,
      seriesName: courseSeries.name,
      categoryName: courseCategories.name,
    })
    .from(cohorts)
    .innerJoin(courseSeries, eq(cohorts.seriesId, courseSeries.id))
    .innerJoin(courseCategories, eq(courseSeries.categoryId, courseCategories.id))
    .orderBy(asc(cohorts.startDate));

  return jsonOk({ items: rows });
}
