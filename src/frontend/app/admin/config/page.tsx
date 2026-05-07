"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPlatformConfig, updatePlatformConfig } from "@/lib/admin-api";
import { useState, useEffect } from "react";
import { Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function AdminConfigPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-config"],
    queryFn: fetchPlatformConfig,
  });

  const [localConfig, setLocalConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (data?.config) setLocalConfig(data.config);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: updatePlatformConfig,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-config"] }); toast.success("Config saved"); },
  });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-gray-200 rounded" /><div className="h-96 bg-gray-100 rounded-xl" /></div>;

  const update = (key: string, value: any) => {
    setLocalConfig({ ...localConfig, [key]: value });
  };

  const toggle = (key: string) => update(key, !localConfig[key]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">Feature flags, matching engine weights, and defaults</p>
        </div>
        <button
          onClick={() => saveMut.mutate(localConfig)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wander-teal text-white font-medium text-sm"
          disabled={saveMut.isPending}
        >
          <Save className="w-4 h-4" /> Save Config
        </button>
      </div>

      {/* Feature Flags */}
      <ConfigSection title="Feature Flags">
        {[
          { key: "feature_sos", label: "SOS Emergency", desc: "Enable emergency SOS trigger" },
          { key: "feature_ephemeral_chat", label: "Ephemeral Chat", desc: "Auto-expiring group chat" },
          { key: "feature_ai_matching", label: "AI Matching Engine", desc: "CP-SAT optimized group formation" },
          { key: "feature_digilocker", label: "DigiLocker Verification", desc: "Government ID verification" },
          { key: "feature_wander_report", label: "Wander Report", desc: "Post-activity analytics for users" },
        ].map(f => (
          <div key={f.key} className="flex items-center justify-between py-3 border-b last:border-0">
            <div>
              <p className="font-medium text-gray-900">{f.label}</p>
              <p className="text-xs text-gray-400">{f.desc}</p>
            </div>
            <button
              onClick={() => toggle(f.key)}
              className={`relative w-11 h-6 rounded-full transition-colors ${localConfig[f.key] ? "bg-wander-teal" : "bg-gray-300"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${localConfig[f.key] ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        ))}
      </ConfigSection>

      {/* Matching Weights */}
      <ConfigSection title="Matching Engine Weights">
        {localConfig.matching_weights && Object.entries(localConfig.matching_weights as Record<string, number>).map(([key, val]) => (
          <div key={key} className="py-3 border-b last:border-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-700 capitalize">{key.replace(/_/g, " ")}</p>
              <span className="text-xs text-gray-500">{(Number(val) * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={val}
              onChange={e => {
                const weights = { ...localConfig.matching_weights, [key]: parseFloat(e.target.value) };
                update("matching_weights", weights);
              }}
              className="w-full accent-wander-teal"
            />
          </div>
        ))}
      </ConfigSection>

      {/* Chat TTL */}
      <ConfigSection title="Chat TTL Configuration">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Pre-Event Window (days)</label>
            <input
              type="number"
              min={1}
              max={7}
              value={localConfig.chat_ttl_pre_event_days || 2}
              onChange={e => update("chat_ttl_pre_event_days", parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Post-Event Window (days)</label>
            <input
              type="number"
              min={1}
              max={14}
              value={localConfig.chat_ttl_post_event_days || 3}
              onChange={e => update("chat_ttl_post_event_days", parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </ConfigSection>

      {/* Group Size Defaults */}
      <ConfigSection title="Default Group Sizes">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Min Group Size</label>
            <input type="number" min={2} max={10} value={localConfig.default_group_size_min || 4} onChange={e => update("default_group_size_min", parseInt(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Max Group Size</label>
            <input type="number" min={3} max={20} value={localConfig.default_group_size_max || 6} onChange={e => update("default_group_size_max", parseInt(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
        </div>
      </ConfigSection>

      {/* Banned Keywords */}
      <ConfigSection title="Banned Keywords (comma-separated)">
        <textarea
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm h-24"
          value={(localConfig.banned_keywords || []).join(", ")}
          onChange={e => update("banned_keywords", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
          placeholder="spam, abuse, harassment..."
        />
      </ConfigSection>
    </div>
  );
}

function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}
