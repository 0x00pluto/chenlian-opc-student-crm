"use client";

import { useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
      <div className="rounded-md border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>时间</TableHead>
              <TableHead>操作</TableHead>
              <TableHead>操作人</TableHead>
              <TableHead>详情</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((log) => (
              <TableRow key={log.id as string}>
                <TableCell className="py-2 text-zinc-500">
                  {(log.createdAt as string)?.slice(0, 19)}
                </TableCell>
                <TableCell className="py-2">{log.action as string}</TableCell>
                <TableCell className="py-2">{log.operatorName as string}</TableCell>
                <TableCell className="max-w-md truncate py-2 text-xs text-zinc-500">
                  {JSON.stringify(log.payload)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
