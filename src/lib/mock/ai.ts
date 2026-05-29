type InsightInput = {
  studentName: string;
  followUpContent?: string;
  recentFollowUps?: string[];
};

export function generateStudentInsight(input: InsightInput) {
  const { studentName, followUpContent, recentFollowUps = [] } = input;
  const context =
    followUpContent ??
    recentFollowUps[0] ??
    "暂无近期跟进内容，建议主动触达了解学习进展。";

  return {
    summary: `学员「${studentName}」当前跟进要点：${context.slice(0, 120)}${context.length > 120 ? "…" : ""}`,
    nextTalk: `建议下次沟通时先确认${studentName}对当前课程的学习感受，再了解是否有续报或转介绍意向。可结合近期课程进度给出具体建议。`,
    hooks: "可提及校友权益、同系列复训机会或签约 OPC 生态资源，作为自然话题延伸。",
  };
}

export function generateInterviewExtract(input: {
  studentName: string;
  transcript?: string;
  comment?: string;
}) {
  const base = input.transcript ?? input.comment ?? "无转写内容";
  return JSON.stringify(
    {
      motivation: `对 OPC 方向表现出${base.length > 50 ? "一定" : "初步"}学习动机`,
      strengths: ["沟通表达清晰", "有明确职业转型目标"],
      risks: base.includes("时间") ? ["时间安排需关注"] : [],
      recommendation: "建议结合课程强度评估学习投入能力",
    },
    null,
    2,
  );
}
