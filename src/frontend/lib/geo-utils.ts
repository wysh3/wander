/**
 * Shared geo utility functions for distance calculation and formatting.
 */

/**
 * Haversine formula to calculate distance in km between two lat/lng points.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format a distance in km into a human-readable string.
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/**
 * Get distance band key based on km distance.
 */
export type DistanceBand = "walking" | "nearby" | "within_radius" | "reachable" | "far";

export function getDistanceBand(km: number | null | undefined): DistanceBand | null {
  if (km == null) return null;
  if (km <= 2) return "walking";
  if (km <= 10) return "nearby";
  if (km <= 20) return "within_radius";
  if (km <= 30) return "reachable";
  return "far";
}

/**
 * Configuration for each distance band (colors, icons, labels).
 */
export const DISTANCE_BANDS: Record<DistanceBand, {
  label: string;
  maxKm: number;
  borderColor: string;
  bgColor: string;
  textColor: string;
  icon: string;
  description: string;
}> = {
  walking: {
    label: "Walking Distance",
    maxKm: 2,
    borderColor: "border-l-green-500",
    bgColor: "bg-green-50/40",
    textColor: "text-green-700",
    icon: "footprints",
    description: "Less than 2 km",
  },
  nearby: {
    label: "Nearby",
    maxKm: 10,
    borderColor: "border-l-teal-500",
    bgColor: "bg-teal-50/30",
    textColor: "text-teal-700",
    icon: "car",
    description: "2–10 km",
  },
  within_radius: {
    label: "Within Your Radius",
    maxKm: 20,
    borderColor: "border-l-wander-teal",
    bgColor: "bg-wander-teal/5",
    textColor: "text-wander-teal",
    icon: "navigation",
    description: "10–20 km",
  },
  reachable: {
    label: "Reachable",
    maxKm: 30,
    borderColor: "border-l-amber-400",
    bgColor: "bg-amber-50/20",
    textColor: "text-amber-700",
    icon: "car",
    description: "20–30 km",
  },
  far: {
    label: "Further Away",
    maxKm: Infinity,
    borderColor: "border-l-gray-400",
    bgColor: "bg-gray-50/10",
    textColor: "text-gray-500",
    icon: "zap",
    description: "30+ km",
  },
};
