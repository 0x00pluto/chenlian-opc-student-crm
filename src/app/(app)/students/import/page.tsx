"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";

type ImportBatch = {
  id: string;
  status: string;
  totalRows: number;
  createdCount: number;
  mergedCount: number;
  skippedCount: number;
  pendingCount: number;
  operatorName: string;
  createdAt: string;
};

export default function StudentImportPage() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [batches, setBatches] = useState<ImportBatch[]>([]);

  function loadBatches() {
    fetch("/api/students/import/batches")
      .then((r) => r.json())
      .then((d) => setBatches(d.items ?? []));
  }

  useEffect(() => {
    loadBatches();
  }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/students/import", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error);
    setResult(data);
    toast.success("导入完成");
    loadBatches();
    e.target.value = "";
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-lg font-medium text-zinc-900">互动吧 CSV 导入</h2>
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium">上传文件</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-500">
            必填列：手机号、姓名。可选：备注。支持列名 phone/name 或中文列名。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/api/students/import/template" download>
                下载导入模板
              </a>
            </Button>
          </div>
          <input type="file" accept=".csv" onChange={onUpload} className="text-sm" />
        </CardContent>
      </Card>
      {result && (
        <Card className="border-zinc-200">
          <CardContent className="space-y-1 py-4 text-sm">
            <p>新建：{result.created as number}</p>
            <p>自动合并：{result.merged as number}</p>
            <p>待确认：{result.pending as number}</p>
            <p>跳过：{result.skipped as number}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(result.pending as number) > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/merge">前往合并确认</a>
                </Button>
              )}
              {Array.isArray(result.failures) &&
                result.failures.length > 0 &&
                typeof result.batchId === "string" && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`/api/students/import/batches/${result.batchId}/failures`}
                    download
                  >
                    下载失败行 CSV
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium">导入历史</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>新建</TableHead>
                <TableHead>合并</TableHead>
                <TableHead>待确认</TableHead>
                <TableHead>跳过</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="py-2 text-zinc-500">
                    {formatDateTime(b.createdAt)}
                  </TableCell>
                  <TableCell className="py-2">{b.operatorName}</TableCell>
                  <TableCell className="py-2">{b.createdCount}</TableCell>
                  <TableCell className="py-2">{b.mergedCount}</TableCell>
                  <TableCell className="py-2">{b.pendingCount}</TableCell>
                  <TableCell className="py-2">{b.skippedCount}</TableCell>
                  <TableCell className="py-2 text-right">
                    {b.skippedCount > 0 && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/api/students/import/batches/${b.id}/failures`} download>
                          失败 CSV
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!batches.length && (
                <TableRow>
                  <TableCell colSpan={7} className="py-4 text-center text-sm text-zinc-500">
                    暂无导入记录
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
