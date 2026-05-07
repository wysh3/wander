"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchFlaggedUsers, resolveFlag, fetchSOSIncidents, resolveSOS, fetchChatAudit } from "@/lib/admin-api";
import { Flag, ShieldAlert, MessageSquare, Search, Check, Ban, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminModerationPage() {
  const [tab, setTab] = useState<"flags" | "sos" | "chat">("flags");
  const [groupSearch, setGroupSearch] = useState("");
  const [chatData, setChatData] = useState<any>(null);
  const [chatLoading, setChatLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
        <p className="text-sm text-gray-500 mt-1">Review flagged users, SOS incidents, and chat logs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: "flags", label: "Flagged Users", icon: Flag },
          { key: "sos", label: "SOS Incidents", icon: ShieldAlert },
          { key: "chat", label: "Chat Audit", icon: MessageSquare },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? "border-wander-teal text-wander-teal" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "flags" && <FlaggedUsersTab />}
      {tab === "sos" && <SOSTab />}
      {tab === "chat" && <ChatAuditTab groupSearch={groupSearch} setGroupSearch={setGroupSearch} chatData={chatData} setChatData={setChatData} chatLoading={chatLoading} setChatLoading={setChatLoading} />}
    </div>
  );
}

function FlaggedUsersTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-flags"], queryFn: () => fetchFlaggedUsers() });

  const resolveMut = useMutation({
    mutationFn: ({ id, data }: any) => resolveFlag(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-flags"] }); toast.success("Resolved"); },
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left p-3 font-medium text-gray-600">User</th>
            <th className="text-left p-3 font-medium text-gray-600">Reason</th>
            <th className="text-left p-3 font-medium text-gray-600">Type</th>
            <th className="text-left p-3 font-medium text-gray-600">Status</th>
            <th className="text-left p-3 font-medium text-gray-600">Date</th>
            <th className="text-right p-3 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.items?.map((f: any) => (
            <tr key={f.id} className="border-b hover:bg-gray-50">
              <td className="p-3">
                <p className="font-medium">{f.user_name || "Unknown"}</p>
                <p className="text-xs text-gray-400">{f.user_phone}</p>
              </td>
              <td className="p-3 text-gray-600">{f.reason || "—"}</td>
              <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{f.flag_type}</span></td>
              <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${f.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{f.status}</span></td>
              <td className="p-3 text-gray-400 text-xs">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ""}</td>
              <td className="p-3">
                <div className="flex items-center gap-1 justify-end">
                  <button onClick={() => resolveMut.mutate({ id: f.id, data: { action: "warn", admin_notes: "Warned user" } })} className="p-1.5 rounded hover:bg-yellow-50" title="Warn">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  </button>
                  <button onClick={() => resolveMut.mutate({ id: f.id, data: { action: "ban", admin_notes: "Banned by admin" } })} className="p-1.5 rounded hover:bg-red-50" title="Ban">
                    <Ban className="w-4 h-4 text-red-500" />
                  </button>
                  <button onClick={() => resolveMut.mutate({ id: f.id, data: { action: "resolve", admin_notes: "Reviewed, no action" } })} className="p-1.5 rounded hover:bg-green-50" title="Resolve">
                    <Check className="w-4 h-4 text-green-500" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {data?.items?.length === 0 && (
            <tr><td colSpan={6} className="p-8 text-center text-gray-400">No flagged users</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SOSTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-sos"], queryFn: () => fetchSOSIncidents() });

  const resolveMut = useMutation({
    mutationFn: ({ id, data }: any) => resolveSOS(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sos"] }); toast.success("Resolved"); },
  });

  return (
    <div className="space-y-3">
      {data?.items?.map((s: any) => (
        <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span className="font-medium">{s.user_name || "Unknown"}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${s.resolved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {s.resolution_status}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <span>Police Station: {s.nearest_police_station || "N/A"}</span>
                <span>Coords: {s.lat?.toFixed(4)}, {s.lng?.toFixed(4)}</span>
                <span>Group: {s.group_id?.slice(0, 8) || "N/A"}</span>
                <span>Triggered: {s.triggered_at ? new Date(s.triggered_at).toLocaleString() : ""}</span>
              </div>
              {s.admin_notes && <p className="mt-2 text-xs text-gray-400 italic">Notes: {s.admin_notes}</p>}
            </div>
            {!s.resolved && (
              <button
                onClick={() => resolveMut.mutate({ id: s.id, data: { action: "resolve", admin_notes: "Resolved by admin" } })}
                className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm font-medium hover:bg-green-200"
              >
                Resolve
              </button>
            )}
          </div>
        </div>
      ))}
      {data?.items?.length === 0 && (
        <div className="text-center py-12 text-gray-400">No SOS incidents</div>
      )}
    </div>
  );
}

function ChatAuditTab({ groupSearch, setGroupSearch, chatData, setChatData, chatLoading, setChatLoading }: any) {
  const loadChat = async () => {
    if (!groupSearch) return;
    setChatLoading(true);
    try {
      const data = await fetchChatAudit(groupSearch);
      setChatData(data);
    } catch { toast.error("Chat not found"); }
    setChatLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Enter Group ID..." value={groupSearch} onChange={e => setGroupSearch(e.target.value)} />
        </div>
        <button onClick={loadChat} className="px-4 py-2 rounded-lg bg-wander-teal text-white text-sm font-medium" disabled={chatLoading}>
          {chatLoading ? "Loading..." : "View Chat"}
        </button>
      </div>

      {chatData && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-bold">SAFETY REVIEW MODE</span>
                Group Chat Audit
              </h3>
              <p className="text-xs text-gray-400 mt-1">Group: {chatData.group_id} • {chatData.member_count} members • {chatData.messages?.length || 0} messages</p>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {chatData.messages?.map((m: any) => (
              <div key={m.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shrink-0">
                  {m.user_name?.[0] || "?"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.user_name || "Unknown"}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{m.user_id?.slice(0, 6)}</span>
                    <span className="text-[10px] text-gray-300">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-700">{m.content}</p>
                </div>
              </div>
            ))}
            {chatData.messages?.length === 0 && <p className="text-center text-gray-400 py-8">No messages in this group</p>}
          </div>
        </div>
      )}
    </div>
  );
}
