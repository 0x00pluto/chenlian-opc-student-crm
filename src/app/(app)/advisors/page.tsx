"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
      <div className="rounded-md border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>企微 ID</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>学员数</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((a) => (
              <TableRow key={a.id as string}>
                <TableCell className="py-2 font-medium">{a.name as string}</TableCell>
                <TableCell className="py-2 text-zinc-500">
                  {(a.wecomUserid as string) ?? "—"}
                </TableCell>
                <TableCell className="py-2 text-zinc-500">{a.status as string}</TableCell>
                <TableCell className="py-2">{a.studentCount as number}</TableCell>
                <TableCell className="py-2 text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/advisors/${a.id}/transfer`}>离职转移</Link>
                  </Button>
                  {a.status === "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deactivate(a.id as string)}
                    >
                      停用
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
