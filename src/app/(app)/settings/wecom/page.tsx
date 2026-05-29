"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WecomSettingsPage() {
  const [corpId, setCorpId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [mockEnabled, setMockEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/settings/wecom")
      .then((r) => r.json())
      .then((d) => {
        setCorpId(d.corpId ?? "");
        setAgentId(d.agentId ?? "");
        setMockEnabled(d.mockEnabled ?? true);
      });
  }, []);

  async function save() {
    const res = await fetch("/api/settings/wecom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ corpId, agentId, mockEnabled }),
    });
    if (!res.ok) return toast.error("保存失败");
    toast.success("已保存");
  }

  return (
    <div className="max-w-md space-y-6">
      <h2 className="text-lg font-medium text-zinc-900">企微配置</h2>
      <p className="text-sm text-zinc-500">
        配置企业微信客户联系参数。未接入真实环境前，可启用离线联调。
      </p>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Corp ID</Label>
          <Input value={corpId} onChange={(e) => setCorpId(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Agent ID</Label>
          <Input value={agentId} onChange={(e) => setAgentId(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mockEnabled}
            onChange={(e) => setMockEnabled(e.target.checked)}
          />
          启用离线联调
        </label>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={save}>
          保存配置
        </Button>
      </div>
    </div>
  );
}
