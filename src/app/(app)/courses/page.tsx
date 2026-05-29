"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { labelCohort } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TreeNode = {
  id: string;
  name: string;
  series: {
    id: string;
    name: string;
    cohorts: { id: string; name: string; requiresInterview: boolean; status: string }[];
  }[];
};

export default function CoursesPage() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [catName, setCatName] = useState("");
  const [seriesName, setSeriesName] = useState("");
  const [cohortName, setCohortName] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [parentSeries, setParentSeries] = useState("");

  function load() {
    fetch("/api/course-tree")
      .then((r) => r.json())
      .then((d) => setTree(d.tree ?? []));
  }

  useEffect(() => {
    load();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((u) => {
        setCanManage(u.role === "admin" || u.role === "super_admin");
      });
  }, []);

  async function remove(type: "category" | "series" | "cohort", id: string) {
    if (!confirm("确认删除？有学籍的期班将改为归档。")) return;
    const res = await fetch("/api/course-tree", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "失败");
    toast.success(data.archived ? "已归档" : "已删除");
    load();
  }

  async function add(type: "category" | "series" | "cohort") {
    let body: Record<string, unknown> = { type };
    if (type === "category") body = { type, name: catName };
    if (type === "series") body = { type, name: seriesName, categoryId: parentCategory };
    if (type === "cohort")
      body = {
        type,
        name: cohortName,
        seriesId: parentSeries,
        requiresInterview: false,
      };

    const res = await fetch("/api/course-tree", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return toast.error((await res.json()).error ?? "失败");
    toast.success("已添加");
    load();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-zinc-900">
        {canManage ? "课程树管理" : "课程树"}
      </h2>
      {!canManage && (
        <p className="text-sm text-zinc-500">仅可查看，课程维护请联系管理员。</p>
      )}

      {canManage && (
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-sm">新建大课分类</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="分类名称" />
            <Button size="sm" variant="outline" onClick={() => add("category")}>
              添加
            </Button>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-sm">新建系列</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <select
              className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm"
              value={parentCategory}
              onChange={(e) => setParentCategory(e.target.value)}
            >
              <option value="">选择分类</option>
              {tree.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Input value={seriesName} onChange={(e) => setSeriesName(e.target.value)} placeholder="系列名称" />
              <Button size="sm" variant="outline" onClick={() => add("series")}>
                添加
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-sm">新建期班</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <select
              className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm"
              value={parentSeries}
              onChange={(e) => setParentSeries(e.target.value)}
            >
              <option value="">选择系列</option>
              {tree.flatMap((c) =>
                c.series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {c.name} / {s.name}
                  </option>
                )),
              )}
            </select>
            <div className="flex gap-2">
              <Input value={cohortName} onChange={(e) => setCohortName(e.target.value)} placeholder="期班名称" />
              <Button size="sm" variant="outline" onClick={() => add("cohort")}>
                添加
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      <div className="space-y-4">
        {tree.map((cat) => (
          <Card key={cat.id} className="border-zinc-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">{cat.name}</CardTitle>
              {canManage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove("category", cat.id)}
                >
                  删除
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {cat.series.map((s) => (
                <div key={s.id} className="border-l-2 border-zinc-200 pl-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-700">{s.name}</p>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove("series", s.id)}
                      >
                        删除
                      </Button>
                    )}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {s.cohorts.map((cohort) => (
                      <li
                        key={cohort.id}
                        className="flex items-center justify-between text-sm text-zinc-500"
                      >
                        <span>
                          · {cohort.name}{" "}
                          {cohort.requiresInterview ? "（需面试）" : ""} —{" "}
                          {labelCohort(cohort.status)}
                        </span>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove("cohort", cohort.id)}
                          >
                            删除
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
