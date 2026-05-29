"use client";

import { useEffect, useState } from "react";

import {
  DataTableBodyRow,
  DataTableHead,
  DataTableHeaderRow,
  DataTableShell,
  tableCellPrimary,
  tableCellSecondary,
} from "@/components/shared/data-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "@/components/ui/table";

export default function AuditLogsPage() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    fetch("/api/audit-logs")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-900">审计日志</h2>
      <DataTableShell>
        <Table>
          <TableHeader>
            <DataTableHeaderRow>
              <DataTableHead>时间</DataTableHead>
              <DataTableHead>操作</DataTableHead>
              <DataTableHead>操作人</DataTableHead>
              <DataTableHead>详情</DataTableHead>
            </DataTableHeaderRow>
          </TableHeader>
          <TableBody>
            {items.map((log) => (
              <DataTableBodyRow key={log.id as string}>
                <TableCell className={tableCellSecondary}>
                  {(log.createdAt as string)?.slice(0, 19)}
                </TableCell>
                <TableCell className={tableCellPrimary}>{log.action as string}</TableCell>
                <TableCell className={tableCellSecondary}>
                  {log.operatorName as string}
                </TableCell>
                <TableCell className="max-w-md truncate px-4 py-2 text-sm text-zinc-500">
                  {JSON.stringify(log.payload)}
                </TableCell>
              </DataTableBodyRow>
            ))}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
