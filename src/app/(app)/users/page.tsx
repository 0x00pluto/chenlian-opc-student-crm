"use client";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  advisorId: string | null;
  advisorName: string | null;
  status: string;
};

type AdvisorOption = { id: string; name: string };

const emptyForm = {
  email: "",
  password: "",
  name: "",
  role: "advisor",
  advisorId: "",
  status: "active",
};

export default function UsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorOption[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  function load() {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
    fetch("/api/advisors")
      .then((r) => r.json())
      .then((d) => setAdvisors(d.items ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(u: UserRow) {
    setEditing(u);
    setForm({
      email: u.email,
      password: "",
      name: u.name,
      role: u.role,
      advisorId: u.advisorId ?? "",
      status: u.status,
    });
    setOpen(true);
  }

  async function save() {
    if (editing) {
      const res = await fetch(`/api/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          advisorId: form.advisorId || null,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error);
      toast.success("已更新");
    } else {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          role: form.role,
          advisorId: form.advisorId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error);
      toast.success("用户已创建");
    }
    setOpen(false);
    load();
  }

  async function resetPassword(userId: string) {
    const res = await fetch(`/api/users/${userId}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error);
    toast.success(`临时密码：${data.temporaryPassword}`, { duration: 10000 });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-900">用户与角色</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
          新建用户
        </Button>
      </div>
      <DataTableShell>
        <Table>
          <TableHeader>
            <DataTableHeaderRow>
              <DataTableHead>邮箱</DataTableHead>
              <DataTableHead>姓名</DataTableHead>
              <DataTableHead>角色</DataTableHead>
              <DataTableHead>班主任</DataTableHead>
              <DataTableHead>状态</DataTableHead>
              <DataTableHead className="w-[140px]" />
            </DataTableHeaderRow>
          </TableHeader>
          <TableBody>
            {items.map((u) => (
              <DataTableBodyRow key={u.id}>
                <TableCell className={tableCellSecondary}>{u.email}</TableCell>
                <TableCell className={tableCellPrimary}>{u.name}</TableCell>
                <TableCell className={tableCellSecondary}>{u.role}</TableCell>
                <TableCell className={tableCellSecondary}>{u.advisorName ?? "—"}</TableCell>
                <TableCell className={tableCellSecondary}>{u.status}</TableCell>
                <TableCell className={tableCellActions}>
                  <TableRowActionButton onClick={() => openEdit(u)}>
                    编辑
                  </TableRowActionButton>
                  <TableRowActionButton onClick={() => resetPassword(u.id)}>
                    重置密码
                  </TableRowActionButton>
                </TableCell>
              </DataTableBodyRow>
            ))}
          </TableBody>
        </Table>
      </DataTableShell>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑用户" : "新建用户"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!editing && (
              <>
                <div className="space-y-1">
                  <Label>邮箱</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>初始密码</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="space-y-1">
              <Label>姓名</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>角色</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advisor">班主任</SelectItem>
                  <SelectItem value="admin">业务管理员</SelectItem>
                  <SelectItem value="super_admin">超级管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === "advisor" && (
              <div className="space-y-1">
                <Label>关联班主任</Label>
                <Select
                  value={form.advisorId}
                  onValueChange={(v) => setForm({ ...form, advisorId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择班主任" />
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
            {editing && (
              <div className="space-y-1">
                <Label>状态</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={save}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
