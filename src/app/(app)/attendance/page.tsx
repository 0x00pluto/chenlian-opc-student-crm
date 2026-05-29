"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  DataTableBodyRow,
  DataTableHead,
  DataTableHeaderRow,
  DataTableShell,
  TableRowActionButton,
  tableCellActions,
  tableCellEmpty,
  tableCellPrimary,
  tableCellSecondary,
} from "@/components/shared/data-table";
import { CohortStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
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
      <DataTableShell>
        <Table>
          <TableHeader>
            <DataTableHeaderRow>
              <DataTableHead>期班</DataTableHead>
              <DataTableHead>系列</DataTableHead>
              <DataTableHead>状态</DataTableHead>
              <DataTableHead className="w-[88px]" />
            </DataTableHeaderRow>
          </TableHeader>
          <TableBody>
            {cohorts.map((row) => (
              <DataTableBodyRow key={row.cohort.id}>
                <TableCell className={tableCellPrimary}>{row.cohort.name}</TableCell>
                <TableCell className={tableCellSecondary}>
                  {row.seriesName ?? "—"}
                </TableCell>
                <TableCell className="px-4 py-2">
                  <CohortStatusBadge status={row.cohort.status} />
                </TableCell>
                <TableCell className={tableCellActions}>
                  <TableRowActionButton asChild>
                    <Link href={`/cohorts/${row.cohort.id}`}>考勤入口</Link>
                  </TableRowActionButton>
                </TableCell>
              </DataTableBodyRow>
            ))}
            {!cohorts.length && (
              <TableRow>
                <TableCell colSpan={4} className={tableCellEmpty}>
                  暂无期班
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
