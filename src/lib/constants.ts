export const ROLES = ["advisor", "admin", "super_admin"] as const;
export type Role = (typeof ROLES)[number];

export const STUDENT_SOURCES = ["manual", "hudongba", "other"] as const;
export type StudentSource = (typeof STUDENT_SOURCES)[number];

export const ENROLLMENT_STATUSES = [
  "lead",
  "pending_interview",
  "interview_failed",
  "in_progress",
  "completed",
  "refunded",
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const ALUMNI_STATUSES = ["none", "active", "expired"] as const;
export type AlumniStatus = (typeof ALUMNI_STATUSES)[number];

export const COHORT_STATUSES = ["recruiting", "in_progress", "ended"] as const;

export const ADVISOR_STATUSES = ["active", "inactive"] as const;

export const INTERVIEW_RESULTS = ["passed", "failed"] as const;

export const AI_TRIGGER_TYPES = ["follow_up_saved", "manual"] as const;

export const CHAT_DIRECTIONS = ["in", "out"] as const;

export const DEFAULT_TAG_SIGNED_OPC = "签约_OPC";
