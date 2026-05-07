"use client";

import { MapPin, Users, Radio, Footprints, Car, Navigation, Zap } from "lucide-react";
import { useLocationStore } from "@/stores/location-store";
import { haversineKm, formatDistance, getDistanceBand } from "@/lib/geo-utils";

const RADIUS_OPTIONS = [
  { value: 10, label: "10 km", description: "Very close" },
  { value: 20, label: "20 km", description: "Nearby" },
  { value: 30, label: "30 km", description: "City-wide" },
];

export function RadiusSelector() {
  const { preferredRadiusKm, setPreferredRadius, nearbyCount, lat } =
    useLocationStore();

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-wander-teal" />
        <h3 className="text-sm font-semibold">Search Radius</h3>
      </div>

      {/* Radius Pills */}
      <div className="flex gap-2">
        {RADIUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setPreferredRadius(option.value)}
            className={`flex-1 px-3 py-2 rounded-xl border-2 text-center transition-all ${
              preferredRadiusKm === option.value
                ? "border-wander-teal bg-wander-teal/10 text-wander-teal"
                : "border-muted hover:border-wander-teal/40"
            }`}
          >
            <p className="text-sm font-semibold">{option.label}</p>
            <p className="text-[10px] text-muted-foreground">
              {option.description}
            </p>
          </button>
        ))}
      </div>

      {/* Status indicator */}
      {lat ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span>Live GPS active</span>
          {nearbyCount > 0 && (
            <span className="ml-auto font-medium text-wander-teal">
              <Users className="h-3 w-3 inline mr-1" />
              {nearbyCount} nearby
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-amber-500">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
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

