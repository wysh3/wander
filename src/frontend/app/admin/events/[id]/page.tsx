"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminEvent, updateAdminEvent, triggerMatching, fetchEventAttendees } from "@/lib/admin-api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save, Zap, Download } from "lucide-react";
import { ChangeEvent } from "react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "physical", label: "Physical" },
  { value: "mental", label: "Mental / Wellness" },
  { value: "skill", label: "Skill-building" },
  { value: "explore", label: "Explore" },
  { value: "chaotic", label: "Chaotic / Fun" },
  { value: "social_good", label: "Social Good" },
  { value: "slow", label: "Slow / Relaxed" },
];

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editData, setEditData] = useState<any>({});

  const { data: event, isLoading } = useQuery({
    queryKey: ["admin-event", id],
    queryFn: () => fetchAdminEvent(id as string),
  });

  const { data: attendees } = useQuery({
    queryKey: ["event-attendees", id],
    queryFn: () => fetchEventAttendees(id as string),
  });

  const updateMut = useMutation({
    mutationFn: (data: any) => updateAdminEvent(id as string, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-event", id] }); toast.success("Event updated"); },
  });

  const matchMut = useMutation({
    mutationFn: () => triggerMatching(id as string),
    onSuccess: (d: any) => toast.success(d.matched ? `Created ${d.groups_created} groups` : d.reason),
  });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-gray-200 rounded" /><div className="h-64 bg-gray-100 rounded-xl" /></div>;
  if (!event) return <div>Event not found</div>;

  const handleSave = () => {
    if (Object.keys(editData).length === 0) return;
    updateMut.mutate(editData);
    setEditData({});
  };

  const update = (key: string, value: any) => {
    setEditData({ ...editData, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/admin/events")} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            <p className="text-sm text-gray-500">Event ID: {event.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-300" disabled={Object.keys(editData).length === 0}>
            <Save className="w-4 h-4" /> Save Changes
          </button>
          <button onClick={() => matchMut.mutate()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wander-teal text-white font-medium text-sm hover:bg-teal-600">
            <Zap className="w-4 h-4" /> Run AI Matching
          </button>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold mb-4">Event Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Title" value={editData.title ?? event.title} onChange={v => update("title", v)} />
          <Field label="Description" value={(editData.description ?? event.description) || ""} onChange={v => update("description", v)} type="textarea" />
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Category</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={(editData.category ?? event.category) || ""}
              onChange={e => update("category", e.target.value)}
            >
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <Field label="Area" value={(editData.area ?? event.area) || ""} onChange={v => update("area", v)} />
          <Field label="Latitude" value={editData.lat ?? (event.lat ?? "")} onChange={v => update("lat", v ? +v : null)} />
          <Field label="Longitude" value={editData.lng ?? (event.lng ?? "")} onChange={v => update("lng", v ? +v : null)} />
          <Field label="Scheduled At" value={editData.scheduled_at ?? (event.scheduled_at?.slice(0, 16) || "")} onChange={v => update("scheduled_at", new Date(v).toISOString())} type="datetime-local" />
          <Field label="Duration (min)" value={editData.duration_minutes ?? event.duration_minutes} onChange={v => update("duration_minutes", +v)} type="number" />
          <Field label="Group Min Size" value={editData.group_size_min ?? event.group_size_min} onChange={v => update("group_size_min", +v)} type="number" />
          <Field label="Group Max Size" value={editData.group_size_max ?? event.group_size_max} onChange={v => update("group_size_max", +v)} type="number" />
          <Field label="Max Groups" value={editData.max_groups ?? event.max_groups} onChange={v => update("max_groups", +v)} type="number" />
          <Field label="Min Capacity" value={editData.min_capacity ?? event.min_capacity} onChange={v => update("min_capacity", +v)} type="number" />
          <Field label="Max Capacity" value={editData.max_capacity ?? event.max_capacity} onChange={v => update("max_capacity", +v)} type="number" />
          <Field label="Ticket Type" value={editData.ticket_type ?? event.ticket_type} onChange={v => update("ticket_type", v)} />
          <Field label="Price (INR)" value={editData.ticket_price_inr ?? event.ticket_price_inr} onChange={v => update("ticket_price_inr", +v)} type="number" />
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={editData.status ?? event.status}
              onChange={e => update("status", e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="open">Published</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Visibility</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={editData.visibility ?? event.visibility}
              onChange={e => update("visibility", e.target.value)}
            >
              <option value="public">Public</option>
              <option value="invite-only">Invite Only</option>
            </select>
          </div>
          <Field label="Tags (comma-separated)" value={editData.tags ?? (event.tags?.join(", ") || "")} onChange={v => update("tags", v.split(",").map((s: string) => s.trim()).filter(Boolean))} />
        </div>
      </div>

      {/* Attendees */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Attendees ({attendees?.total || 0})</h3>
          <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
        {attendees?.items?.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Name</th>
                <th className="pb-2">Phone</th>
                <th className="pb-2">Verification</th>
                <th className="pb-2">Group</th>
                <th className="pb-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {attendees.items.map((a: any) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-2">{a.name || "—"}</td>
                  <td className="py-2 text-gray-400">{a.phone}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${a.verification_status === "verified" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {a.verification_status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500 text-xs font-mono">{a.group_id?.slice(0, 8) || "—"}</td>
                  <td className="py-2 text-gray-400 text-xs">{a.joined_at ? new Date(a.joined_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">No attendees yet</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  if (type === "textarea") {
    return (
      <div>
        <label className="text-xs text-gray-500 mb-1 block">{label}</label>
        <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm h-20" value={value} onChange={e => onChange(e.target.value)} />
      </div>
    );
  }
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <input type={type} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
