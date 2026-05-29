/** 业务状态中文文案（列表/详情展示用） */

export const enrollmentStatusLabels: Record<string, string> = {
  pending_interview: "待面试",
  interview_failed: "面试未通过",
  in_progress: "在读",
  completed: "已结业",
  refunded: "已退费",
  lead: "线索",
};

export const alumniStatusLabels: Record<string, string> = {
  none: "无",
  active: "校友有效",
  expired: "已到期",
};

export const cohortStatusLabels: Record<string, string> = {
  recruiting: "招生中",
  in_progress: "进行中",
  ended: "已结束",
};

export const aiTriggerLabels: Record<string, string> = {
  follow_up_saved: "跟进触发",
  manual: "手动生成",
};

export const exportTypeLabels: Record<string, string> = {
  students: "学员",
  "follow-ups": "跟进记录",
  enrollments: "学籍",
  interviews: "面试记录",
};

export function labelEnrollment(status: string) {
  return enrollmentStatusLabels[status] ?? status;
}

export function labelAlumni(status: string) {
  return alumniStatusLabels[status] ?? status;
}

export function labelCohort(status: string) {
  return cohortStatusLabels[status] ?? status;
}

export function labelExportType(type: string) {
  return exportTypeLabels[type] ?? type;
}

export function labelAiTrigger(type: string) {
  return aiTriggerLabels[type] ?? type;
}
