"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminNotifications, sendAdminNotification } from "@/lib/admin-api";
import { useState } from "react";
import { Send, Bell, Users, Calendar, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function AdminNotificationsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", body: "", target_type: "all", target_id: "" });

  const { data } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: fetchAdminNotifications,
  });

  const sendMut = useMutation({
    mutationFn: (data: any) => sendAdminNotification(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("Notification sent!");
      setForm({ title: "", body: "", target_type: "all", target_id: "" });
    },
  });

  const handleSend = () => {
    if (!form.title || !form.body) return toast.error("Title and body required");
    sendMut.mutate({
      title: form.title,
      body: form.body,
      target_type: form.target_type,
      target_id: form.target_id || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications Center</h1>
        <p className="text-sm text-gray-500 mt-1">Compose and send announcements to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Send className="w-4 h-4" /> Compose Announcement
          </h3>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Title</label>
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Announcement title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Body</label>
            <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm h-32" placeholder="Write your message..." value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Target</label>
              <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={form.target_type} onChange={e => setForm({ ...form, target_type: e.target.value })}>
                <option value="all">All Users</option>
                <option value="event">Event Attendees</option>
                <option value="group">Specific Group</option>
              </select>
            </div>
            {(form.target_type === "event" || form.target_type === "group") && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Target ID</label>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono" placeholder="UUID" value={form.target_id} onChange={e => setForm({ ...form, target_id: e.target.value })} />
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            className="w-full py-2.5 rounded-lg bg-wander-teal text-white font-medium text-sm hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
            disabled={sendMut.isPending}
          >
            <Send className="w-4 h-4" /> {sendMut.isPending ? "Sending..." : "Send Announcement"}
          </button>
        </div>

        {/* Log */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4" /> Notification Log
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {data?.items?.map((n: any) => (
              <div key={n.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-sm text-gray-900">{n.title}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${n.sent_at ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {n.sent_at ? "Sent" : "Scheduled"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.body}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Target: {n.target_type}</span>
                  {n.sent_at && <span>Sent: {new Date(n.sent_at).toLocaleString()}</span>}
                  <span>Delivered: {n.delivered_count}</span>
                  <span>Opened: {n.opened_count}</span>
                </div>
              </div>
            ))}
            {data?.items?.length === 0 && (
              <p className="text-center text-gray-400 py-8">No notifications sent yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
