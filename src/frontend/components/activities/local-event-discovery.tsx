"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import {
  Sparkles, MapPin, Clock, Tag, Check, Search,
  Globe, Brain, Wand2, Eye, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TOP_AREAS = [
  "Indiranagar", "Koramangala", "MG Road", "Whitefield", "JP Nagar",
  "HSR Layout", "Jayanagar", "Malleshwaram", "Yelahanka", "Electronic City",
];

const CATEGORY_COLORS: Record<string, string> = {
  physical: "bg-orange-100 text-orange-700",
  mental: "bg-purple-100 text-purple-700",
  skill: "bg-blue-100 text-blue-700",
  explore: "bg-green-100 text-green-700",
  chaotic: "bg-pink-100 text-pink-700",
  social_good: "bg-red-100 text-red-700",
  slow: "bg-teal-100 text-teal-700",
};

export function LocalEventDiscovery() {
  const qc = useQueryClient();
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(
    new Set(["Indiranagar", "Koramangala"])
  );
  const [generatedEvents, setGeneratedEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [published, setPublished] = useState<Record<number, string>>({});

  const hasSearched = stats !== null;
  const hasResults = generatedEvents.length > 0;

  const generateMut = useMutation({
    mutationFn: () =>
      apiFetch<any>("/host/generate-local-events", {
        method: "POST",
        body: JSON.stringify({ areas: [...selectedAreas], limit_per_area: 3 }),
      }),
    onSuccess: (data: any) => {
      setGeneratedEvents(data.events || []);
      setStats(data.stats || {});
      setPublished({});
      if (!data.events?.length) {
        toast("No events found in those areas. Try expanding your search.", {
          description: `${data.stats?.sources_found || 0} sources were scanned.`,
        });
      } else {
        toast.success(`Found ${data.events.length} real events`);
      }
    },
    onError: (e: any) => toast.error(e.message || "Search failed. Please try again."),
  });

  const publishMut = useMutation({
    mutationFn: async (idx: number) => {
      const ev = generatedEvents[idx];
      return apiFetch<any>("/host/events", {
        method: "POST",
        body: JSON.stringify({
          title: ev.title,
          description: ev.description || "",
          category: ev.category || null,
          area: ev.area || null,
          city: ev.city || "Bangalore",
          lat: ev.lat ?? null,
          lng: ev.lng ?? null,
          scheduled_at: ev.scheduled_at,
          duration_minutes: +ev.duration_minutes || 120,
          group_size_min: +ev.group_size_min || 4,
          group_size_max: +ev.group_size_max || 8,
          max_groups: +ev.max_groups || 3,
          min_capacity: +ev.min_capacity || 4,
          max_capacity: +ev.max_capacity || 50,
          ticket_type: ev.ticket_type || "free",
          ticket_price_inr: +ev.ticket_price_inr || 0,
          visibility: ev.visibility || "public",
          status: "open",
          tags: typeof ev.tags === "string"
            ? ev.tags.split(",").map((s: string) => s.trim()).filter(Boolean)
            : ev.tags || [],
          women_only: ev.women_only || false,
          phone_free_encouraged: ev.phone_free_encouraged !== false,
          is_local_event: true,
        }),
      });
    },
    onSuccess: (_data: any, idx: number) => {
      setPublished({ ...published, [idx]: "published" });
      qc.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Event published to Discover");
    },
    onError: (e: any) => toast.error(e.message || "Failed to publish event"),
  });

  const toggleArea = (area: string) => {
    const next = new Set(selectedAreas);
    next.has(area) ? next.delete(area) : next.add(area);
    setSelectedAreas(next);
  };

  return (
    <div className="space-y-3">
      {/* ── Section Header ── */}
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-wander-teal" />
        <h2 className="text-lg font-semibold">Local Events</h2>
        <span className="text-xs font-medium text-muted-foreground">AI‑powered discovery</span>
      </div>

      {/* ── Area Selector ── */}
      <div className="bg-card border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Search areas</p>
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedAreas(new Set(TOP_AREAS))}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              Select all
            </button>
            <button
              onClick={() => setSelectedAreas(new Set())}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {TOP_AREAS.map((area) => {
            const active = selectedAreas.has(area);
            return (
              <button
                key={area}
                onClick={() => toggleArea(area)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[12px] font-semibold border-2 transition-all",
                  active
                    ? "border-wander-teal bg-wander-teal/10 text-wander-teal"
                    : "border-muted text-muted-foreground hover:border-wander-teal/30 hover:text-foreground"
                )}
              >
                {area}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => generateMut.mutate()}
            disabled={selectedAreas.size === 0 || generateMut.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-wander-teal text-white font-semibold text-[13px] hover:bg-wander-teal/90 transition-colors disabled:opacity-40"
          >
            {generateMut.isPending ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" /> Search {selectedAreas.size} {selectedAreas.size === 1 ? "area" : "areas"}
              </>
            )}
          </button>

          {hasSearched && !generateMut.isPending && (
            <button
              onClick={() => { setGeneratedEvents([]); setStats(null); }}
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              Reset
            </button>
          )}
        </div>

        {/* Stats after search */}
        {stats && !generateMut.isPending && (
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-medium pt-1 border-t">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {stats.searched_areas} areas
            </span>
            <span className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {stats.sources_found} sources
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {stats.events_parsed} found
            </span>
          </div>
        )}
      </div>

      {/* ── Pipeline Loading ── */}
      {generateMut.isPending && <LoadingPipeline areas={[...selectedAreas]} />}

      {/* ── Results Grid ── */}
      {hasResults && !generateMut.isPending && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {generatedEvents.length} event{generatedEvents.length !== 1 ? "s" : ""} found
            </p>
            <button
              onClick={() => generateMut.mutate()}
              disabled={generateMut.isPending}
              className="text-[12px] font-semibold text-wander-teal hover:text-wander-teal/80 transition-colors"
            >
              Search again
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedEvents.map((ev, idx) => {
              const isPublished = !!published[idx];
              const confidence = ev.confidence ?? 0;

              return (
                <div
                  key={idx}
                  className={cn(
                    "bg-card border rounded-xl overflow-hidden transition-all",
                    isPublished
                      ? "border-green-200 bg-green-50/20"
                      : "border-muted hover:border-wander-teal/20 hover:shadow-sm"
                  )}
                >
                  {/* Confidence & AI indicator */}
                  <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-wander-teal" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">AI‑found</span>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                        confidence > 0.7
                          ? "bg-green-100 text-green-700"
                          : confidence > 0.4
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      )}
                    >
                      {Math.round(confidence * 100)}% match
                    </span>
                  </div>

                  {/* Body */}
                  <div className="px-4 pb-3 space-y-2">
                    <h4 className="font-semibold text-[14px] text-foreground leading-snug line-clamp-2">
                      {ev.title}
                    </h4>

                    {ev.description && (
                      <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {ev.description}
                      </p>
                    )}

                    {/* Meta chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {ev.category && (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium",
                          CATEGORY_COLORS[ev.category] || "bg-muted text-muted-foreground"
                        )}>
                          {ev.category.replace(/_/g, " ")}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
                        <MapPin className="w-2.5 h-2.5" />
                        {ev.area || "Bangalore"}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(ev.scheduled_at).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="border-t">
                    {!isPublished ? (
                      <button
                        onClick={() => publishMut.mutate(idx)}
                        disabled={publishMut.isPending}
                        className="w-full flex items-center justify-center gap-2 py-3 text-[13px] font-semibold text-wander-teal hover:bg-wander-teal/5 transition-colors disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Post Event
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 py-3 text-[13px] font-semibold text-green-600 bg-green-50/50">
                        <Check className="w-3.5 h-3.5" />
                        Published
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state if search returned nothing */}
          {hasSearched && !hasResults && !generateMut.isPending && (
            <div className="bg-card border border-muted rounded-xl p-8 text-center">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">No events found</p>
              <p className="text-[12px] text-muted-foreground mt-1 max-w-xs mx-auto">
                Try selecting different areas or removing filters. The web may not have upcoming events listed for those neighborhoods yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Loading Pipeline Animation ──

const PIPELINE_STEPS = [
  { icon: Globe,  label: "Connecting to web search" },
  { icon: Search, label: "Searching listings & venues" },
  { icon: Eye,    label: "Scanning event pages" },
  { icon: Brain,  label: "AI extracting details" },
  { icon: Wand2,  label: "Structuring results" },
];

const PULSE_MESSAGES = [
  "checking BookMyShow...",
  "scanning Insider.in...",
  "searching TimeOut...",
  "browsing Meetup...",
  "finding hidden gems...",
  "scanning event calendars...",
  "looking at venue pages...",
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

  const areaList = areas.slice(0, 3).join(", ");

  return (
    <div className="bg-card border border-wander-teal/10 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-wander-teal flex items-center justify-center shadow-md shadow-wander-teal/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-wander-teal/40 animate-ping" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-foreground">Discovering local events</p>
          <p className="text-[11px] font-medium text-muted-foreground">
            {areaList}{".".repeat(dots)}
          </p>
        </div>
        <div className="ml-auto text-[11px] font-medium text-muted-foreground">
          {Math.round((activeStep / (PIPELINE_STEPS.length - 1)) * 100)}%
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-0">
        {PIPELINE_STEPS.map((step, i) => {
          const isActive = i <= activeStep;
          const isCurrent = i === activeStep;
          return (
            <div
              key={step.label}
              className={cn(
                "flex items-center gap-3 py-1.5 transition-all duration-500",
                isActive ? "opacity-100" : "opacity-25"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300",
                  isActive &&
                    (isCurrent
                      ? "bg-wander-teal text-white shadow-sm shadow-wander-teal/30 scale-110"
                      : "bg-wander-teal/10 text-wander-teal")
                    ? ""
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isActive ? (
                  isCurrent ? (
                    <step.icon className="w-3.5 h-3.5 animate-pulse" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground/20" />
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] transition-colors duration-300",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {step.label}
                {isCurrent && (
                  <span className="ml-2 text-[10px] text-wander-teal animate-pulse font-normal">
                    {PULSE_MESSAGES[pulseMsg]}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-wander-teal rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${((activeStep + 1) / PIPELINE_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
