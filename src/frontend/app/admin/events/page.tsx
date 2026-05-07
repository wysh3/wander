"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { fetchAdminEvents, createAdminEvent, updateAdminEvent, bulkEventAction, triggerMatching, uploadImage } from "@/lib/admin-api";
import { useRouter } from "next/navigation";
import { Search, Plus, Edit, Trash2, Zap, Filter, ChevronDown, Download, CalendarPlus, Image as ImageIcon, X, Upload } from "lucide-react";
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

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
  completed: "bg-blue-100 text-blue-600",
};

export default function AdminEventsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showNewForm, setShowNewForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [newEvent, setNewEvent] = useState<any>({
    title: "",
    description: "",
    category: "",
    area: "",
    city: "Bangalore",
    lat: "",
    lng: "",
    scheduled_at: "",
    duration_minutes: 180,
    group_size_min: 4,
    group_size_max: 8,
    max_groups: 3,
    min_capacity: 4,
    max_capacity: 50,
    ticket_type: "free",
    ticket_price_inr: 0,
    visibility: "public",
    status: "draft",
    is_local_event: true,
    tags: [],
    women_only: false,
    phone_free_encouraged: true,
    cover_photo_url: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-events", statusFilter, categoryFilter],
    queryFn: () => fetchAdminEvents({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(categoryFilter ? { category: categoryFilter } : {}),
    }),
  });

  const createMut = useMutation({
    mutationFn: (payload: any) => {
      const body = {
        ...payload,
        lat: payload.lat ? parseFloat(payload.lat) : null,
        lng: payload.lng ? parseFloat(payload.lng) : null,
        group_size_min: +payload.group_size_min || 4,
        group_size_max: +payload.group_size_max || 8,
        max_groups: +payload.max_groups || 3,
        min_capacity: +payload.min_capacity || 4,
        max_capacity: +payload.max_capacity || 50,
        ticket_price_inr: +payload.ticket_price_inr || 0,
        duration_minutes: +payload.duration_minutes || 180,
        scheduled_at: new Date(payload.scheduled_at).toISOString(),
        tags: typeof payload.tags === "string"
          ? payload.tags.split(",").map((s: string) => s.trim()).filter(Boolean)
          : payload.tags || [],
      };
      return createAdminEvent(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      setShowNewForm(false);
      toast.success("Event created");
      setNewEvent({ title: "", description: "", category: "", area: "", city: "Bangalore", lat: "", lng: "", scheduled_at: "", duration_minutes: 180, group_size_min: 4, group_size_max: 8, max_groups: 3, min_capacity: 4, max_capacity: 50, ticket_type: "free", ticket_price_inr: 0, visibility: "public", status: "draft", is_local_event: true, tags: [], women_only: false, phone_free_encouraged: true, cover_photo_url: "" });
    },
    onError: (e: any) => toast.error(e.message || "Failed to create event"),
  });

  const matchMut = useMutation({
    mutationFn: triggerMatching,
    onSuccess: (d: any) => toast.success(d.matched ? `Created ${d.groups_created} groups` : d.reason),
  });

  const bulkMut = useMutation({
    mutationFn: ({ ids, action }: any) => bulkEventAction(ids, action),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); setSelected(new Set()); toast.success("Action applied"); },
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === (data?.items?.length || 0)) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data?.items?.map((e: any) => e.id) || []));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(file);
      const imageUrl = `http://localhost:8000${result.url}`;
      setNewEvent({ ...newEvent, cover_photo_url: imageUrl });
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(false);
  };

  const updateNew = (key: string, value: any) => {
    setNewEvent({ ...newEvent, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create, edit, and manage local events</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wander-teal text-white font-medium text-sm hover:bg-teal-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>

      {/* New Event Form */}
      {showNewForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Create New Event</h3>
            <button onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Cover Image</label>
            {newEvent.cover_photo_url ? (
              <div className="relative inline-block">
                <img src={newEvent.cover_photo_url} alt="Cover" className="w-48 h-28 object-cover rounded-lg border" />
                <button onClick={() => updateNew("cover_photo_url", "")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-wander-teal hover:text-wander-teal transition-colors"
              >
                {uploading ? <Upload className="w-4 h-4 animate-bounce" /> : <ImageIcon className="w-4 h-4" />}
                {uploading ? "Uploading..." : "Upload Cover Image"}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <F label="Event Title *" value={newEvent.title} onChange={v => updateNew("title", v)} required />
            <select className="input-admin" value={newEvent.category} onChange={e => updateNew("category", e.target.value)}>
              <option value="">Category *</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <F label="Area / Neighborhood" value={newEvent.area} onChange={v => updateNew("area", v)} />
            <F label="City" value={newEvent.city} onChange={v => updateNew("city", v)} />
            <F label="Latitude" value={newEvent.lat} onChange={v => updateNew("lat", v)} placeholder="e.g. 13.2453" />
            <F label="Longitude" value={newEvent.lng} onChange={v => updateNew("lng", v)} placeholder="e.g. 77.7104" />
            <div>
              <label className="text-xs text-gray-500 mb-1 block font-medium">Scheduled At *</label>
              <input type="datetime-local" className="input-admin" value={newEvent.scheduled_at} onChange={e => updateNew("scheduled_at", e.target.value)} />
            </div>
            <F label="Duration (min)" value={newEvent.duration_minutes} onChange={v => updateNew("duration_minutes", v)} type="number" />
            <F label="Group Min Size" value={newEvent.group_size_min} onChange={v => updateNew("group_size_min", v)} type="number" />
            <F label="Group Max Size" value={newEvent.group_size_max} onChange={v => updateNew("group_size_max", v)} type="number" />
            <F label="Max Groups" value={newEvent.max_groups} onChange={v => updateNew("max_groups", v)} type="number" />
            <F label="Min Capacity" value={newEvent.min_capacity} onChange={v => updateNew("min_capacity", v)} type="number" />
            <F label="Max Capacity" value={newEvent.max_capacity} onChange={v => updateNew("max_capacity", v)} type="number" />
            <select className="input-admin" value={newEvent.ticket_type} onChange={e => updateNew("ticket_type", e.target.value)}>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
              <option value="donation">Donation</option>
            </select>
            {newEvent.ticket_type === "paid" && <F label="Price (INR)" value={newEvent.ticket_price_inr} onChange={v => updateNew("ticket_price_inr", v)} type="number" />}
            <select className="input-admin" value={newEvent.visibility} onChange={e => updateNew("visibility", e.target.value)}>
              <option value="public">Public</option>
              <option value="invite-only">Invite Only</option>
            </select>
            <select className="input-admin" value={newEvent.status} onChange={e => updateNew("status", e.target.value)}>
              <option value="draft">Draft</option>
              <option value="open">Published</option>
            </select>
          </div>

          <F label="Description" value={newEvent.description} onChange={v => updateNew("description", v)} type="textarea" />
          <F label="Tags (comma-separated)" value={typeof newEvent.tags === "string" ? newEvent.tags : (newEvent.tags || []).join(", ")} onChange={v => updateNew("tags", v)} placeholder="e.g. hiking, nature, beginner-friendly" />

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newEvent.phone_free_encouraged} onChange={e => updateNew("phone_free_encouraged", e.target.checked)} />
              Phone-free encouraged
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newEvent.women_only} onChange={e => updateNew("women_only", e.target.checked)} />
              Women Only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newEvent.is_local_event} onChange={e => updateNew("is_local_event", e.target.checked)} />
              Local Event
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t">
            <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button
              onClick={() => {
                if (!newEvent.title || !newEvent.scheduled_at) return toast.error("Title and scheduled date required");
                createMut.mutate(newEvent);
              }}
              className="px-6 py-2 text-sm bg-wander-teal text-white rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50"
              disabled={createMut.isPending}
            >
              {createMut.isPending ? "Creating..." : "Create Event"}
            </button>
          </div>
        </div>
      )}

      {/* Filters & Bulk Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select className="text-sm bg-transparent outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="open">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <select className="text-sm bg-white border rounded-lg px-3 py-2 outline-none" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        {selected.size > 0 && (
          <div className="flex gap-2 ml-auto">
            <button onClick={() => bulkMut.mutate({ ids: [...selected], action: "publish" })} className="px-3 py-1.5 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200">Publish ({selected.size})</button>
            <button onClick={() => bulkMut.mutate({ ids: [...selected], action: "cancel" })} className="px-3 py-1.5 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200">Cancel</button>
            <button onClick={() => bulkMut.mutate({ ids: [...selected], action: "delete" })} className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Delete</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-10 p-3">
                  <input type="checkbox" checked={selected.size === data?.items?.length && data?.items?.length > 0} onChange={toggleAll} />
                </th>
                <th className="text-left p-3 font-medium text-gray-600">Event</th>
                <th className="text-left p-3 font-medium text-gray-600">Date</th>
                <th className="text-left p-3 font-medium text-gray-600">Category</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                <th className="text-left p-3 font-medium text-gray-600">Reg./Cap.</th>
                <th className="text-left p-3 font-medium text-gray-600">Host</th>
                <th className="text-right p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b animate-pulse">
                    <td className="p-3"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-40" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-12" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                data?.items?.map((event: any) => (
                  <tr key={event.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(event.id)} onChange={() => toggleSelect(event.id)} />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {event.cover_photo_url && (
                          <img src={event.cover_photo_url} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-400">{event.area || event.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">
                      {new Date(event.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs capitalize">
                        {(event.category || "—").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[event.status] || ""}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">
                      {event.participant_count} / {event.max_capacity}
                    </td>
                    <td className="p-3 text-gray-600">
                      {event.host_name || "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => router.push(`/admin/events/${event.id}`)} className="p-1.5 rounded hover:bg-gray-100" title="Edit">
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                        <button onClick={() => matchMut.mutate(event.id)} className="p-1.5 rounded hover:bg-teal-50" title="Run AI Matching">
                          <Zap className="w-4 h-4 text-teal-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data?.items?.length === 0 && !isLoading && (
          <div className="p-12 text-center text-gray-400">
            <CalendarPlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No events found</p>
            <p className="text-xs mt-1">Create your first event to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

function F({ label, value, onChange, type = "text", required, placeholder }: {
  label: string; value: any; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string;
}) {
  if (type === "textarea") {
    return (
      <div>
        <label className="text-xs text-gray-500 mb-1 block font-medium">{label}</label>
        <textarea className="input-admin h-24" value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    );
  }
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block font-medium">{label}</label>
      <input type={type} className="input-admin" value={value ?? ""} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} />
    </div>
  );
}
