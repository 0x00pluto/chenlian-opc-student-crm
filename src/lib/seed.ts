import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

import { getDb, getSqlite, initSchema } from "@/lib/db/index";
import {
  advisors,
  cohorts,
  courseCategories,
  courseSeries,
  enrollments,
  followUpLogs,
  studentAiInsights,
  students,
  users,
} from "@/lib/db/schema";
import { generateStudentInsight } from "@/lib/mock/ai";

export async function runSeed() {
  initSchema();
  const db = getDb();
  const sqlite = getSqlite();

  sqlite.exec(`
    DELETE FROM chat_messages;
    DELETE FROM wecom_bindings;
    DELETE FROM student_ai_insights;
    DELETE FROM follow_up_logs;
    DELETE FROM interview_records;
    DELETE FROM attendance_records;
    DELETE FROM certificate_issues;
    DELETE FROM retraining_records;
    DELETE FROM import_conflicts;
    DELETE FROM import_batches;
    DELETE FROM audit_logs;
    DELETE FROM enrollments;
    DELETE FROM students;
    DELETE FROM cohorts;
    DELETE FROM course_series;
    DELETE FROM course_categories;
    DELETE FROM users;
    DELETE FROM advisors;
    DELETE FROM system_settings;
  `);

  const advisor1Id = randomUUID();
  const advisor2Id = randomUUID();
  const category1Id = randomUUID();
  const category2Id = randomUUID();
  const series1Id = randomUUID();
  const series2Id = randomUUID();
  const cohort1Id = randomUUID();
  const cohort2Id = randomUUID();
  const cohort3Id = randomUUID();

  const passwordHash = await bcrypt.hash("123456", 10);
  const now = new Date().toISOString();

  await db.insert(advisors).values([
    { id: advisor1Id, name: "张班主任", wecomUserid: "zhang_advisor", status: "active" },
    { id: advisor2Id, name: "李班主任", wecomUserid: "li_advisor", status: "active" },
  ]);

  await db.insert(users).values([
    { id: randomUUID(), email: "super@chenlian.com", passwordHash, name: "系统超管", role: "super_admin" },
    { id: randomUUID(), email: "admin@chenlian.com", passwordHash, name: "业务管理员", role: "admin" },
    {
      id: randomUUID(),
      email: "zhang@chenlian.com",
      passwordHash,
      name: "张班主任",
      role: "advisor",
      advisorId: advisor1Id,
    },
    {
      id: randomUUID(),
      email: "li@chenlian.com",
      passwordHash,
      name: "李班主任",
      role: "advisor",
      advisorId: advisor2Id,
    },
  ]);

  await db.insert(courseCategories).values([
    { id: category1Id, name: "全能方向", sortOrder: 1 },
    { id: category2Id, name: "技能方向", sortOrder: 2 },
  ]);

  await db.insert(courseSeries).values([
    { id: series1Id, categoryId: category1Id, name: "全能训练营系列", sortOrder: 1 },
    { id: series2Id, categoryId: category2Id, name: "AI 技能提升系列", sortOrder: 1 },
  ]);

  await db.insert(cohorts).values([
    {
      id: cohort1Id,
      seriesId: series1Id,
      name: "全能训练营第 3 期",
      requiresInterview: true,
      instructorName: "王老师",
      startDate: "2026-03-01",
      status: "in_progress",
    },
    {
      id: cohort2Id,
      seriesId: series1Id,
      name: "全能训练营第 4 期",
      requiresInterview: false,
      instructorName: "刘老师",
      startDate: "2026-06-01",
      status: "recruiting",
    },
    {
      id: cohort3Id,
      seriesId: series2Id,
      name: "AI 技能班第 1 期",
      requiresInterview: false,
      instructorName: "陈老师",
      startDate: "2026-04-15",
      status: "in_progress",
    },
  ]);

  const studentRows = Array.from({ length: 10 }, (_, i) => ({
    id: randomUUID(),
    phone: `1380000${1001 + i}`,
    name: `学员${i + 1}`,
    assignedAdvisorId: i % 2 === 0 ? advisor1Id : advisor2Id,
    tags: i === 0 ? '["签约_OPC"]' : "[]",
    source: i < 3 ? "hudongba" : "manual",
    lastFollowUpAt: i < 5 ? now : null,
  }));

  await db.insert(students).values(studentRows);

  await db.insert(enrollments).values([
    {
      id: randomUUID(),
      studentId: studentRows[0].id,
      cohortId: cohort1Id,
      cohortSnapshotName: "全能训练营第 3 期",
      status: "in_progress",
    },
    {
      id: randomUUID(),
      studentId: studentRows[1].id,
      cohortId: cohort1Id,
      cohortSnapshotName: "全能训练营第 3 期",
      status: "pending_interview",
    },
    {
      id: randomUUID(),
      studentId: studentRows[2].id,
      cohortId: cohort3Id,
      cohortSnapshotName: "AI 技能班第 1 期",
      status: "completed",
      alumniStatus: "active",
      alumniExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: now,
    },
  ]);

  const followUp1Id = randomUUID();
  const followUp2Id = randomUUID();

  await db.insert(followUpLogs).values([
    {
      id: followUp1Id,
      studentId: studentRows[0].id,
      advisorId: advisor1Id,
      content: "学员对课程满意度较高，计划下周回访续报意向。",
      createdAt: now,
    },
    {
      id: followUp2Id,
      studentId: studentRows[1].id,
      advisorId: advisor1Id,
      content: "已发送面试资料，等待学员确认面试时间。",
      createdAt: now,
    },
  ]);

  const insight1 = generateStudentInsight({
    studentName: studentRows[0].name,
    followUpContent: "学员对课程满意度较高，计划下周回访续报意向。",
  });
  const insight2 = generateStudentInsight({
    studentName: studentRows[1].name,
    followUpContent: "已发送面试资料，等待学员确认面试时间。",
  });

  await db.insert(studentAiInsights).values([
    {
      id: randomUUID(),
      studentId: studentRows[0].id,
      triggerType: "follow_up_saved",
      triggerRefId: followUp1Id,
      summary: insight1.summary,
      nextTalk: insight1.nextTalk,
      hooks: insight1.hooks,
      createdAt: now,
    },
    {
      id: randomUUID(),
      studentId: studentRows[1].id,
      triggerType: "follow_up_saved",
      triggerRefId: followUp2Id,
      summary: insight2.summary,
      nextTalk: insight2.nextTalk,
      hooks: insight2.hooks,
      createdAt: now,
    },
  ]);

  return {
    ok: true,
    accounts: [
      { email: "super@chenlian.com", role: "超级管理员", password: "123456" },
      { email: "admin@chenlian.com", role: "业务管理员", password: "123456" },
      { email: "zhang@chenlian.com", role: "张班主任", password: "123456" },
      { email: "li@chenlian.com", role: "李班主任", password: "123456" },
    ],
  };
}
