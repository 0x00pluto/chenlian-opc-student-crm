"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  DataTableBodyRow,
  DataTableHead,
  DataTableHeaderRow,
  DataTableShell,
  TableRowActionButton,
  tableCellEmpty,
  tableCellPrimary,
  tableCellSecondary,
} from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  TableRow,
} from "@/components/ui/table";

type StudentRow = {
  id: string;
  name: string;
  phone: string;
};

export default function AdvisorTransferPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [advisors, setAdvisors] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [targetId, setTargetId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/advisors")
      .then((r) => r.json())
      .then((d) =>
        setAdvisors(
          (d.items ?? []).filter((a: { id: string }) => a.id !== id),
        ),
      );
    fetch(`/api/students?advisorId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        const items = (d.items ?? []) as StudentRow[];
        setStudents(items);
        setSelected(new Set(items.map((s) => s.id)));
      });
  }, [id]);

  const allSelected = useMemo(
    () => students.length > 0 && selected.size === students.length,
    [students, selected],
  );

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(students.map((s) => s.id)));
  }

  function toggleOne(studentId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  async function transfer() {
    if (!targetId) return toast.error("请选择目标班主任");
    if (!selected.size) return toast.error("请至少勾选一名学员");
    const res = await fetch(`/api/advisors/${id}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetAdvisorId: targetId,
        studentIds: Array.from(selected),
      }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error);
    toast.success(`已转移 ${data.transferred} 名学员`);
    router.push("/advisors");
  }

  async function deactivate() {
    const res = await fetch(`/api/advisors/${id}/deactivate`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error);
    toast.success("班主任已停用");
    router.push("/advisors");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-medium text-zinc-900">班主任离职转移</h2>
      <p className="text-sm text-zinc-500">
        勾选需转移的学员（默认全选），转移至目标班主任并写入审计日志。
      </p>
      <div className="space-y-2">
        <Select value={targetId} onValueChange={setTargetId}>
          <SelectTrigger>
            <SelectValue placeholder="选择目标班主任" />
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

      <DataTableShell
        toolbar={
          <>
            <span className="text-sm text-zinc-600">
              名下学员 {students.length} 人 · 已选 {selected.size} 人
            </span>
            <TableRowActionButton onClick={toggleAll}>
              {allSelected ? "取消全选" : "全选"}
            </TableRowActionButton>
          </>
        }
      >
        <Table>
          <TableHeader>
            <DataTableHeaderRow>
              <DataTableHead className="w-10" />
              <DataTableHead>姓名</DataTableHead>
              <DataTableHead>手机号</DataTableHead>
            </DataTableHeaderRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <DataTableBodyRow key={s.id}>
                <TableCell className="px-4 py-2">
                  <Checkbox
                    checked={selected.has(s.id)}
                    onCheckedChange={() => toggleOne(s.id)}
                  />
                </TableCell>
                <TableCell className={tableCellPrimary}>{s.name}</TableCell>
                <TableCell className={tableCellSecondary}>{s.phone}</TableCell>
              </DataTableBodyRow>
            ))}
            {!students.length && (
              <TableRow>
                <TableCell colSpan={3} className={tableCellEmpty}>
                  该班主任名下暂无学员
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataTableShell>

      <div className="flex gap-2">
        <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={transfer}>
          确认转移
        </Button>
        <Button variant="outline" size="sm" onClick={deactivate}>
          转移后停用账号
        </Button>
      </div>
    </div>
  );
}
