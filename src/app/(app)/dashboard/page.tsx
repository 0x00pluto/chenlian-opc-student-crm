"use client";

import Link from "next/link";
import { FolderX, Inbox } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  DataTableBodyRow,
  DataTableHead,
  DataTableHeaderRow,
  TableRowActionButton,
  tableCellActions,
  tableCellPrimary,
  tableCellSecondary,
} from "@/components/shared/data-table";
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
  TableHeader,
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

function TableEmptyState({
  message,
  icon: Icon = Inbox,
}: {
  message: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <Icon className="h-10 w-10 text-muted-foreground/30" />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

const cardCompactClass = "border border-border shadow-none ring-0";

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
  const pendingFollowUp = data?.pendingFollowUp ?? [];
  const alumniExpiring = data?.alumniExpiring ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-foreground">数据仪表盘</h2>
          <p className="text-sm text-muted-foreground">
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

      <Card className={cardCompactClass}>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">开始日期</Label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">结束日期</Label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
          </div>
          {isTeam && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">班主任</Label>
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
            <Card key={key} className={`gap-0 py-0 ${cardCompactClass}`}>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">{m.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {m.value}%
                </p>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={cardCompactClass}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              待跟进学员（30 天无跟进）
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {pendingFollowUp.length > 0 ? (
              <Table>
                <TableHeader>
                  <DataTableHeaderRow>
                    <DataTableHead>姓名</DataTableHead>
                    <DataTableHead>手机号</DataTableHead>
                    <DataTableHead className="w-[72px]" />
                  </DataTableHeaderRow>
                </TableHeader>
                <TableBody>
                  {pendingFollowUp.map((s) => (
                    <DataTableBodyRow key={s.id}>
                      <TableCell className={tableCellPrimary}>{s.name}</TableCell>
                      <TableCell className={tableCellSecondary}>{s.phone}</TableCell>
                      <TableCell className={tableCellActions}>
                        <TableRowActionButton asChild>
                          <Link href={`/students/${s.id}`}>跟进</Link>
                        </TableRowActionButton>
                      </TableCell>
                    </DataTableBodyRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <TableEmptyState message="暂无待跟进" icon={Inbox} />
            )}
          </CardContent>
        </Card>

        <Card className={cardCompactClass}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              即将到期校友
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {alumniExpiring.length > 0 ? (
              <Table>
                <TableHeader>
                  <DataTableHeaderRow>
                    <DataTableHead>学员</DataTableHead>
                    <DataTableHead>期班</DataTableHead>
                    <DataTableHead>到期日</DataTableHead>
                  </DataTableHeaderRow>
                </TableHeader>
                <TableBody>
                  {alumniExpiring.map((a) => (
                    <DataTableBodyRow key={a.enrollmentId}>
                      <TableCell className={tableCellPrimary}>{a.studentName}</TableCell>
                      <TableCell className={tableCellSecondary}>{a.cohortName}</TableCell>
                      <TableCell className={tableCellSecondary}>
                        {a.alumniExpiresAt?.slice(0, 10)}
                      </TableCell>
                    </DataTableBodyRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <TableEmptyState message="暂无即将到期" icon={FolderX} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
