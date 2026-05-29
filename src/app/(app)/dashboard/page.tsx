"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { labelExportType } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MetricsResponse = {
  scope: string;
  period?: { from: string; to: string };
  advisorId?: string | null;
  advisorName?: string | null;
  metrics: Record<string, { label: string; value: number }>;
  pendingFollowUp: { id: string; name: string; phone: string; lastFollowUpAt: string | null }[];
  alumniExpiring: {
    enrollmentId: string;
    studentName: string;
    cohortName: string;
    alumniExpiresAt: string;
  }[];
};

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

export default function DashboardPage() {
  const defaults = monthBounds();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [advisorId, setAdvisorId] = useState("");
  const [advisors, setAdvisors] = useState<{ id: string; name: string }[]>([]);
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [isTeam, setIsTeam] = useState(false);

  const load = useCallback(() => {
    const params = new URLSearchParams({ from, to });
    if (advisorId) params.set("advisorId", advisorId);
    fetch(`/api/dashboard/metrics?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setIsTeam(d.scope === "team");
      });
  }, [from, to, advisorId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((me) => {
        if (me.role === "admin" || me.role === "super_admin") {
          fetch("/api/advisors")
            .then((r) => r.json())
            .then((d) => setAdvisors(d.items ?? []));
        }
      });
  }, []);

  const metrics = data?.metrics;
  const periodLabel = data?.period
    ? `${data.period.from.slice(0, 10)} ~ ${data.period.to.slice(0, 10)}`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-zinc-900">数据仪表盘</h2>
          <p className="text-sm text-zinc-500">
            {data?.scope === "team" ? "团队汇总" : "个人数据"}
            {periodLabel ? ` · ${periodLabel}` : ""}
            {data?.advisorName ? ` · ${data.advisorName}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {(["students", "follow-ups", "enrollments"] as const).map((t) => (
            <Button key={t} variant="outline" size="sm" asChild>
              <a href={`/api/export/${t}`} download>
                导出{labelExportType(t)}
              </a>
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardContent className="flex flex-wrap items-end gap-4 py-4">
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">开始日期</Label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border border-zinc-200 px-2 py-1 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">结束日期</Label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border border-zinc-200 px-2 py-1 text-sm"
            />
          </div>
          {isTeam && (
            <div className="space-y-1">
              <Label className="text-xs text-zinc-500">班主任</Label>
              <Select
                value={advisorId || "__all__"}
                onValueChange={(v) => setAdvisorId(v === "__all__" ? "" : v)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部班主任</SelectItem>
                  {advisors.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={load}>
            刷新
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics &&
          Object.entries(metrics).map(([key, m]) => (
            <Card key={key} className="border-zinc-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">
                  {m.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-medium text-zinc-900">{m.value}%</p>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-900">
              待跟进学员（30 天无跟进）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider text-zinc-500">
                    姓名
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-zinc-500">
                    手机号
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.pendingFollowUp ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="py-2 font-medium">{s.name}</TableCell>
                    <TableCell className="py-2 text-zinc-500">{s.phone}</TableCell>
                    <TableCell className="py-2 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/students/${s.id}`}>跟进</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.pendingFollowUp?.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-4 text-center text-sm text-zinc-500">
                      暂无待跟进
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-900">
              即将到期校友
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学员</TableHead>
                  <TableHead>期班</TableHead>
                  <TableHead>到期日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.alumniExpiring ?? []).map((a) => (
                  <TableRow key={a.enrollmentId}>
                    <TableCell className="py-2">{a.studentName}</TableCell>
                    <TableCell className="py-2 text-zinc-500">{a.cohortName}</TableCell>
                    <TableCell className="py-2 text-zinc-500">
                      {a.alumniExpiresAt?.slice(0, 10)}
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.alumniExpiring?.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-4 text-center text-sm text-zinc-500">
                      暂无即将到期
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
