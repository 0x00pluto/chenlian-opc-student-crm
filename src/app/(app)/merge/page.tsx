"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Conflict = {
  id: string;
  phone: string;
  incomingData: { name?: string };
  existingStudent: { id: string; name: string; phone: string };
};

export default function MergePage() {
  const [items, setItems] = useState<Conflict[]>([]);

  function load() {
    fetch("/api/import-conflicts")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(
    conflictId: string,
    strategy: "keep_existing" | "use_incoming" | "skip",
  ) {
    const res = await fetch("/api/students/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conflictId, strategy }),
    });
    if (!res.ok) return toast.error((await res.json()).error);
    toast.success("已处理");
    load();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-900">导入冲突合并</h2>
      {items.map((c) => (
        <Card key={c.id} className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium">{c.phone}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              档案：{c.existingStudent.name} · 导入：{c.incomingData.name}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => resolve(c.id, "keep_existing")}>
                保留档案
              </Button>
              <Button size="sm" variant="outline" onClick={() => resolve(c.id, "use_incoming")}>
                使用导入姓名
              </Button>
              <Button size="sm" variant="ghost" onClick={() => resolve(c.id, "skip")}>
                跳过
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {!items.length && (
        <p className="text-sm text-zinc-500">暂无待处理冲突</p>
      )}
    </div>
  );
}
