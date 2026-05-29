import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

import { getDb, getSqlite, initSchema } from "@/lib/db/index";
import {
  advisors,
  attendanceRecords,
  auditLogs,
  certificateIssues,
  chatMessages,
  cohorts,
  courseCategories,
  courseSeries,
  enrollments,
  followUpLogs,
  importBatches,
  importConflicts,
  interviewRecords,
  retrainingRecords,
  studentAiInsights,
  students,
  systemSettings,
  users,
  wecomBindings,
} from "@/lib/db/schema";
import {
  generateInterviewExtract,
  generateStudentInsight,
} from "@/lib/mock/ai";

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function dateOnly(iso: string) {
  return iso.slice(0, 10);
}

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

  const passwordHash = await bcrypt.hash("123456", 10);
  const now = new Date().toISOString();

  const advisor1Id = randomUUID();
  const advisor2Id = randomUUID();
  const advisor3Id = randomUUID();

  const superUserId = randomUUID();
  const adminUserId = randomUUID();
  const zhangUserId = randomUUID();
  const liUserId = randomUUID();

  const category1Id = randomUUID();
  const category2Id = randomUUID();
  const series1Id = randomUUID();
  const series2Id = randomUUID();
  const cohort1Id = randomUUID();
  const cohort2Id = randomUUID();
  const cohort3Id = randomUUID();
  const cohortArchivedId = randomUUID();

  await db.insert(advisors).values([
    {
      id: advisor1Id,
      name: "张班主任",
      wecomUserid: "zhang_advisor",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: advisor2Id,
      name: "李班主任",
      wecomUserid: "li_advisor",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: advisor3Id,
      name: "王班主任（已离职）",
      wecomUserid: "wang_advisor",
      status: "inactive",
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.insert(users).values([
    {
      id: superUserId,
      email: "super@chenlian.com",
      passwordHash,
      name: "系统超管",
      role: "super_admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: adminUserId,
      email: "admin@chenlian.com",
      passwordHash,
      name: "业务管理员",
      role: "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: zhangUserId,
      email: "zhang@chenlian.com",
      passwordHash,
      name: "张班主任",
      role: "advisor",
      advisorId: advisor1Id,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: liUserId,
      email: "li@chenlian.com",
      passwordHash,
      name: "李班主任",
      role: "advisor",
      advisorId: advisor2Id,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.insert(courseCategories).values([
    {
      id: category1Id,
      name: "全能方向",
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: category2Id,
      name: "技能方向",
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.insert(courseSeries).values([
    {
      id: series1Id,
      categoryId: category1Id,
      name: "全能训练营系列",
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: series2Id,
      categoryId: category2Id,
      name: "AI 技能提升系列",
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.insert(cohorts).values([
    {
      id: cohortArchivedId,
      seriesId: series1Id,
      name: "全能训练营第 2 期",
      requiresInterview: true,
      instructorName: "赵老师",
      startDate: "2025-09-01",
      endDate: "2025-12-01",
      status: "archived",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: cohort1Id,
      seriesId: series1Id,
      name: "全能训练营第 3 期",
      requiresInterview: true,
      instructorName: "王老师",
      startDate: "2026-03-01",
      endDate: "2026-06-30",
      status: "in_progress",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: cohort2Id,
      seriesId: series1Id,
      name: "全能训练营第 4 期",
      requiresInterview: false,
      instructorName: "刘老师",
      startDate: "2026-06-01",
      status: "recruiting",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: cohort3Id,
      seriesId: series2Id,
      name: "AI 技能班第 1 期",
      requiresInterview: false,
      instructorName: "陈老师",
      startDate: "2026-04-15",
      endDate: "2026-08-15",
      status: "in_progress",
      createdAt: now,
      updatedAt: now,
    },
  ]);

  const studentSpecs = [
    { name: "学员1", tags: ["签约_OPC"], source: "hudongba" as const, advisor: advisor1Id, lastFollowUpDaysAgo: 1 },
    { name: "学员2", tags: [], source: "hudongba" as const, advisor: advisor2Id, lastFollowUpDaysAgo: 2 },
    { name: "学员3", tags: [], source: "hudongba" as const, advisor: advisor1Id, lastFollowUpDaysAgo: 3 },
    { name: "学员4", tags: ["签约_OPC"], source: "manual" as const, advisor: advisor2Id, lastFollowUpDaysAgo: 5 },
    { name: "学员5", tags: [], source: "manual" as const, advisor: advisor1Id, lastFollowUpDaysAgo: 10 },
    { name: "学员6", tags: [], source: "manual" as const, advisor: advisor2Id, lastFollowUpDaysAgo: null },
    { name: "学员7", tags: [], source: "other" as const, advisor: advisor1Id, lastFollowUpDaysAgo: null },
    { name: "学员8", tags: ["签约_OPC"], source: "manual" as const, advisor: advisor2Id, lastFollowUpDaysAgo: 40 },
    { name: "学员9", tags: [], source: "hudongba" as const, advisor: advisor1Id, lastFollowUpDaysAgo: 45 },
    { name: "学员10", tags: [], source: "manual" as const, advisor: advisor2Id, lastFollowUpDaysAgo: 7 },
    { name: "学员11", tags: [], source: "manual" as const, advisor: advisor1Id, lastFollowUpDaysAgo: 15 },
    { name: "学员12", tags: [], source: "hudongba" as const, advisor: advisor2Id, lastFollowUpDaysAgo: 20 },
    { name: "学员13", tags: ["签约_OPC"], source: "manual" as const, advisor: advisor1Id, lastFollowUpDaysAgo: 4 },
    { name: "学员14", tags: [], source: "other" as const, advisor: advisor2Id, lastFollowUpDaysAgo: null },
    { name: "学员15", tags: [], source: "manual" as const, advisor: advisor1Id, lastFollowUpDaysAgo: 8 },
    { name: "学员16", tags: [], source: "hudongba" as const, advisor: advisor2Id, lastFollowUpDaysAgo: 12 },
    { name: "学员17", tags: [], source: "manual" as const, advisor: advisor1Id, lastFollowUpDaysAgo: 35 },
    { name: "学员18", tags: [], source: "manual" as const, advisor: advisor2Id, lastFollowUpDaysAgo: 50 },
  ];

  const studentRows = studentSpecs.map((spec, i) => ({
    id: randomUUID(),
    phone: `1380000${1001 + i}`,
    name: spec.name,
    assignedAdvisorId: spec.advisor,
    tags: JSON.stringify(spec.tags),
    source: spec.source,
    importNote: spec.source === "hudongba" ? "互动吧活动报名" : null,
    lastFollowUpAt:
      spec.lastFollowUpDaysAgo === null
        ? null
        : daysAgo(spec.lastFollowUpDaysAgo),
    createdAt: daysAgo(60 - i),
    updatedAt: now,
  }));

  await db.insert(students).values(studentRows);

  const s = (i: number) => studentRows[i];

  const enr = {
    s0_c1: randomUUID(),
    s0_c2: randomUUID(),
    s1_c1_pending: randomUUID(),
    s2_c3_active: randomUUID(),
    s3_c3_expired: randomUUID(),
    s4_c1_failed: randomUUID(),
    s5_c2_refund: randomUUID(),
    s6_c1: randomUUID(),
    s7_c2: randomUUID(),
    s8_archived: randomUUID(),
    s8_c2: randomUUID(),
    s9_c3: randomUUID(),
    s10_c1: randomUUID(),
    s11_c2: randomUUID(),
    s12_c3: randomUUID(),
    s13_c1: randomUUID(),
    s14_c3: randomUUID(),
    s15_c1: randomUUID(),
    s16_c2: randomUUID(),
    s17_c3: randomUUID(),
  };

  await db.insert(enrollments).values([
    {
      id: enr.s0_c1,
      studentId: s(0).id,
      cohortId: cohort1Id,
      cohortSnapshotName: "全能训练营第 3 期",
      status: "in_progress",
      createdBy: zhangUserId,
      createdAt: daysAgo(30),
      updatedAt: now,
    },
    {
      id: enr.s0_c2,
      studentId: s(0).id,
      cohortId: cohort2Id,
      cohortSnapshotName: "全能训练营第 4 期",
      status: "in_progress",
      createdBy: zhangUserId,
      createdAt: daysAgo(5),
      updatedAt: now,
    },
    {
      id: enr.s1_c1_pending,
      studentId: s(1).id,
      cohortId: cohort1Id,
      cohortSnapshotName: "全能训练营第 3 期",
      status: "pending_interview",
      createdBy: liUserId,
      createdAt: daysAgo(7),
      updatedAt: now,
    },
    {
      id: enr.s2_c3_active,
      studentId: s(2).id,
      cohortId: cohort3Id,
      cohortSnapshotName: "AI 技能班第 1 期",
      status: "completed",
      alumniStatus: "active",
      alumniExpiresAt: daysFromNow(18),
      completedAt: daysAgo(350),
      createdBy: zhangUserId,
      createdAt: daysAgo(360),
      updatedAt: now,
    },
    {
      id: enr.s3_c3_expired,
      studentId: s(3).id,
      cohortId: cohort3Id,
      cohortSnapshotName: "AI 技能班第 1 期",
      status: "completed",
      alumniStatus: "expired",
      alumniExpiresAt: daysAgo(10),
      completedAt: daysAgo(400),
      createdBy: zhangUserId,
      createdAt: daysAgo(410),
      updatedAt: now,
    },
    {
      id: enr.s4_c1_failed,
      studentId: s(4).id,
      cohortId: cohort1Id,
      cohortSnapshotName: "全能训练营第 3 期",
      status: "interview_failed",
      createdBy: liUserId,
      createdAt: daysAgo(20),
      updatedAt: now,
    },
    {
      id: enr.s5_c2_refund,
      studentId: s(5).id,
      cohortId: cohort2Id,
      cohortSnapshotName: "全能训练营第 4 期",
      status: "refunded",
      createdBy: zhangUserId,
      createdAt: daysAgo(15),
      updatedAt: now,
    },
    {
      id: enr.s6_c1,
      studentId: s(6).id,
      cohortId: cohort1Id,
      cohortSnapshotName: "全能训练营第 3 期",
      status: "in_progress",
      createdBy: liUserId,
      createdAt: daysAgo(25),
      updatedAt: now,
    },
    {
      id: enr.s7_c2,
      studentId: s(7).id,
      cohortId: cohort2Id,
      cohortSnapshotName: "全能训练营第 4 期",
      status: "pending_interview",
      createdBy: zhangUserId,
      createdAt: daysAgo(3),
      updatedAt: now,
    },
    {
      id: enr.s8_archived,
      studentId: s(8).id,
      cohortId: cohortArchivedId,
      cohortSnapshotName: "全能训练营第 2 期",
      status: "completed",
      alumniStatus: "expired",
      alumniExpiresAt: daysAgo(90),
      completedAt: daysAgo(200),
      createdBy: liUserId,
      createdAt: daysAgo(220),
      updatedAt: now,
    },
    {
      id: enr.s8_c2,
      studentId: s(8).id,
      cohortId: cohort2Id,
      cohortSnapshotName: "全能训练营第 4 期",
      status: "in_progress",
      createdBy: liUserId,
      createdAt: daysAgo(10),
      updatedAt: now,
    },
    {
      id: enr.s9_c3,
      studentId: s(9).id,
      cohortId: cohort3Id,
      cohortSnapshotName: "AI 技能班第 1 期",
      status: "in_progress",
      createdBy: zhangUserId,
      createdAt: daysAgo(40),
      updatedAt: now,
    },
    {
      id: enr.s10_c1,
      studentId: s(10).id,
      cohortId: cohort1Id,
      cohortSnapshotName: "全能训练营第 3 期",
      status: "in_progress",
      createdBy: liUserId,
      createdAt: daysAgo(12),
      updatedAt: now,
    },
    {
      id: enr.s11_c2,
      studentId: s(11).id,
      cohortId: cohort2Id,
      cohortSnapshotName: "全能训练营第 4 期",
      status: "in_progress",
      createdBy: zhangUserId,
      createdAt: daysAgo(8),
      updatedAt: now,
    },
    {
      id: enr.s12_c3,
      studentId: s(12).id,
      cohortId: cohort3Id,
      cohortSnapshotName: "AI 技能班第 1 期",
      status: "completed",
      alumniStatus: "active",
      alumniExpiresAt: daysFromNow(12),
      completedAt: daysAgo(300),
      createdBy: liUserId,
      createdAt: daysAgo(310),
      updatedAt: now,
    },
    {
      id: enr.s13_c1,
      studentId: s(13).id,
      cohortId: cohort1Id,
      cohortSnapshotName: "全能训练营第 3 期",
      status: "in_progress",
      createdBy: zhangUserId,
      createdAt: daysAgo(18),
      updatedAt: now,
    },
    {
      id: enr.s14_c3,
      studentId: s(14).id,
      cohortId: cohort3Id,
      cohortSnapshotName: "AI 技能班第 1 期",
      status: "in_progress",
      createdBy: liUserId,
      createdAt: daysAgo(6),
      updatedAt: now,
    },
    {
      id: enr.s15_c1,
      studentId: s(15).id,
      cohortId: cohort1Id,
      cohortSnapshotName: "全能训练营第 3 期",
      status: "completed",
      alumniStatus: "active",
      alumniExpiresAt: daysFromNow(25),
      completedAt: daysAgo(20),
      createdBy: zhangUserId,
      createdAt: daysAgo(25),
      updatedAt: now,
    },
    {
      id: enr.s16_c2,
      studentId: s(16).id,
      cohortId: cohort2Id,
      cohortSnapshotName: "全能训练营第 4 期",
      status: "in_progress",
      createdBy: liUserId,
      createdAt: daysAgo(4),
      updatedAt: now,
    },
    {
      id: enr.s17_c3,
      studentId: s(17).id,
      cohortId: cohort3Id,
      cohortSnapshotName: "AI 技能班第 1 期",
      status: "completed",
      alumniStatus: "active",
      alumniExpiresAt: daysFromNow(5),
      completedAt: daysAgo(380),
      createdBy: zhangUserId,
      createdAt: daysAgo(390),
      updatedAt: now,
    },
  ]);

  const interviewPassedId = randomUUID();
  const interviewFailedId = randomUUID();

  await db.insert(interviewRecords).values([
    {
      id: interviewPassedId,
      enrollmentId: enr.s4_c1_failed,
      result: "failed",
      comment: "沟通节奏偏慢，暂不适合本期班强度。",
      transcript: "学员表示目前工作较忙，每周可投入时间有限。",
      aiExtract: generateInterviewExtract({
        studentName: s(4).name,
        transcript: "学员表示目前工作较忙，每周可投入时间有限。",
        comment: "沟通节奏偏慢",
      }),
      createdBy: liUserId,
      createdAt: daysAgo(18),
    },
    {
      id: interviewFailedId,
      enrollmentId: enr.s7_c2,
      result: "passed",
      comment: "表达清晰，学习动机强，建议录取。",
      transcript: "学员详细介绍过往创业经历，对 OPC 模式认同度高。",
      aiExtract: generateInterviewExtract({
        studentName: s(7).name,
        transcript: "学员详细介绍过往创业经历",
        comment: "表达清晰",
      }),
      createdBy: zhangUserId,
      createdAt: daysAgo(2),
    },
  ]);

  await db.insert(attendanceRecords).values([
    {
      id: randomUUID(),
      enrollmentId: enr.s0_c1,
      sessionDate: dateOnly(daysAgo(14)),
      sessionLabel: "Day1",
      note: "准时到课",
      createdBy: zhangUserId,
      createdAt: daysAgo(14),
    },
    {
      id: randomUUID(),
      enrollmentId: enr.s0_c1,
      sessionDate: dateOnly(daysAgo(7)),
      sessionLabel: "Day2",
      note: "互动积极",
      createdBy: zhangUserId,
      createdAt: daysAgo(7),
    },
    {
      id: randomUUID(),
      enrollmentId: enr.s6_c1,
      sessionDate: dateOnly(daysAgo(5)),
      sessionLabel: "首场",
      createdBy: liUserId,
      createdAt: daysAgo(5),
    },
    {
      id: randomUUID(),
      enrollmentId: enr.s10_c1,
      sessionDate: dateOnly(daysAgo(3)),
      sessionLabel: "Day1",
      createdBy: liUserId,
      createdAt: daysAgo(3),
    },
    {
      id: randomUUID(),
      enrollmentId: enr.s13_c1,
      sessionDate: dateOnly(daysAgo(1)),
      sessionLabel: "补课",
      note: "上周请假补签",
      createdBy: zhangUserId,
      createdAt: daysAgo(1),
    },
    {
      id: randomUUID(),
      enrollmentId: enr.s9_c3,
      sessionDate: dateOnly(daysAgo(10)),
      sessionLabel: "模块一",
      createdBy: zhangUserId,
      createdAt: daysAgo(10),
    },
    {
      id: randomUUID(),
      enrollmentId: enr.s11_c2,
      sessionDate: dateOnly(now),
      sessionLabel: "试听",
      createdBy: zhangUserId,
      createdAt: now,
    },
  ]);

  await db.insert(certificateIssues).values([
    {
      id: randomUUID(),
      enrollmentId: enr.s2_c3_active,
      issuedAt: daysAgo(340),
      note: "AI 技能班结业证书",
      createdBy: adminUserId,
      createdAt: daysAgo(340),
    },
    {
      id: randomUUID(),
      enrollmentId: enr.s12_c3,
      issuedAt: daysAgo(290),
      note: "优秀学员证书",
      createdBy: liUserId,
      createdAt: daysAgo(290),
    },
    {
      id: randomUUID(),
      enrollmentId: enr.s15_c1,
      issuedAt: daysAgo(15),
      note: "全能训练营结业证",
      createdBy: zhangUserId,
      createdAt: daysAgo(15),
    },
    {
      id: randomUUID(),
      enrollmentId: enr.s8_archived,
      issuedAt: daysAgo(195),
      note: "第 2 期结业",
      createdBy: liUserId,
      createdAt: daysAgo(195),
    },
  ]);

  await db.insert(retrainingRecords).values([
    {
      id: randomUUID(),
      studentId: s(8).id,
      seriesId: series1Id,
      cohortId: cohort2Id,
      attendedAt: dateOnly(daysAgo(8)),
      note: "老学员回炉，巩固销售话术模块",
      createdBy: liUserId,
      createdAt: daysAgo(8),
    },
    {
      id: randomUUID(),
      studentId: s(0).id,
      seriesId: series1Id,
      cohortId: cohortArchivedId,
      attendedAt: dateOnly(daysAgo(60)),
      note: "旁听复盘（历史期班）",
      createdBy: zhangUserId,
      createdAt: daysAgo(60),
    },
  ]);

  const followUpEntries: {
    studentIdx: number;
    advisorId: string;
    content: string;
    daysAgo: number;
  }[] = [
    { studentIdx: 0, advisorId: advisor1Id, content: "学员对课程满意度较高，计划下周回访续报意向。", daysAgo: 1 },
    { studentIdx: 1, advisorId: advisor2Id, content: "已发送面试资料，等待学员确认面试时间。", daysAgo: 2 },
    { studentIdx: 2, advisorId: advisor1Id, content: "校友权益即将到期，已介绍续期方案。", daysAgo: 3 },
    { studentIdx: 3, advisorId: advisor1Id, content: "学员咨询校友激活课程，待管理员审批。", daysAgo: 5 },
    { studentIdx: 4, advisorId: advisor2Id, content: "面试未通过后安抚情绪，推荐技能方向课程。", daysAgo: 6 },
    { studentIdx: 5, advisorId: advisor1Id, content: "退费流程已办结，档案保留。", daysAgo: 10 },
    { studentIdx: 10, advisorId: advisor2Id, content: "首次课反馈良好，询问是否有进阶班。", daysAgo: 7 },
    { studentIdx: 11, advisorId: advisor1Id, content: "确认下周到场时间。", daysAgo: 8 },
    { studentIdx: 13, advisorId: advisor1Id, content: "签约 OPC 意向较强，准备走标签流程。", daysAgo: 4 },
    { studentIdx: 15, advisorId: advisor1Id, content: "结业后转介绍线索 1 条。", daysAgo: 8 },
  ];

  const followUpIds: string[] = [];
  for (const fu of followUpEntries) {
    const fuId = randomUUID();
    followUpIds.push(fuId);
    await db.insert(followUpLogs).values({
      id: fuId,
      studentId: s(fu.studentIdx).id,
      advisorId: fu.advisorId,
      content: fu.content,
      createdAt: daysAgo(fu.daysAgo),
    });
  }

  const insightRows = followUpEntries.slice(0, 6).map((fu, i) => {
    const insight = generateStudentInsight({
      studentName: s(fu.studentIdx).name,
      followUpContent: fu.content,
    });
    return {
      id: randomUUID(),
      studentId: s(fu.studentIdx).id,
      triggerType: i === 5 ? "manual" : "follow_up_saved",
      triggerRefId: i === 5 ? null : followUpIds[i],
      summary: insight.summary,
      nextTalk: insight.nextTalk,
      hooks: insight.hooks,
      createdBy: i % 2 === 0 ? zhangUserId : liUserId,
      createdAt: daysAgo(fu.daysAgo),
    };
  });
  await db.insert(studentAiInsights).values(insightRows);

  const wecomPairs = [
    { studentIdx: 0, externalUserid: "mock_ext_001", advisorId: advisor1Id },
    { studentIdx: 1, externalUserid: "mock_ext_002", advisorId: advisor2Id },
    { studentIdx: 2, externalUserid: "mock_ext_003", advisorId: advisor1Id },
    { studentIdx: 3, externalUserid: "mock_ext_004", advisorId: advisor1Id },
    { studentIdx: 10, externalUserid: "mock_ext_005", advisorId: advisor2Id },
  ];

  for (const w of wecomPairs) {
    await db.insert(wecomBindings).values({
      id: randomUUID(),
      studentId: s(w.studentIdx).id,
      externalUserid: w.externalUserid,
      boundAt: daysAgo(20),
      boundBy: w.advisorId === advisor1Id ? zhangUserId : liUserId,
    });

    await db.insert(chatMessages).values([
      {
        id: randomUUID(),
        studentId: s(w.studentIdx).id,
        advisorId: w.advisorId,
        direction: "in",
        msgType: "text",
        content: `你好，我是${s(w.studentIdx).name}，想咨询一下课程安排。`,
        wecomMsgId: `mock_in_${w.studentIdx}_1`,
        sentAt: daysAgo(3),
      },
      {
        id: randomUUID(),
        studentId: s(w.studentIdx).id,
        advisorId: w.advisorId,
        direction: "out",
        msgType: "text",
        content: "您好，已收到。本期班上课时间为每周六全天，详情我发您。",
        wecomMsgId: `mock_out_${w.studentIdx}_1`,
        sentAt: daysAgo(3),
      },
      {
        id: randomUUID(),
        studentId: s(w.studentIdx).id,
        advisorId: w.advisorId,
        direction: "in",
        msgType: "text",
        content: "好的，我考虑一下续报。",
        wecomMsgId: `mock_in_${w.studentIdx}_2`,
        sentAt: daysAgo(1),
      },
    ]);
  }

  const importBatch1Id = randomUUID();
  const importBatch2Id = randomUUID();

  await db.insert(importBatches).values([
    {
      id: importBatch1Id,
      status: "completed",
      totalRows: 8,
      createdCount: 5,
      mergedCount: 2,
      skippedCount: 1,
      pendingCount: 0,
      operatorId: adminUserId,
      report: JSON.stringify({
        failures: [{ row: 6, reason: "缺少手机号" }],
      }),
      createdAt: daysAgo(14),
    },
    {
      id: importBatch2Id,
      status: "completed",
      totalRows: 3,
      createdCount: 1,
      mergedCount: 0,
      skippedCount: 0,
      pendingCount: 2,
      operatorId: adminUserId,
      report: JSON.stringify({ failures: [] }),
      createdAt: daysAgo(2),
    },
  ]);

  await db.insert(importConflicts).values([
    {
      id: randomUUID(),
      batchId: importBatch2Id,
      phone: s(16).phone,
      incomingData: JSON.stringify({ name: "陈十六（互动吧）", import_note: "姓名不一致" }),
      existingStudentId: s(16).id,
      status: "pending",
    },
    {
      id: randomUUID(),
      batchId: importBatch2Id,
      phone: s(17).phone,
      incomingData: JSON.stringify({ name: "林十七", import_note: "待确认是否同一人" }),
      existingStudentId: s(17).id,
      status: "pending",
    },
    {
      id: randomUUID(),
      batchId: importBatch1Id,
      phone: s(4).phone,
      incomingData: JSON.stringify({ name: "学员四", import_note: "已合并" }),
      existingStudentId: s(4).id,
      status: "resolved",
      resolvedAt: daysAgo(13),
    },
  ]);

  await db.insert(auditLogs).values([
    {
      id: randomUUID(),
      action: "student_import",
      entityType: "import_batch",
      entityId: importBatch1Id,
      payload: JSON.stringify({
        batchId: importBatch1Id,
        created: 5,
        merged: 2,
        skipped: 1,
        pending: 0,
      }),
      operatorId: adminUserId,
      createdAt: daysAgo(14),
    },
    {
      id: randomUUID(),
      action: "student_import",
      entityType: "import_batch",
      entityId: importBatch2Id,
      payload: JSON.stringify({
        batchId: importBatch2Id,
        created: 1,
        merged: 0,
        skipped: 0,
        pending: 2,
      }),
      operatorId: adminUserId,
      createdAt: daysAgo(2),
    },
    {
      id: randomUUID(),
      action: "advisor_transfer",
      entityType: "advisor",
      entityId: advisor3Id,
      payload: JSON.stringify({
        sourceAdvisorId: advisor3Id,
        targetAdvisorId: advisor1Id,
        studentIds: [s(17).id],
      }),
      operatorId: superUserId,
      createdAt: daysAgo(30),
    },
    {
      id: randomUUID(),
      action: "student_phone_changed",
      entityType: "student",
      entityId: s(5).id,
      payload: JSON.stringify({ from: "13800001005", to: s(5).phone }),
      operatorId: adminUserId,
      createdAt: daysAgo(20),
    },
    {
      id: randomUUID(),
      action: "alumni_activate",
      entityType: "enrollment",
      entityId: enr.s3_c3_expired,
      payload: JSON.stringify({
        studentId: s(3).id,
        wasExpired: true,
        alumniExpiresAt: daysFromNow(365),
      }),
      operatorId: adminUserId,
      createdAt: daysAgo(5),
    },
    {
      id: randomUUID(),
      action: "student_merge",
      entityType: "import_conflict",
      entityId: s(4).id,
      payload: JSON.stringify({
        conflictId: "resolved-sample",
        strategy: "keep_existing",
        phone: s(4).phone,
      }),
      operatorId: adminUserId,
      createdAt: daysAgo(13),
    },
  ]);

  await db.insert(systemSettings).values([
    { key: "wecom_mock", value: "true", updatedAt: now },
    { key: "wecom_corp_id", value: "ww_demo_corp", updatedAt: now },
    { key: "wecom_agent_id", value: "1000002", updatedAt: now },
  ]);

  return {
    ok: true,
    stats: {
      students: studentRows.length,
      enrollments: Object.keys(enr).length,
      cohorts: 4,
      importBatches: 2,
      pendingConflicts: 2,
    },
  };
}
