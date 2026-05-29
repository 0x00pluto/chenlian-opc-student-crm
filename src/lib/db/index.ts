import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";

import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "opc.db");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

let sqlite: Database.Database | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance) {
    ensureDataDir();
    sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    dbInstance = drizzle(sqlite, { schema });
  }
  return dbInstance;
}

export function initSchema() {
  ensureDataDir();
  const db = getDb();
  const raw = sqlite!;

  raw.exec(`
    CREATE TABLE IF NOT EXISTS advisors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      wecom_userid TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      advisor_id TEXT REFERENCES advisors(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      assigned_advisor_id TEXT NOT NULL REFERENCES advisors(id),
      tags TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL DEFAULT 'manual',
      import_note TEXT,
      last_follow_up_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS students_advisor_idx ON students(assigned_advisor_id);
    CREATE TABLE IF NOT EXISTS course_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS course_series (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES course_categories(id),
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cohorts (
      id TEXT PRIMARY KEY,
      series_id TEXT NOT NULL REFERENCES course_series(id),
      name TEXT NOT NULL,
      requires_interview INTEGER NOT NULL DEFAULT 0,
      instructor_name TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT NOT NULL DEFAULT 'recruiting',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      cohort_id TEXT NOT NULL REFERENCES cohorts(id),
      cohort_snapshot_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress',
      alumni_status TEXT NOT NULL DEFAULT 'none',
      alumni_expires_at TEXT,
      completed_at TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS enrollments_student_idx ON enrollments(student_id);
    CREATE INDEX IF NOT EXISTS enrollments_status_idx ON enrollments(status);
    CREATE TABLE IF NOT EXISTS follow_up_logs (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      advisor_id TEXT NOT NULL REFERENCES advisors(id),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS student_ai_insights (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      trigger_type TEXT NOT NULL,
      trigger_ref_id TEXT,
      summary TEXT NOT NULL,
      next_talk TEXT NOT NULL,
      hooks TEXT NOT NULL,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS interview_records (
      id TEXT PRIMARY KEY,
      enrollment_id TEXT NOT NULL REFERENCES enrollments(id),
      result TEXT NOT NULL,
      comment TEXT,
      transcript TEXT,
      ai_extract TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      enrollment_id TEXT NOT NULL REFERENCES enrollments(id),
      session_date TEXT NOT NULL,
      session_label TEXT,
      note TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS certificate_issues (
      id TEXT PRIMARY KEY,
      enrollment_id TEXT NOT NULL REFERENCES enrollments(id),
      issued_at TEXT NOT NULL,
      note TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS retraining_records (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      series_id TEXT NOT NULL REFERENCES course_series(id),
      cohort_id TEXT NOT NULL REFERENCES cohorts(id),
      attended_at TEXT NOT NULL,
      note TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS wecom_bindings (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL UNIQUE REFERENCES students(id),
      external_userid TEXT NOT NULL,
      bound_at TEXT NOT NULL,
      bound_by TEXT REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      advisor_id TEXT NOT NULL REFERENCES advisors(id),
      direction TEXT NOT NULL,
      msg_type TEXT NOT NULL DEFAULT 'text',
      content TEXT NOT NULL,
      wecom_msg_id TEXT,
      sent_at TEXT NOT NULL,
      raw_payload TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      payload TEXT NOT NULL DEFAULT '{}',
      operator_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS import_batches (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'processing',
      total_rows INTEGER NOT NULL DEFAULT 0,
      created_count INTEGER NOT NULL DEFAULT 0,
      merged_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      pending_count INTEGER NOT NULL DEFAULT 0,
      operator_id TEXT NOT NULL REFERENCES users(id),
      report TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS import_conflicts (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL REFERENCES import_batches(id),
      phone TEXT NOT NULL,
      incoming_data TEXT NOT NULL,
      existing_student_id TEXT NOT NULL REFERENCES students(id),
      status TEXT NOT NULL DEFAULT 'pending',
      resolved_at TEXT
    );
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  try {
    raw.exec(
      `ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`,
    );
  } catch {
    /* column exists */
  }

  return db;
}

export function getSqlite() {
  getDb();
  return sqlite!;
}

export { schema, DB_PATH };
