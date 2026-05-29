export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { jsonError, jsonOk, isErrorResponse, requireUser } from "@/lib/api/http";
import { canManageCourseTree } from "@/lib/rbac";
import { ensureDb } from "@/lib/db/bootstrap";
import {
  cohorts,
  courseCategories,
  courseSeries,
  enrollments,
} from "@/lib/db/schema";

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const db = ensureDb();
  const categories = await db
    .select()
    .from(courseCategories)
    .orderBy(asc(courseCategories.sortOrder));
  const series = await db
    .select()
    .from(courseSeries)
    .orderBy(asc(courseSeries.sortOrder));
  const cohortRows = await db.select().from(cohorts);

  const tree = categories.map((cat) => ({
    ...cat,
    series: series
      .filter((s) => s.categoryId === cat.id)
      .map((s) => ({
        ...s,
        cohorts: cohortRows.filter((c) => c.seriesId === s.id),
      })),
  }));

  return jsonOk({ tree });
}

const createSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("category"),
    name: z.string().min(1),
    sortOrder: z.number().optional(),
  }),
  z.object({
    type: z.literal("series"),
    categoryId: z.string(),
    name: z.string().min(1),
    sortOrder: z.number().optional(),
  }),
  z.object({
    type: z.literal("cohort"),
    seriesId: z.string(),
    name: z.string().min(1),
    requiresInterview: z.boolean().optional(),
    instructorName: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.string().optional(),
  }),
]);

export async function POST(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!canManageCourseTree(user)) return jsonError("无权维护课程树", 403);

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("参数无效");

  const db = ensureDb();
  const now = new Date().toISOString();
  const id = randomUUID();

  if (parsed.data.type === "category") {
    await db.insert(courseCategories).values({
      id,
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  } else if (parsed.data.type === "series") {
    await db.insert(courseSeries).values({
      id,
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await db.insert(cohorts).values({
      id,
      seriesId: parsed.data.seriesId,
      name: parsed.data.name,
      requiresInterview: parsed.data.requiresInterview ?? false,
      instructorName: parsed.data.instructorName,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      status: parsed.data.status ?? "recruiting",
      createdAt: now,
      updatedAt: now,
    });
  }

  return jsonOk({ id }, 201);
}

const patchSchema = z.object({
  type: z.enum(["category", "series", "cohort"]),
  id: z.string(),
  name: z.string().optional(),
  requiresInterview: z.boolean().optional(),
  instructorName: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
});

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!canManageCourseTree(user)) return jsonError("无权维护课程树", 403);

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("参数无效");

  const db = ensureDb();
  const now = new Date().toISOString();

  if (parsed.data.type === "category" && parsed.data.name) {
    await db
      .update(courseCategories)
      .set({ name: parsed.data.name, updatedAt: now })
      .where(eq(courseCategories.id, parsed.data.id));
  } else if (parsed.data.type === "series" && parsed.data.name) {
    await db
      .update(courseSeries)
      .set({ name: parsed.data.name, updatedAt: now })
      .where(eq(courseSeries.id, parsed.data.id));
  } else if (parsed.data.type === "cohort") {
    const cohortUpdate: Partial<typeof cohorts.$inferInsert> = { updatedAt: now };
    if (parsed.data.name !== undefined) cohortUpdate.name = parsed.data.name;
    if (parsed.data.requiresInterview !== undefined)
      cohortUpdate.requiresInterview = parsed.data.requiresInterview;
    if (parsed.data.instructorName !== undefined)
      cohortUpdate.instructorName = parsed.data.instructorName;
    if (parsed.data.startDate !== undefined) cohortUpdate.startDate = parsed.data.startDate;
    if (parsed.data.endDate !== undefined) cohortUpdate.endDate = parsed.data.endDate;
    if (parsed.data.status !== undefined) cohortUpdate.status = parsed.data.status;
    await db
      .update(cohorts)
      .set(cohortUpdate)
      .where(eq(cohorts.id, parsed.data.id));
  }

  return jsonOk({ ok: true });
}

const deleteSchema = z.object({
  type: z.enum(["category", "series", "cohort"]),
  id: z.string(),
});

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  if (!canManageCourseTree(user)) return jsonError("无权维护课程树", 403);

  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return jsonError("参数无效");

  const db = ensureDb();

  if (parsed.data.type === "cohort") {
    const [enr] = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.cohortId, parsed.data.id))
      .limit(1);
    if (enr) {
      await db
        .update(cohorts)
        .set({ status: "archived", updatedAt: new Date().toISOString() })
        .where(eq(cohorts.id, parsed.data.id));
      return jsonOk({ archived: true });
    }
    await db.delete(cohorts).where(eq(cohorts.id, parsed.data.id));
    return jsonOk({ deleted: true });
  }

  if (parsed.data.type === "series") {
    const seriesCohorts = await db
      .select()
      .from(cohorts)
      .where(eq(cohorts.seriesId, parsed.data.id));
    if (seriesCohorts.length) {
      return jsonError("系列下存在期班，无法删除", 409);
    }
    await db.delete(courseSeries).where(eq(courseSeries.id, parsed.data.id));
    return jsonOk({ deleted: true });
  }

  const catSeries = await db
    .select()
    .from(courseSeries)
    .where(eq(courseSeries.categoryId, parsed.data.id));
  if (catSeries.length) {
    return jsonError("分类下存在系列，无法删除", 409);
  }
  await db.delete(courseCategories).where(eq(courseCategories.id, parsed.data.id));
  return jsonOk({ deleted: true });
}
