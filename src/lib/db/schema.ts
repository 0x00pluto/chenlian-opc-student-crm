import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
};

export const advisors = sqliteTable("advisors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  wecomUserid: text("wecom_userid"),
  status: text("status").notNull().default("active"),
  ...timestamps,
});

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    advisorId: text("advisor_id").references(() => advisors.id),
    status: text("status").notNull().default("active"),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const students = sqliteTable(
  "students",
  {
    id: text("id").primaryKey(),
    phone: text("phone").notNull(),
    name: text("name").notNull(),
    assignedAdvisorId: text("assigned_advisor_id")
      .notNull()
      .references(() => advisors.id),
    tags: text("tags").notNull().default("[]"),
    source: text("source").notNull().default("manual"),
    importNote: text("import_note"),
    lastFollowUpAt: text("last_follow_up_at"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("students_phone_idx").on(t.phone),
    index("students_advisor_idx").on(t.assignedAdvisorId),
  ],
);

export const courseCategories = sqliteTable("course_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const courseSeries = sqliteTable(
  "course_series",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => courseCategories.id),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("series_category_idx").on(t.categoryId)],
);

export const cohorts = sqliteTable(
  "cohorts",
  {
    id: text("id").primaryKey(),
    seriesId: text("series_id")
      .notNull()
      .references(() => courseSeries.id),
    name: text("name").notNull(),
    requiresInterview: integer("requires_interview", { mode: "boolean" })
      .notNull()
      .default(false),
    instructorName: text("instructor_name"),
    startDate: text("start_date"),
    endDate: text("end_date"),
    status: text("status").notNull().default("recruiting"),
    ...timestamps,
  },
  (t) => [index("cohorts_series_idx").on(t.seriesId)],
);

export const enrollments = sqliteTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    cohortId: text("cohort_id")
      .notNull()
      .references(() => cohorts.id),
    cohortSnapshotName: text("cohort_snapshot_name").notNull(),
    status: text("status").notNull().default("in_progress"),
    alumniStatus: text("alumni_status").notNull().default("none"),
    alumniExpiresAt: text("alumni_expires_at"),
    completedAt: text("completed_at"),
    createdBy: text("created_by").references(() => users.id),
    ...timestamps,
  },
  (t) => [
    index("enrollments_student_idx").on(t.studentId),
    index("enrollments_cohort_idx").on(t.cohortId),
    index("enrollments_status_idx").on(t.status),
  ],
);

export const followUpLogs = sqliteTable(
  "follow_up_logs",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    advisorId: text("advisor_id")
      .notNull()
      .references(() => advisors.id),
    content: text("content").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("follow_ups_student_idx").on(t.studentId)],
);

export const studentAiInsights = sqliteTable(
  "student_ai_insights",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    triggerType: text("trigger_type").notNull(),
    triggerRefId: text("trigger_ref_id"),
    summary: text("summary").notNull(),
    nextTalk: text("next_talk").notNull(),
    hooks: text("hooks").notNull(),
    createdBy: text("created_by").references(() => users.id),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("ai_insights_student_idx").on(t.studentId)],
);

export const interviewRecords = sqliteTable(
  "interview_records",
  {
    id: text("id").primaryKey(),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    result: text("result").notNull(),
    comment: text("comment"),
    transcript: text("transcript"),
    aiExtract: text("ai_extract"),
    createdBy: text("created_by").references(() => users.id),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("interview_enrollment_idx").on(t.enrollmentId)],
);

export const attendanceRecords = sqliteTable(
  "attendance_records",
  {
    id: text("id").primaryKey(),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    sessionDate: text("session_date").notNull(),
    sessionLabel: text("session_label"),
    note: text("note"),
    createdBy: text("created_by").references(() => users.id),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("attendance_enrollment_idx").on(t.enrollmentId)],
);

export const certificateIssues = sqliteTable(
  "certificate_issues",
  {
    id: text("id").primaryKey(),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    issuedAt: text("issued_at").notNull(),
    note: text("note"),
    createdBy: text("created_by").references(() => users.id),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
);

export const retrainingRecords = sqliteTable(
  "retraining_records",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    seriesId: text("series_id")
      .notNull()
      .references(() => courseSeries.id),
    cohortId: text("cohort_id")
      .notNull()
      .references(() => cohorts.id),
    attendedAt: text("attended_at").notNull(),
    note: text("note"),
    createdBy: text("created_by").references(() => users.id),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
);

export const wecomBindings = sqliteTable(
  "wecom_bindings",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    externalUserid: text("external_userid").notNull(),
    boundAt: text("bound_at").notNull(),
    boundBy: text("bound_by").references(() => users.id),
  },
  (t) => [uniqueIndex("wecom_student_idx").on(t.studentId)],
);

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    advisorId: text("advisor_id")
      .notNull()
      .references(() => advisors.id),
    direction: text("direction").notNull(),
    msgType: text("msg_type").notNull().default("text"),
    content: text("content").notNull(),
    wecomMsgId: text("wecom_msg_id"),
    sentAt: text("sent_at").notNull(),
    rawPayload: text("raw_payload"),
  },
  (t) => [index("chat_student_idx").on(t.studentId)],
);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  payload: text("payload").notNull().default("{}"),
  operatorId: text("operator_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const importBatches = sqliteTable("import_batches", {
  id: text("id").primaryKey(),
  status: text("status").notNull().default("processing"),
  totalRows: integer("total_rows").notNull().default(0),
  createdCount: integer("created_count").notNull().default(0),
  mergedCount: integer("merged_count").notNull().default(0),
  skippedCount: integer("skipped_count").notNull().default(0),
  pendingCount: integer("pending_count").notNull().default(0),
  operatorId: text("operator_id")
    .notNull()
    .references(() => users.id),
  report: text("report").notNull().default("{}"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const importConflicts = sqliteTable("import_conflicts", {
  id: text("id").primaryKey(),
  batchId: text("batch_id")
    .notNull()
    .references(() => importBatches.id),
  phone: text("phone").notNull(),
  incomingData: text("incoming_data").notNull(),
  existingStudentId: text("existing_student_id")
    .notNull()
    .references(() => students.id),
  status: text("status").notNull().default("pending"),
  resolvedAt: text("resolved_at"),
});

export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const advisorsRelations = relations(advisors, ({ many }) => ({
  students: many(students),
  users: many(users),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  advisor: one(advisors, {
    fields: [students.assignedAdvisorId],
    references: [advisors.id],
  }),
  enrollments: many(enrollments),
  followUps: many(followUpLogs),
  aiInsights: many(studentAiInsights),
  wecomBinding: one(wecomBindings),
  chatMessages: many(chatMessages),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id],
  }),
  cohort: one(cohorts, {
    fields: [enrollments.cohortId],
    references: [cohorts.id],
  }),
  interviews: many(interviewRecords),
  attendances: many(attendanceRecords),
  certificates: many(certificateIssues),
}));
