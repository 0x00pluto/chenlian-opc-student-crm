"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  DataTableBodyRow,
  DataTableHead,
  DataTableHeaderRow,
  DataTableShell,
  TableRowActionButton,
  tableCellActions,
  tableCellPrimary,
  tableCellSecondary,
} from "@/components/shared/data-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "@/components/ui/table";

export default function AdvisorsPage() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  function load() {
    fetch("/api/advisors")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function deactivate(advisorId: string) {
    if (!confirm("确认停用该班主任？名下仍有学员时将无法停用。")) return;
    const res = await fetch(`/api/advisors/${advisorId}/deactivate`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error);
    toast.success("已停用");
    load();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-900">班主任管理</h2>
      <DataTableShell>
        <Table>
          <TableHeader>
            <DataTableHeaderRow>
              <DataTableHead>姓名</DataTableHead>
              <DataTableHead>企微 ID</DataTableHead>
              <DataTableHead>状态</DataTableHead>
              <DataTableHead>学员数</DataTableHead>
              <DataTableHead className="w-[140px]" />
            </DataTableHeaderRow>
          </TableHeader>
          <TableBody>
            {items.map((a) => (
              <DataTableBodyRow key={a.id as string}>
                <TableCell className={tableCellPrimary}>{a.name as string}</TableCell>
                <TableCell className={tableCellSecondary}>
                  {(a.wecomUserid as string) ?? "—"}
                </TableCell>
                <TableCell className={tableCellSecondary}>{a.status as string}</TableCell>
                <TableCell className={tableCellSecondary}>
                  {a.studentCount as number}
                </TableCell>
                <TableCell className={tableCellActions}>
                  <TableRowActionButton asChild>
                    <Link href={`/advisors/${a.id}/transfer`}>离职转移</Link>
                  </TableRowActionButton>
                  {a.status === "active" && (
                    <TableRowActionButton onClick={() => deactivate(a.id as string)}>
                      停用
                    </TableRowActionButton>
                  )}
                </TableCell>
              </DataTableBodyRow>
            ))}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
