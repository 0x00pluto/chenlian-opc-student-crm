"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { EnrollmentStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export default function CohortDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [attendance, setAttendance] = useState<Record<string, unknown>[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState<{
    enrollmentId: string;
    studentName: string;
  } | null>(null);
  const [sessionDate, setSessionDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [sessionLabel, setSessionLabel] = useState("");
  const [attendanceNote, setAttendanceNote] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    instructorName: "",
    startDate: "",
    endDate: "",
    status: "recruiting",
    requiresInterview: false,
  });

  const load = useCallback(() => {
    if (!id) return;
    fetch(`/api/cohorts/${id}`).then((r) => r.json()).then(setData);
    fetch(`/api/cohorts/${id}/attendance`)
      .then((r) => r.json())
      .then((d) => setAttendance(d.items ?? []));
  }, [id]);

  useEffect(() => {
    load();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((me) => {
        setCanEdit(me.role === "admin" || me.role === "super_admin");
      });
  }, [load]);

  if (!data?.cohort) return <p className="text-sm text-zinc-500">加载中…</p>;

  const cohort = data.cohort as Record<string, unknown>;
  const enrollments = (data.enrollments as Record<string, unknown>[]) ?? [];

  function openEdit() {
    setEditForm({
      name: cohort.name as string,
      instructorName: (cohort.instructorName as string) ?? "",
      startDate: (cohort.startDate as string)?.slice(0, 10) ?? "",
      endDate: (cohort.endDate as string)?.slice(0, 10) ?? "",
      status: (cohort.status as string) ?? "recruiting",
      requiresInterview: Boolean(cohort.requiresInterview),
    });
    setEditOpen(true);
  }

  async function saveCohort() {
    const res = await fetch(`/api/cohorts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        instructorName: editForm.instructorName || undefined,
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
        status: editForm.status,
        requiresInterview: editForm.requiresInterview,
      }),
    });
    if (!res.ok) return toast.error((await res.json()).error);
    toast.success("期班已更新");
    setEditOpen(false);
    load();
  }

  async function submitAttendance() {
    if (!attendanceOpen) return;
    const res = await fetch(
      `/api/enrollments/${attendanceOpen.enrollmentId}/attendance`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionDate,
          sessionLabel: sessionLabel || undefined,
          note: attendanceNote || undefined,
        }),
      },
    );
    if (!res.ok) return toast.error((await res.json()).error);
    toast.success("签到成功");
    setAttendanceOpen(null);
    setSessionLabel("");
    setAttendanceNote("");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium text-zinc-900">{cohort.name as string}</h2>
          <p className="text-sm text-zinc-500">
            {data.categoryName as string} / {data.seriesName as string} · 讲师{" "}
            {(cohort.instructorName as string) ?? "—"}
          </p>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={openEdit}>
            编辑期班
          </Button>
        )}
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">学员名单</TabsTrigger>
          <TabsTrigger value="attendance">考勤</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <div className="rounded-md border border-zinc-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学员</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>学籍状态</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((row) => {
                  const e = row.enrollment as Record<string, unknown>;
                  return (
                    <TableRow key={e.id as string}>
                      <TableCell className="py-2">{row.studentName as string}</TableCell>
                      <TableCell className="py-2 text-zinc-500">
                        {row.studentPhone as string}
                      </TableCell>
                      <TableCell className="py-2">
                        <EnrollmentStatusBadge status={e.status as string} />
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Link
                          href={`/students/${e.studentId}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          学员详情
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="rounded-md border border-zinc-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学员</TableHead>
                  <TableHead>学籍</TableHead>
                  <TableHead>最近签到</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((row) => (
                  <TableRow key={row.enrollmentId as string}>
                    <TableCell className="py-2">{row.studentName as string}</TableCell>
                    <TableCell className="py-2">
                      <EnrollmentStatusBadge status={row.enrollmentStatus as string} />
                    </TableCell>
                    <TableCell className="py-2 text-zinc-500">
                      {(row.lastSessionDate as string)?.slice(0, 10) ?? "—"}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {row.enrollmentStatus === "in_progress" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setAttendanceOpen({
                              enrollmentId: row.enrollmentId as string,
                              studentName: row.studentName as string,
                            })
                          }
                        >
                          签到
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑期班</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>名称</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>讲师</Label>
              <Input
                value={editForm.instructorName}
                onChange={(e) =>
                  setEditForm({ ...editForm, instructorName: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>开始日期</Label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>结束日期</Label>
                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>状态</Label>
              <Input
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editForm.requiresInterview}
                onChange={(e) =>
                  setEditForm({ ...editForm, requiresInterview: e.target.checked })
                }
              />
              需面试
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={saveCohort}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!attendanceOpen} onOpenChange={() => setAttendanceOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>考勤签到 · {attendanceOpen?.studentName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>上课日期</Label>
              <Input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>场次标签</Label>
              <Input
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
                placeholder="如：Day1"
              />
            </div>
            <div className="space-y-1">
              <Label>备注</Label>
              <Textarea
                value={attendanceNote}
                onChange={(e) => setAttendanceNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAttendanceOpen(null)}>
              取消
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={submitAttendance}
            >
              确认签到
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
