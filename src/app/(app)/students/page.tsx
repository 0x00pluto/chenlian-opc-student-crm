"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { formatDate } from "@/lib/format";
import { parseTags } from "@/lib/tags";

type Student = {
  id: string;
  name: string;
  phone: string;
  source: string;
  tags: string;
  advisorName?: string;
  lastFollowUpAt: string | null;
};

export default function StudentsPage() {
  const [items, setItems] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [advisors, setAdvisors] = useState<{ id: string; name: string }[]>([]);
  const [advisorId, setAdvisorId] = useState("");

  const load = useCallback(() => {
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    fetch(`/api/students${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, [q]);

  useEffect(() => {
    load();
    fetch("/api/advisors/list")
      .then((r) => r.json())
      .then((d) => setAdvisors(d.items ?? []));
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        assignedAdvisorId: advisorId || undefined,
      }),
    });
    const data = await res.json();
    if (res.status === 409) {
      toast.error("手机号已存在");
      if (data.existingId) {
        window.location.href = `/students/${data.existingId}`;
      }
      return;
    }
    if (!res.ok) {
      toast.error(data.error ?? "创建失败");
      return;
    }
    toast.success("学员已创建");
    setOpen(false);
    setName("");
    setPhone("");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-zinc-900">学员列表</h2>
        <div className="flex gap-2">
          <Input
            placeholder="搜索姓名/手机号"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-48"
          />
          <Button variant="outline" size="sm" onClick={load}>
            搜索
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                新建学员
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>录入学员</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>姓名</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>手机号</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                {advisors.length > 0 && (
                  <div className="space-y-2">
                    <Label>班主任</Label>
                    <Select value={advisorId} onValueChange={setAdvisorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="默认当前账号" />
                      </SelectTrigger>
                      <SelectContent>
                        {advisors.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  保存
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DataTableShell>
        <Table>
          <TableHeader>
            <DataTableHeaderRow>
              <DataTableHead>姓名</DataTableHead>
              <DataTableHead>手机号</DataTableHead>
              <DataTableHead>班主任</DataTableHead>
              <DataTableHead>标签</DataTableHead>
              <DataTableHead>最后跟进</DataTableHead>
              <DataTableHead className="w-[72px]" />
            </DataTableHeaderRow>
          </TableHeader>
          <TableBody>
            {items.map((s) => (
              <DataTableBodyRow key={s.id}>
                <TableCell className={tableCellPrimary}>{s.name}</TableCell>
                <TableCell className={tableCellSecondary}>{s.phone}</TableCell>
                <TableCell className={tableCellSecondary}>{s.advisorName}</TableCell>
                <TableCell className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {parseTags(s.tags).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className={tableCellSecondary}>
                  {formatDate(s.lastFollowUpAt)}
                </TableCell>
                <TableCell className={tableCellActions}>
                  <TableRowActionButton asChild>
                    <Link href={`/students/${s.id}`}>详情</Link>
                  </TableRowActionButton>
                </TableCell>
              </DataTableBodyRow>
            ))}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
