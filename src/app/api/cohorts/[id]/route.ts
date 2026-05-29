export const runtime = "nodejs";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canManageCourseTree } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import {
  cohorts,
  courseCategories,
  courseSeries,
  enrollments,
  students,
} from "@/lib/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  const db = ensureDb();

  const [cohortRow] = await db
    .select({
      cohort: cohorts,
      seriesName: courseSeries.name,
      categoryName: courseCategories.name,
    })
    .from(cohorts)
    .innerJoin(courseSeries, eq(cohorts.seriesId, courseSeries.id))
    .innerJoin(courseCategories, eq(courseSeries.categoryId, courseCategories.id))
    .where(eq(cohorts.id, id))
    .limit(1);

  if (!cohortRow) return jsonError("期班不存在", 404);

  const enrollmentRows = await db
    .select({
      enrollment: enrollments,
      studentName: students.name,
      studentPhone: students.phone,
      studentId: students.id,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .where(eq(enrollments.cohortId, id));

  return jsonOk({
    ...cohortRow,
    enrollments: enrollmentRows,
  });
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  requiresInterview: z.boolean().optional(),
  instructorName: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!canManageCourseTree(user)) return jsonError("无权编辑期班", 403);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("参数无效");

  const db = ensureDb();
  const [existing] = await db
    .select()
    .from(cohorts)
    .where(eq(cohorts.id, id))
    .limit(1);
  if (!existing) return jsonError("期班不存在", 404);

  const updates: Partial<typeof cohorts.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.requiresInterview !== undefined)
    updates.requiresInterview = parsed.data.requiresInterview;
  if (parsed.data.instructorName !== undefined)
    updates.instructorName = parsed.data.instructorName;
  if (parsed.data.startDate !== undefined) updates.startDate = parsed.data.startDate;
  if (parsed.data.endDate !== undefined) updates.endDate = parsed.data.endDate;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  await db.update(cohorts).set(updates).where(eq(cohorts.id, id));
  const [updated] = await db.select().from(cohorts).where(eq(cohorts.id, id));
  return jsonOk(updated);
}
