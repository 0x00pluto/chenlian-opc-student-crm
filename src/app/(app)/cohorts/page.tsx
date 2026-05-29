"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CohortStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
      <div className="rounded-md border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>期班</TableHead>
              <TableHead>系列</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>状态</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => {
              const c = row.cohort as Record<string, unknown>;
              return (
                <TableRow key={c.id as string}>
                  <TableCell className="py-2 font-medium">{c.name as string}</TableCell>
                  <TableCell className="py-2 text-zinc-500">{row.seriesName as string}</TableCell>
                  <TableCell className="py-2 text-zinc-500">{row.categoryName as string}</TableCell>
                  <TableCell className="py-2">
                    <CohortStatusBadge status={c.status as string} />
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/cohorts/${c.id}`}>详情</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
