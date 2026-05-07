"use client";

import { MapPin, Users, Radio } from "lucide-react";
import { useLocationStore } from "@/stores/location-store";
import { haversineKm, formatDistance, getDistanceBand } from "@/lib/geo-utils";

const RADIUS_OPTIONS = [10, 20, 30];

export function RadiusSelector() {
  const { preferredRadiusKm, setPreferredRadius, nearbyCount, lat } =
    useLocationStore();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Radio className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

      {RADIUS_OPTIONS.map((km) => (
        <button
          key={km}
          onClick={() => setPreferredRadius(km)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
            preferredRadiusKm === km
              ? "border-wander-teal bg-wander-teal/10 text-wander-teal"
              : "border-muted hover:border-wander-teal/40 text-muted-foreground"
          }`}
        >
          {km} km
        </button>
      ))}

      <span className="flex-1" />

      {lat ? (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          {nearbyCount > 0 ? (
            <span className="font-medium text-wander-teal">
              {nearbyCount} nearby
            </span>
          ) : (
            <span>GPS active</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-500">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>Tap to enable location</span>
        </div>
      )}
    </div>
  );
}

export function NearbyCountBadge() {
  const { nearbyCount, lat } = useLocationStore();

  if (!lat || nearbyCount === 0) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-wander-teal/10 text-wander-teal text-xs font-medium">
      <Users className="h-3 w-3" />
      {nearbyCount} wanderers nearby
    </div>
  );
}

interface DistanceBadgeProps {
  userLat: number | null;
  userLng: number | null;
  activityLat: number | null;
  activityLng: number | null;
}

export function DistanceBadge({
  userLat,
  userLng,
  activityLat,
  activityLng,
}: DistanceBadgeProps) {
  if (!userLat || !userLng || !activityLat || !activityLng) return null;

  const distance = haversineKm(userLat, userLng, activityLat, activityLng);
  const band = getDistanceBand(distance);

  // Map band to color
  const colorMap: Record<string, string> = {
    walking: "text-green-600",
    nearby: "text-teal-600",
    within_radius: "text-wander-teal",
    reachable: "text-amber-600",
    far: "text-gray-400",
  };
  const color = band ? colorMap[band] || "text-muted-foreground" : "text-muted-foreground";

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
      <MapPin className="h-3 w-3" />
      {formatDistance(distance)}
    </span>
  );
}

