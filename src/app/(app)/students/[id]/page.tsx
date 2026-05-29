"use client";

import { useParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  DataTableBodyRow,
  DataTableHead,
  DataTableHeaderRow,
  DataTableShell,
  tableCellPrimary,
} from "@/components/shared/data-table";
import {
  AlumniStatusBadge,
  EnrollmentStatusBadge,
} from "@/components/shared/status-badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { labelAiTrigger } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_TAG_SIGNED_OPC } from "@/lib/constants";

type InterviewRecord = {
  id: string;
  enrollmentId: string;
  result: string;
  comment: string | null;
  transcript: string | null;
  aiExtract: string | null;
  createdAt: string;
  cohortSnapshotName: string;
};

type RetrainingRecord = {
  id: string;
  cohortName: string;
  seriesName: string;
  attendedAt: string;
  note: string | null;
  operatorName: string | null;
};

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Record<string, unknown> | null>(null);
  const [enrollments, setEnrollments] = useState<Record<string, unknown>[]>([]);
  const [followUps, setFollowUps] = useState<Record<string, unknown>[]>([]);
  const [insights, setInsights] = useState<Record<string, unknown>[]>([]);
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [retrainings, setRetrainings] = useState<RetrainingRecord[]>([]);
  const [cohorts, setCohorts] = useState<Record<string, unknown>[]>([]);
  const [advisors, setAdvisors] = useState<{ id: string; name: string }[]>([]);
  const [canEditAdmin, setCanEditAdmin] = useState(false);
  const [followContent, setFollowContent] = useState("");
  const [wecomBinding, setWecomBinding] = useState<Record<string, unknown> | null>(null);
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);
  const [wecomQuery, setWecomQuery] = useState("");
  const [wecomCustomers, setWecomCustomers] = useState<Record<string, unknown>[]>([]);
  const [msgContent, setMsgContent] = useState("");
  const [selectedCohort, setSelectedCohort] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, Record<string, unknown>[]>
  >({});

  const [interviewOpen, setInterviewOpen] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    enrollmentId: "",
    cohortName: "",
    result: "passed" as "passed" | "failed",
    comment: "",
    transcript: "",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    assignedAdvisorId: "",
  });

  const [retrainCohort, setRetrainCohort] = useState("");
  const [retrainDate, setRetrainDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [retrainNote, setRetrainNote] = useState("");

  const [attendanceDialog, setAttendanceDialog] = useState<{
    enrollmentId: string;
    cohortName: string;
  } | null>(null);
  const [attSessionDate, setAttSessionDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [attSessionLabel, setAttSessionLabel] = useState("");
  const [attNote, setAttNote] = useState("");

  const load = useCallback(() => {
    if (!id) return;
    fetch(`/api/students/${id}`).then((r) => r.json()).then(setStudent);
    fetch(`/api/enrollments?studentId=${id}`)
      .then((r) => r.json())
      .then((d) => setEnrollments(d.items ?? []));
    fetch(`/api/students/${id}/follow-ups`)
      .then((r) => r.json())
      .then((d) => setFollowUps(d.items ?? []));
    fetch(`/api/students/${id}/ai-insights`)
      .then((r) => r.json())
      .then((d) => setInsights(d.items ?? []));
    fetch(`/api/students/${id}/interviews`)
      .then((r) => r.json())
      .then((d) => setInterviews(d.items ?? []));
    fetch(`/api/retrainings?studentId=${id}`)
      .then((r) => r.json())
      .then((d) => setRetrainings(d.items ?? []));
    fetch(`/api/wecom/messages?studentId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        setWecomBinding(d.binding);
        setMessages(d.items ?? []);
      });
    fetch("/api/cohorts")
      .then((r) => r.json())
      .then((d) =>
        setCohorts(
          (d.items ?? []).map((row: { cohort: { id: string; name: string } }) => row.cohort),
        ),
      );
  }, [id]);

  useEffect(() => {
    load();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((me) => {
        setCanEditAdmin(me.role === "admin" || me.role === "super_admin");
        if (me.role === "admin" || me.role === "super_admin") {
          fetch("/api/advisors")
            .then((r) => r.json())
            .then((d) => setAdvisors(d.items ?? []));
        }
      });
    const t = setInterval(() => {
      fetch(`/api/wecom/messages?studentId=${id}`)
        .then((r) => r.json())
        .then((d) => setMessages(d.items ?? []));
    }, 3000);
    return () => clearInterval(t);
  }, [load, id]);

  useEffect(() => {
    enrollments.forEach((row) => {
      const e = row.enrollment as Record<string, unknown>;
      fetch(`/api/enrollments/${e.id}/attendance`)
        .then((r) => r.json())
        .then((d) => {
          setAttendanceMap((prev) => ({
            ...prev,
            [e.id as string]: d.items ?? [],
          }));
        });
    });
  }, [enrollments]);

  if (!student) {
    return <p className="text-sm text-zinc-500">加载中…</p>;
  }

  const tags = (student.tags as string[]) ?? [];

  function openInterview(
    enrollmentId: string,
    cohortName: string,
    preset?: "passed" | "failed",
  ) {
    setInterviewForm({
      enrollmentId,
      cohortName,
      result: preset ?? "passed",
      comment: preset === "passed" ? "通过" : preset === "failed" ? "驳回" : "",
      transcript: "",
    });
    setInterviewOpen(true);
  }

  async function submitInterview() {
    const res = await fetch(
      `/api/enrollments/${interviewForm.enrollmentId}/interview`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result: interviewForm.result,
          comment: interviewForm.comment || undefined,
          transcript: interviewForm.transcript || undefined,
        }),
      },
    );
    if (!res.ok) return toast.error((await res.json()).error);
    toast.success("面试已提交");
    setInterviewOpen(false);
    load();
  }

  async function saveFollowUp() {
    const res = await fetch(`/api/students/${id}/follow-ups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: followContent }),
    });
    if (!res.ok) {
      toast.error((await res.json()).error);
      return;
    }
    toast.success("跟进已保存，AI 分析已生成");
    setFollowContent("");
    load();
  }

  async function manualAi() {
    const res = await fetch(`/api/students/${id}/ai-insights`, { method: "POST" });
    if (!res.ok) return toast.error("生成失败");
    toast.success("AI 分析已生成");
    load();
  }

  async function enroll() {
    if (!selectedCohort) return toast.error("请选择期班");
    const res = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: id, cohortId: selectedCohort }),
    });
    if (!res.ok) return toast.error((await res.json()).error);
    toast.success("报名成功");
    load();
  }

  async function enrollmentAction(enrollmentId: string, action: string, body?: object) {
    const res = await fetch(`/api/enrollments/${enrollmentId}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return toast.error((await res.json()).error);
    toast.success("操作成功");
    load();
  }

  async function submitRetrain() {
    if (!retrainCohort) return toast.error("请选择期班");
    const res = await fetch("/api/retrainings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: id,
        cohortId: retrainCohort,
        attendedAt: retrainDate,
        note: retrainNote || undefined,
      }),
    });
    if (!res.ok) return toast.error((await res.json()).error);
    toast.success("复训已登记");
    setRetrainNote("");
    load();
  }

  async function submitAttendance() {
    if (!attendanceDialog) return;
    const res = await fetch(
      `/api/enrollments/${attendanceDialog.enrollmentId}/attendance`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionDate: attSessionDate,
          sessionLabel: attSessionLabel || undefined,
          note: attNote || undefined,
        }),
      },
    );
    if (!res.ok) return toast.error((await res.json()).error);
    toast.success("签到成功");
    setAttendanceDialog(null);
    load();
  }

  async function toggleSignedOpc() {
    const has = tags.includes(DEFAULT_TAG_SIGNED_OPC);
    const newTags = has
      ? tags.filter((t) => t !== DEFAULT_TAG_SIGNED_OPC)
      : [...tags, DEFAULT_TAG_SIGNED_OPC];
    await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: newTags }),
    });
    load();
  }

  function openEdit() {
    if (!student) return;
    setEditForm({
      name: student.name as string,
      phone: student.phone as string,
      assignedAdvisorId: (student.assignedAdvisorId as string) ?? "",
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    const body: Record<string, string> = {
      name: editForm.name,
      phone: editForm.phone,
    };
    if (canEditAdmin && editForm.assignedAdvisorId) {
      body.assignedAdvisorId = editForm.assignedAdvisorId;
    }
    const res = await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return toast.error((await res.json()).error);
    toast.success("已保存");
    setEditOpen(false);
    load();
  }

  async function bindWecom(externalUserid: string) {
    const res = await fetch("/api/wecom/bind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: id, externalUserid }),
    });
    if (!res.ok) return toast.error((await res.json()).error);
    toast.success("绑定成功");
    load();
  }

  async function sendWecom() {
    const res = await fetch("/api/wecom/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: id, content: msgContent }),
    });
    if (!res.ok) return toast.error((await res.json()).error);
    setMsgContent("");
    load();
  }

  const pendingInterviewEnrollments = enrollments.filter((row) => {
    const e = row.enrollment as Record<string, unknown>;
    const cohort = row.cohort as Record<string, unknown>;
    return e.status === "pending_interview" && Boolean(cohort.requiresInterview);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-zinc-900">{student.name as string}</h2>
          <p className="text-sm text-zinc-500">
            {student.phone as string} · 班主任 {student.advisorName as string}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openEdit}>
            编辑档案
          </Button>
          <Button variant="outline" size="sm" onClick={toggleSignedOpc}>
            {tags.includes(DEFAULT_TAG_SIGNED_OPC) ? "移除签约 OPC" : "标记签约 OPC"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="enrollments">学籍</TabsTrigger>
          <TabsTrigger value="interview">面试</TabsTrigger>
          <TabsTrigger value="retrain">复训</TabsTrigger>
          <TabsTrigger value="followups">跟进</TabsTrigger>
          <TabsTrigger value="ai">AI 分析</TabsTrigger>
          <TabsTrigger value="wecom">企微</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-zinc-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600">
              <p>来源：{student.source as string}</p>
              <p>最后跟进：{formatDate(student.lastFollowUpAt as string)}</p>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Select value={selectedCohort} onValueChange={setSelectedCohort}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="选择期班报名" />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((c) => (
                  <SelectItem key={c.id as string} value={c.id as string}>
                    {c.name as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={enroll}>
              报名
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          <DataTableShell>
            <Table>
              <TableHeader>
                <DataTableHeaderRow>
                  <DataTableHead>期班</DataTableHead>
                  <DataTableHead>状态</DataTableHead>
                  <DataTableHead>校友</DataTableHead>
                  <DataTableHead>操作</DataTableHead>
                </DataTableHeaderRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((row) => {
                  const e = row.enrollment as Record<string, unknown>;
                  const cohort = row.cohort as Record<string, unknown>;
                  const att = attendanceMap[e.id as string] ?? [];
                  return (
                    <Fragment key={e.id as string}>
                      <DataTableBodyRow>
                        <TableCell className={tableCellPrimary}>
                          {e.cohortSnapshotName as string}
                        </TableCell>
                        <TableCell className="px-4 py-2">
                          <EnrollmentStatusBadge status={e.status as string} />
                        </TableCell>
                        <TableCell className="px-4 py-2">
                          <AlumniStatusBadge status={e.alumniStatus as string} />
                        </TableCell>
                        <TableCell className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {e.status === "pending_interview" &&
                            Boolean(cohort.requiresInterview) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    openInterview(
                                      e.id as string,
                                      e.cohortSnapshotName as string,
                                      "passed",
                                    )
                                  }
                                >
                                  面试通过
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    openInterview(
                                      e.id as string,
                                      e.cohortSnapshotName as string,
                                      "failed",
                                    )
                                  }
                                >
                                  驳回
                                </Button>
                              </>
                            )}
                          {e.status === "in_progress" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setAttendanceDialog({
                                    enrollmentId: e.id as string,
                                    cohortName: e.cohortSnapshotName as string,
                                  })
                                }
                              >
                                签到
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  enrollmentAction(e.id as string, "complete")
                                }
                              >
                                结业
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  enrollmentAction(e.id as string, "certificate", {})
                                }
                              >
                                发证
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  enrollmentAction(e.id as string, "refund")
                                }
                              >
                                退费
                              </Button>
                            </>
                          )}
                          {e.alumniStatus === "expired" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                enrollmentAction(e.id as string, "alumni-activate")
                              }
                            >
                              激活校友
                            </Button>
                          )}
                        </div>
                        </TableCell>
                      </DataTableBodyRow>
                      {att.length > 0 && (
                        <TableRow key={`${e.id}-att`}>
                          <TableCell
                            colSpan={4}
                            className="bg-zinc-50 px-4 py-2 text-xs text-zinc-600"
                          >
                            考勤：
                            {att.map((a) => (
                              <span key={a.id as string} className="mr-3">
                                {(a.sessionDate as string)?.slice(0, 10)}
                                {a.sessionLabel ? ` (${a.sessionLabel as string})` : ""}
                              </span>
                            ))}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </DataTableShell>
        </TabsContent>

        <TabsContent value="interview" className="space-y-4">
          {pendingInterviewEnrollments.length > 0 && (
            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium">待面试学籍</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingInterviewEnrollments.map((row) => {
                  const e = row.enrollment as Record<string, unknown>;
                  return (
                    <div key={e.id as string} className="flex items-center justify-between">
                      <span className="text-sm">{e.cohortSnapshotName as string}</span>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() =>
                          openInterview(e.id as string, e.cohortSnapshotName as string)
                        }
                      >
                        提交面试
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
          <div className="space-y-3">
            {interviews.map((iv) => (
              <Card key={iv.id} className="border-zinc-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-900">
                    {iv.cohortSnapshotName} ·{" "}
                    {iv.result === "passed" ? "通过" : "驳回"} ·{" "}
                    {formatDateTime(iv.createdAt)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {iv.comment && (
                    <p>
                      <span className="font-medium text-zinc-700">评语：</span>
                      {iv.comment}
                    </p>
                  )}
                  {iv.transcript && (
                    <p>
                      <span className="font-medium text-zinc-700">转写：</span>
                      <span className="whitespace-pre-wrap text-zinc-600">{iv.transcript}</span>
                    </p>
                  )}
                  {iv.aiExtract && (
                    <div>
                      <p className="font-medium text-zinc-700">AI 提取</p>
                      <pre className="mt-1 overflow-x-auto rounded-md bg-zinc-50 p-2 text-xs text-zinc-600">
                        {iv.aiExtract}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {!interviews.length && (
              <p className="text-sm text-zinc-500">暂无面试记录</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="retrain" className="space-y-4">
          <Card className="border-zinc-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium">登记复训</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-zinc-500">
                请选择同系列期班，系统会校验学员在该系列是否有历史学籍。
              </p>
              <Select value={retrainCohort} onValueChange={setRetrainCohort}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="选择期班" />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((c) => (
                    <SelectItem key={c.id as string} value={c.id as string}>
                      {c.name as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={retrainDate}
                onChange={(e) => setRetrainDate(e.target.value)}
                className="w-40"
              />
              <Textarea
                placeholder="备注"
                value={retrainNote}
                onChange={(e) => setRetrainNote(e.target.value)}
              />
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={submitRetrain}
              >
                登记复训
              </Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {retrainings.map((r) => (
              <Card key={r.id} className="border-zinc-200">
                <CardContent className="py-3 text-sm">
                  <p className="font-medium text-zinc-900">
                    {r.cohortName} · {r.seriesName}
                  </p>
                  <p className="text-zinc-500">
                    {r.attendedAt?.slice(0, 10)} · {r.operatorName ?? "—"}
                  </p>
                  {r.note && <p className="mt-1 text-zinc-700">{r.note}</p>}
                </CardContent>
              </Card>
            ))}
            {!retrainings.length && (
              <p className="text-sm text-zinc-500">暂无复训记录</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="followups" className="space-y-4">
          <Textarea
            placeholder="填写跟进内容（学员不可见）"
            value={followContent}
            onChange={(e) => setFollowContent(e.target.value)}
          />
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={saveFollowUp}>
            保存跟进
          </Button>
          <div className="space-y-3">
            {followUps.map((f) => (
              <Card key={f.id as string} className="border-zinc-200">
                <CardContent className="py-3 text-sm">
                  <p className="text-zinc-500">{formatDateTime(f.createdAt as string)}</p>
                  <p className="mt-1 text-zinc-800">{f.content as string}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Button variant="outline" size="sm" onClick={manualAi}>
            手动生成分析
          </Button>
          {insights.map((ins) => (
            <Card key={ins.id as string} className="border-zinc-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">
                  {formatDateTime(ins.createdAt as string)} ·{" "}
                  {labelAiTrigger(ins.triggerType as string)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">总结：</span>
                  {ins.summary as string}
                </p>
                <p>
                  <span className="font-medium">话术：</span>
                  {ins.nextTalk as string}
                </p>
                <p>
                  <span className="font-medium">钩子：</span>
                  {ins.hooks as string}
                </p>
              </CardContent>
            </Card>
          ))}
          {!insights.length && (
            <p className="text-sm text-zinc-500">暂无分析，可保存跟进或手动生成</p>
          )}
        </TabsContent>

        <TabsContent value="wecom" className="space-y-4">
          {!wecomBinding ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">未绑定企微客户，请搜索后绑定</p>
              <div className="flex gap-2">
                <Input
                  placeholder="手机号或昵称"
                  value={wecomQuery}
                  onChange={(e) => setWecomQuery(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fetch(`/api/wecom/customers?q=${encodeURIComponent(wecomQuery)}`)
                      .then((r) => r.json())
                      .then((d) => setWecomCustomers(d.items ?? []))
                  }
                >
                  搜索
                </Button>
              </div>
              {wecomCustomers.map((c) => (
                <div
                  key={c.externalUserid as string}
                  className="flex items-center justify-between rounded-md border border-zinc-200 p-2"
                >
                  <span className="text-sm">
                    {c.name as string} · {c.phone as string}
                  </span>
                  <Button size="sm" onClick={() => bindWecom(c.externalUserid as string)}>
                    绑定
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm text-zinc-500">
                已绑定：{wecomBinding.externalUserid as string}
              </p>
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border border-zinc-200 bg-white p-3">
                {messages.map((m) => (
                  <div
                    key={m.id as string}
                    className={`text-sm ${m.direction === "out" ? "text-right" : ""}`}
                  >
                    <span
                      className={`inline-block rounded-md px-2 py-1 ${
                        m.direction === "out"
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-100 text-zinc-800"
                      }`}
                    >
                      {m.content as string}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder="发送企微消息"
                />
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={sendWecom}>
                  发送
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={interviewOpen} onOpenChange={setInterviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>面试 · {interviewForm.cohortName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>结论</Label>
              <Select
                value={interviewForm.result}
                onValueChange={(v) =>
                  setInterviewForm({
                    ...interviewForm,
                    result: v as "passed" | "failed",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">通过</SelectItem>
                  <SelectItem value="failed">驳回</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>面试评语</Label>
              <Textarea
                value={interviewForm.comment}
                onChange={(e) =>
                  setInterviewForm({ ...interviewForm, comment: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>录音转写</Label>
              <Textarea
                rows={5}
                value={interviewForm.transcript}
                onChange={(e) =>
                  setInterviewForm({ ...interviewForm, transcript: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setInterviewOpen(false)}>
              取消
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={submitInterview}
            >
              提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑学员档案</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>姓名</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>手机号</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            {canEditAdmin && (
              <div className="space-y-1">
                <Label>班主任</Label>
                <Select
                  value={editForm.assignedAdvisorId}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, assignedAdvisorId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择班主任" />
                  </SelectTrigger>
                  <SelectContent>
                    {advisors.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={saveEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!attendanceDialog} onOpenChange={() => setAttendanceDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>考勤 · {attendanceDialog?.cohortName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>上课日期</Label>
              <Input
                type="date"
                value={attSessionDate}
                onChange={(e) => setAttSessionDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>场次</Label>
              <Input
                value={attSessionLabel}
                onChange={(e) => setAttSessionLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>备注</Label>
              <Textarea value={attNote} onChange={(e) => setAttNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAttendanceDialog(null)}>
              取消
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={submitAttendance}
            >
              签到
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
