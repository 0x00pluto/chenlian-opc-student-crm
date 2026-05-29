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
  tableCellPrimary,
  tableCellSecondary,
} from "@/components/shared/data-table";
import { CohortStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "@/components/ui/table";

export default function CohortsPage() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    fetch("/api/cohorts")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-900">期班列表</h2>
      <DataTableShell>
        <Table>
          <TableHeader>
            <DataTableHeaderRow>
              <DataTableHead>期班</DataTableHead>
              <DataTableHead>系列</DataTableHead>
              <DataTableHead>分类</DataTableHead>
              <DataTableHead>状态</DataTableHead>
              <DataTableHead className="w-[72px]" />
            </DataTableHeaderRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => {
              const c = row.cohort as Record<string, unknown>;
              return (
                <DataTableBodyRow key={c.id as string}>
                  <TableCell className={tableCellPrimary}>
                    {c.name as string}
                  </TableCell>
                  <TableCell className={tableCellSecondary}>
                    {row.seriesName as string}
                  </TableCell>
                  <TableCell className={tableCellSecondary}>
                    {row.categoryName as string}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <CohortStatusBadge status={c.status as string} />
                  </TableCell>
                  <TableCell className={tableCellActions}>
                    <TableRowActionButton asChild>
                      <Link href={`/cohorts/${c.id}`}>详情</Link>
                    </TableRowActionButton>
                  </TableCell>
                </DataTableBodyRow>
              );
            })}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
