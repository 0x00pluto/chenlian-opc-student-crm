import { and, eq, lt } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { enrollments } from "@/lib/db/schema";

type Db = ReturnType<typeof getDb>;

export async function refreshExpiredAlumni(db: Db) {
  const now = new Date().toISOString();
  await db
    .update(enrollments)
    .set({ alumniStatus: "expired", updatedAt: now })
    .where(
      and(
        eq(enrollments.alumniStatus, "active"),
        lt(enrollments.alumniExpiresAt, now),
      ),
    );
}
