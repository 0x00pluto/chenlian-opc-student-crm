"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CohortRow = {
  cohort: { id: string; name: string; status: string };
  seriesName?: string;
};

export default function AttendanceListPage() {
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);

  useEffect(() => {
    fetch("/api/cohorts")
      .then((r) => r.json())
      .then((d) => setCohorts(d.items ?? []));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-900">考勤管理</h2>
      <p className="text-sm text-zinc-500">选择期班进入考勤录入与查看</p>
      <div className="rounded-md border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>期班</TableHead>
              <TableHead>系列</TableHead>
              <TableHead>状态</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {cohorts.map((row) => (
              <TableRow key={row.cohort.id}>
                <TableCell className="py-2 font-medium">{row.cohort.name}</TableCell>
                <TableCell className="py-2 text-zinc-500">
                  {(row as { seriesName?: string }).seriesName ?? "—"}
                </TableCell>
                <TableCell className="py-2 text-zinc-500">{row.cohort.status}</TableCell>
                <TableCell className="py-2 text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/cohorts/${row.cohort.id}`}>考勤入口</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!cohorts.length && (
              <TableRow>
                <TableCell colSpan={4} className="py-4 text-center text-sm text-zinc-500">
                  暂无期班
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
