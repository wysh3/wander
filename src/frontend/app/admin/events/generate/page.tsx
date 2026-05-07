"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateLocalEvents, createAdminEvent } from "@/lib/admin-api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Search, MapPin, Calendar, Clock, Tag, IndianRupee,
  Check, X, Edit, ExternalLink, Filter, Eye, ArrowRight,
  Globe, Brain, Wand2,
} from "lucide-react";
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

const TICKET_TYPES = ["free", "paid", "donation"];
const VISIBILITY = ["public", "invite-only"];
const STATUSES = ["draft", "open"];

const CATEGORY_COLORS: Record<string, string> = {
  physical: "bg-orange-100 text-orange-700",
  mental: "bg-purple-100 text-purple-700",
  skill: "bg-blue-100 text-blue-700",
  explore: "bg-green-100 text-green-700",
  chaotic: "bg-pink-100 text-pink-700",
  social_good: "bg-red-100 text-red-700",
  slow: "bg-teal-100 text-teal-700",
};

const TOP_AREAS = [
  "Indiranagar", "Koramangala", "MG Road", "Whitefield", "JP Nagar",
  "HSR Layout", "Jayanagar", "Malleshwaram", "Yelahanka", "Electronic City",
];

export default function GenerateEventsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(
    new Set(["Indiranagar", "Koramangala", "Whitefield"])
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generatedEvents, setGeneratedEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [approved, setApproved] = useState<Record<number, { id: string; status: string }>>({});
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<string, any>>({});

  const generateMut = useMutation({
    mutationFn: () =>
      generateLocalEvents({
        areas: [...selectedAreas],
        ...(dateFrom ? { date_from: new Date(dateFrom).toISOString() } : {}),
        ...(dateTo ? { date_to: new Date(dateTo).toISOString() } : {}),
        limit_per_area: 4,
      }),
    onSuccess: (data: any) => {
      setGeneratedEvents(data.events || []);
      setStats(data.stats || {});
      setApproved({});
      setExpandedIdx(null);
      if (!data.events?.length) {
        toast.info("No events found. Try different areas or broader date range.");
      } else {
        toast.success(`Found ${data.events.length} events`);
      }
    },
    onError: (e: any) => toast.error(e.message || "Generation failed"),
  });

  const approveMut = useMutation({
    mutationFn: async (idx: number) => {
      const event = edits[idx] ?? generatedEvents[idx];
      const body = {
        title: event.title,
        description: event.description || "",
        category: event.category || null,
        area: event.area || null,
        city: event.city || "Bangalore",
        lat: event.lat ?? null,
        lng: event.lng ?? null,
        scheduled_at: event.scheduled_at,
        duration_minutes: +event.duration_minutes || 120,
        group_size_min: +event.group_size_min || 4,
        group_size_max: +event.group_size_max || 8,
        max_groups: +event.max_groups || 3,
        min_capacity: +event.min_capacity || 4,
        max_capacity: +event.max_capacity || 50,
        ticket_type: event.ticket_type || "free",
        ticket_price_inr: +event.ticket_price_inr || 0,
        visibility: event.visibility || "public",
        status: event.status || "draft",
        tags: typeof event.tags === "string"
          ? event.tags.split(",").map((s: string) => s.trim()).filter(Boolean)
          : event.tags || [],
        women_only: event.women_only || false,
        phone_free_encouraged: event.phone_free_encouraged !== false,
        is_local_event: true,
      };
      return createAdminEvent(body);
    },
    onSuccess: (data: any, idx: number) => {
      setApproved({ ...approved, [idx]: { id: data.id, status: data.status } });
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success(
        <span>
          &ldquo;{generatedEvents[idx]?.title}&rdquo; created as{" "}
          <strong>{data.status}</strong>
        </span>
      );
    },
    onError: (e: any) => toast.error(e.message || "Failed to create event"),
  });

  const getEvent = (idx: number) => edits[idx] ?? generatedEvents[idx];
  const updateEdit = (idx: number, field: string, value: any) => {
    setEdits({ ...edits, [idx]: { ...getEvent(idx), [field]: value } });
  };

  const toggleArea = (area: string) => {
    const next = new Set(selectedAreas);
    next.has(area) ? next.delete(area) : next.add(area);
    setSelectedAreas(next);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Local Events</h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered event discovery — scans the web for real events in Bangalore
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/events")}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <Calendar className="w-4 h-4" /> Back to Events
        </button>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Filter className="w-5 h-5 text-wander-teal" /> Search Configuration
        </h3>

        <div>
          <label className="text-xs text-gray-500 mb-2 block font-medium">
            Areas to Search ({selectedAreas.size} selected)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            <button onClick={() => setSelectedAreas(new Set(TOP_AREAS))} className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50">Select All</button>
            <button onClick={() => setSelectedAreas(new Set())} className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50">Clear</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {TOP_AREAS.map((area) => (
              <button
                key={area}
                onClick={() => toggleArea(area)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedAreas.has(area) ? "bg-wander-teal text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block font-medium">From (optional)</label>
            <input type="date" className="input-admin" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block font-medium">To (optional)</label>
            <input type="date" className="input-admin" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        {/* Generate Button or Loading Animation */}
        {generateMut.isPending ? (
          <LoadingPipeline areas={[...selectedAreas]} />
        ) : (
          <button
            onClick={() => generateMut.mutate()}
            disabled={selectedAreas.size === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-wander-teal to-teal-500 text-white font-semibold text-sm hover:from-teal-600 hover:to-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/25"
          >
            <Sparkles className="w-5 h-5" /> Generate Events
          </button>
        )}

        {stats && !generateMut.isPending && (
          <div className="flex gap-4 text-sm text-gray-500 pt-2 border-t">
            <span><Search className="w-4 h-4 inline mr-1" />{stats.searched_areas} areas</span>
            <span><ExternalLink className="w-4 h-4 inline mr-1" />{stats.sources_found} sources</span>
            <span><Sparkles className="w-4 h-4 inline mr-1" />{stats.events_parsed} events</span>
          </div>
        )}
      </div>

      {/* Generated Events */}
      {generatedEvents.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">
            Generated Events ({generatedEvents.length})
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {generatedEvents.map((event, idx) => {
              const isApproved = !!approved[idx];
              const isExpanded = expandedIdx === idx;
              const ev = getEvent(idx);

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-xl border transition-all ${
                    isApproved ? "border-green-200 bg-green-50/50" : "border-gray-100 hover:border-gray-200 hover:shadow-md"
                  }`}
                >
                  {/* Card Body */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="font-semibold text-sm text-gray-900 leading-tight flex-1">
                        {ev.title}
                      </h4>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (ev.confidence || 0) > 0.7 ? "bg-green-100 text-green-700" : (ev.confidence || 0) > 0.4 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                      }`}>
                        {Math.round((ev.confidence || 0) * 100)}%
                      </span>
                    </div>

                    {/* Meta chips — always visible */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {ev.category && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLORS[ev.category] || "bg-gray-100 text-gray-600"}`}>
                          {ev.category.replace(/_/g, " ")}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ev.area || "Bangalore"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ev.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      {ev.ticket_price_inr > 0 && (
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" /> {ev.ticket_price_inr}
                        </span>
                      )}
                    </div>

                    {/* Collapsed: description + tags */}
                    {!isExpanded && (
                      <>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{ev.description}</p>
                        {ev.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {ev.tags.slice(0, 4).map((tag: string) => (
                              <span key={tag} className="px-1.5 py-0.5 rounded bg-gray-50 text-gray-400 text-[10px] flex items-center gap-0.5">
                                <Tag className="w-2.5 h-2.5" /> {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {ev.source_url && (
                          <a href={ev.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-wander-teal hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> View source
                          </a>
                        )}
                      </>
                    )}

                    {/* Expanded: inline edit form */}
                    {isExpanded && (
                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        <F label="Title" value={ev.title} onChange={(v) => updateEdit(idx, "title", v)} />
                        <F label="Description" type="textarea" value={ev.description || ""} onChange={(v) => updateEdit(idx, "description", v)} />
                        <div className="grid grid-cols-2 gap-2">
                          <select className="input-admin text-xs" value={ev.category || ""} onChange={(e) => updateEdit(idx, "category", e.target.value)}>
                            <option value="">Category</option>
                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                          <F label="Area" value={ev.area || ""} onChange={(v) => updateEdit(idx, "area", v)} />
                          <F label="Date/Time" value={ev.scheduled_at ? ev.scheduled_at.slice(0, 16) : ""} onChange={(v) => updateEdit(idx, "scheduled_at", v + ":00")} type="datetime-local" />
                          <F label="Duration (min)" type="number" value={ev.duration_minutes || 120} onChange={(v) => updateEdit(idx, "duration_minutes", v)} />
                          <select className="input-admin text-xs" value={ev.ticket_type || "free"} onChange={(e) => updateEdit(idx, "ticket_type", e.target.value)}>
                            {TICKET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {ev.ticket_type === "paid" && <F label="Price (INR)" type="number" value={ev.ticket_price_inr || 0} onChange={(v) => updateEdit(idx, "ticket_price_inr", v)} />}
                          <select className="input-admin text-xs" value={ev.status || "draft"} onChange={(e) => updateEdit(idx, "status", e.target.value)}>
                            {STATUSES.map(s => <option key={s} value={s}>{s === "open" ? "Published" : "Draft"}</option>)}
                          </select>
                          <select className="input-admin text-xs" value={ev.visibility || "public"} onChange={(e) => updateEdit(idx, "visibility", e.target.value)}>
                            {VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                        <F label="Tags (comma-separated)" value={Array.isArray(ev.tags) ? ev.tags.join(", ") : ev.tags || ""} onChange={(v) => updateEdit(idx, "tags", v)} />
                        <label className="flex items-center gap-2 text-xs">
                          <input type="checkbox" checked={ev.phone_free_encouraged !== false} onChange={(e) => updateEdit(idx, "phone_free_encouraged", e.target.checked)} />
                          Phone-free encouraged
                        </label>
                        {ev.source_url && (
                          <a href={ev.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-wander-teal hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> {ev.source_url.slice(0, 60)}...
                          </a>
                        )}
                        <button
                          onClick={() => setExpandedIdx(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Collapse
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                    {!isApproved ? (
                      <>
                        <button
                          onClick={() => approveMut.mutate(idx)}
                          disabled={approveMut.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors rounded-bl-xl"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setGeneratedEvents(generatedEvents.filter((_, i) => i !== idx))}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-br-xl"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-between px-4 py-2.5 bg-green-50 rounded-b-xl">
                        <span className="text-xs font-medium text-green-700 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          {approved[idx].status === "open" ? "Published" : "Draft"}
                        </span>
                        <Link
                          href={`/admin/events/${approved[idx].id}`}
                          className="text-xs text-wander-teal hover:underline flex items-center gap-1 font-medium"
                        >
                          <Eye className="w-3 h-3" /> View
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!generateMut.isPending && !generatedEvents.length && !stats && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-400 mb-1">Ready to discover events</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Select areas in Bangalore, optionally set a date range, and click Generate.
            The system will search the web for real local events and propose them as drafts.
          </p>
        </div>
      )}
    </div>
  );
}

function F({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: any; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string;
}) {
  if (type === "textarea") {
    return (
      <div>
        <label className="text-[10px] text-gray-500 mb-0.5 block font-medium">{label}</label>
        <textarea className="input-admin text-xs h-16" value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    );
  }
  return (
    <div>
      <label className="text-[10px] text-gray-500 mb-0.5 block font-medium">{label}</label>
      <input type={type} className="input-admin text-xs" value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

// ── Loading Pipeline Animation ──

const PIPELINE_STEPS = [
  { icon: Globe,      label: "Connecting to web search",  delay: 0 },
  { icon: Search,     label: "Searching for events",      delay: 2000 },
  { icon: Eye,        label: "Scanning event listings",   delay: 5000 },
  { icon: Brain,      label: "AI extracting details",     delay: 8000 },
  { icon: Wand2,      label: "Structuring results",       delay: 12000 },
];

const PULSE_MESSAGES = [
  "scanning BookMyShow...",
  "checking Insider.in...",
  "searching TimeOut Bangalore...",
  "scanning AllEvents.in...",
  "looking at Meetup.com...",
  "checking Facebook Events...",
  "scanning local listings...",
  "searching Eventbrite...",
  "looking for weekend plans...",
  "finding hidden gems...",
];

function LoadingPipeline({ areas }: { areas: string[] }) {
  const [activeStep, setActiveStep] = useState(0);
  const [pulseMsg, setPulseMsg] = useState(0);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, PIPELINE_STEPS.length - 1));
    }, 3000);
    const msgInterval = setInterval(() => {
      setPulseMsg((m) => (m + 1) % PULSE_MESSAGES.length);
    }, 1800);
    const dotsInterval = setInterval(() => {
      setDots((d) => (d + 1) % 4);
    }, 500);

    return () => {
      clearInterval(stepInterval);
      clearInterval(msgInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  const areaList = areas.slice(0, 5).join(", ");

  return (
    <div className="relative overflow-hidden rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/50 via-white to-teal-50/30 p-6">
      {/* Animated background pulse */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -inset-40 bg-gradient-to-r from-teal-400/20 via-cyan-400/10 to-teal-400/20 animate-[spin_8s_linear_infinite] blur-3xl" />
      </div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -inset-20 bg-gradient-to-b from-teal-300/30 via-transparent to-cyan-300/30 animate-pulse" />
      </div>

      <div className="relative space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-teal-300 animate-[ping_1s_ease-in-out_infinite]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-700">Discovering local events</p>
            <p className="text-[11px] text-teal-500/70">
              {areaList}
              {".".repeat(dots)}
            </p>
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="space-y-0">
          {PIPELINE_STEPS.map((step, i) => {
            const isActive = i <= activeStep;
            const isCurrent = i === activeStep;
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 py-1.5 transition-all duration-500 ${
                  isActive ? "opacity-100 translate-x-0" : "opacity-20 translate-x-2"
                }`}
              >
                <div className={`relative flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300 ${
                  isActive
                    ? isCurrent
                      ? "bg-teal-500 text-white shadow-md shadow-teal-500/30 scale-110"
                      : "bg-teal-100 text-teal-600"
                    : "bg-gray-100 text-gray-300"
                }`}>
                  <step.icon className={`w-3.5 h-3.5 ${isCurrent ? "animate-pulse" : ""}`} />
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-lg ring-2 ring-teal-400 animate-[ping_2s_ease-out_infinite]" />
                  )}
                </div>
                <span className={`text-xs transition-colors duration-300 ${
                  isActive ? "text-gray-700 font-medium" : "text-gray-300"
                }`}>
                  {step.label}
                  {isCurrent && (
                    <span className="ml-2 text-[10px] text-teal-400 animate-pulse font-normal">
                      {PULSE_MESSAGES[pulseMsg]}
                    </span>
                  )}
                </span>
                {isActive && i < PIPELINE_STEPS.length - 1 && activeStep > i && (
                  <Check className="w-3 h-3 text-teal-400 ml-auto mr-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${((activeStep + 1) / PIPELINE_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Fun footer */}
        <p className="text-[10px] text-teal-400/60 text-center animate-pulse">
          ✦ finding the best events in Bangalore ✦
        </p>
      </div>
    </div>
  );
}
