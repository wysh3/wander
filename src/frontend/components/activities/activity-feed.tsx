"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "@/stores/location-store";
import { apiFetch } from "@/lib/api-client";
import { ActivityCard } from "./activity-card";

interface ActivityFeedProps {
  category?: string | null;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  area: string | null;
  lat: number | null;
  lng: number | null;
  scheduled_at: string;
  group_size_min: number;
  group_size_max: number;
  participant_count: number;
  phone_free_encouraged: boolean;
  distance_km: number | null;
}

type DistanceBand = "walking" | "nearby" | "within_radius" | "reachable" | "far";

const BAND_CONFIG: Record<DistanceBand, { label: string; maxKm: number; color: string; description: string }> = {
  walking: { label: "Walking Distance", maxKm: 2, color: "border-l-green-500 bg-green-50/30", description: "Less than 2 km" },
  nearby: { label: "Nearby", maxKm: 10, color: "border-l-teal-500 bg-teal-50/30", description: "2–10 km" },
  within_radius: { label: "Within Your Radius", maxKm: 20, color: "border-l-wander-teal bg-wander-teal/5", description: "10–20 km" },
  reachable: { label: "Reachable", maxKm: 30, color: "border-l-amber-400 bg-amber-50/20", description: "20–30 km" },
  far: { label: "Further Away", maxKm: Infinity, color: "border-l-gray-400 bg-gray-50/10", description: "30+ km" },
};

function getDistanceBand(km: number | null): DistanceBand | null {
  if (km === null || km === undefined) return null;
  if (km <= 2) return "walking";
  if (km <= 10) return "nearby";
  if (km <= 20) return "within_radius";
  if (km <= 30) return "reachable";
  return "far";
}

export function ActivityFeed({ category }: ActivityFeedProps) {
  const { lat: userLat, lng: userLng, preferredRadiusKm } = useLocationStore();
  const hasLocation = userLat != null && userLng != null;

  const { data, isLoading } = useQuery<any>({
    queryKey: ["activities", category, userLat, userLng, preferredRadiusKm],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "30" });
      if (category) params.set("category", category);
      if (hasLocation) {
        params.set("lat", String(userLat));
        params.set("lng", String(userLng));
        params.set("sort_by", "distance");
        params.set("radius_km", String(preferredRadiusKm || 30));
      }
      return apiFetch<{ items: ActivityItem[]; next_cursor: string | null }>(
        `/activities?${params.toString()}`
      );
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];

  if (!items.length) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No activities found. Check back soon!
      </p>
    );
  }

  // If we have location, group by distance band
  if (hasLocation) {
    const grouped: Record<string, ActivityItem[]> = {};
    for (const item of items) {
      const band = getDistanceBand(item.distance_km) ?? "far";
      if (!grouped[band]) grouped[band] = [];
      grouped[band].push(item);
    }

    const bandOrder: DistanceBand[] = ["walking", "nearby", "within_radius", "reachable", "far"];

    return (
      <div className="space-y-8">
        {bandOrder.map((band) => {
          const bandItems = grouped[band];
          if (!bandItems || bandItems.length === 0) return null;
          const config = BAND_CONFIG[band];
          const isNearest = band === "walking" || (band === "nearby" && !grouped.walking);

          return (
            <section key={band}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-1 w-8 rounded-full ${config.color.split(" ")[0].replace("border-l-", "bg-") || "bg-gray-300"}`} />
                <h2 className="text-sm font-semibold text-foreground">
                  {config.label}
                </h2>
                <span className="text-[10px] text-muted-foreground">
                  ({bandItems.length}) · {config.description}
                </span>
                {isNearest && bandItems.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    Closest
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bandItems.map((activity, idx) => (
                  <ActivityCard
                    key={activity.id}
                    {...activity}
                    distanceBand={band}
                    isNearest={isNearest && idx === 0}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  // No location — plain grid sorted by date
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((activity: any) => (
        <ActivityCard key={activity.id} {...activity} />
      ))}
    </div>
  );
}
