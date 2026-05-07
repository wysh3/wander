"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users, Navigation, Footprints, Car, Target, Zap } from "lucide-react";
import { format } from "date-fns";
import { useLocationStore } from "@/stores/location-store";
import { haversineKm, formatDistance } from "@/lib/geo-utils";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lat: userLat, lng: userLng } = useLocationStore();

  const { data: activity, isLoading } = useQuery<any>({
    queryKey: ["activities", "detail", id],
    queryFn: () => apiFetch(`/activities/${id}`),
  });

  if (isLoading) return <div className="h-80 bg-muted animate-pulse rounded-xl" />;
  if (!activity) return <p>Activity not found</p>;

  const hasLocation = userLat != null && userLng != null;
  const activityHasCoords = activity.lat != null && activity.lng != null;

  // Compute distance
  let distanceKm: number | null = null;
  let band: string = "unknown";
  if (hasLocation && activityHasCoords) {
    distanceKm = haversineKm(userLat!, userLng!, activity.lat, activity.lng);
    if (distanceKm <= 2) band = "walking";
    else if (distanceKm <= 10) band = "nearby";
    else if (distanceKm <= 20) band = "within_radius";
    else if (distanceKm <= 30) band = "reachable";
    else band = "far";
  }

  const bandConfig: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    walking: {
      label: "Walking Distance",
      color: "border-green-500 bg-green-50 text-green-800",
      icon: <Footprints className="h-4 w-4" />,
      description: "Less than 2 km away — you can walk there!",
    },
    nearby: {
      label: "Nearby",
      color: "border-teal-500 bg-teal-50 text-teal-800",
      icon: <Car className="h-4 w-4" />,
      description: "2–10 km away — a short drive or cycle",
    },
    within_radius: {
      label: "Within Your Radius",
      color: "border-wander-teal bg-wander-teal/5 text-wander-teal",
      icon: <Navigation className="h-4 w-4" />,
      description: "10–20 km away — well within matching range",
    },
    reachable: {
      label: "Reachable",
      color: "border-amber-400 bg-amber-50 text-amber-700",
      icon: <Car className="h-4 w-4" />,
      description: "20–30 km away — doable with a commute",
    },
    far: {
      label: "Further Away",
      color: "border-gray-400 bg-gray-50 text-gray-600",
      icon: <Zap className="h-4 w-4" />,
      description: "30+ km away — consider adjusting your radius",
    },
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="h-48 bg-gradient-to-br from-wander-teal/20 to-wander-coral/20 rounded-xl flex items-center justify-center relative">
        <span className="text-5xl">🌄</span>
        {/* Distance badge */}
        {distanceKm != null && (
          <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg border ${bandConfig[band]?.color || ""}`}>
            {bandConfig[band]?.icon}
            {formatDistance(distanceKm)}
          </div>
        )}
        {/* Nearest badge */}
        {distanceKm != null && distanceKm <= 2 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-600 text-white text-xs font-bold shadow-md">
            <Target className="h-3 w-3" />
            Closest
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <Badge variant="outline" className="mb-2">{activity.category?.replace("_", " ")}</Badge>
        <h1 className="text-2xl font-bold">{activity.title}</h1>
        <p className="text-muted-foreground mt-1">{activity.description}</p>
      </div>

      {/* Distance band bar */}
      {distanceKm != null && (
        <div className={`rounded-xl p-3 flex items-center gap-3 border ${bandConfig[band]?.color || ""}`}>
          {bandConfig[band]?.icon}
          <div>
            <p className="text-sm font-semibold">{bandConfig[band]?.label}</p>
            <p className="text-xs opacity-75">{bandConfig[band]?.description}</p>
          </div>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{activity.scheduled_at ? format(new Date(activity.scheduled_at), "MMM d, h:mm a") : "TBD"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{activity.duration_minutes} min</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{activity.area}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{activity.group_size_min}–{activity.group_size_max} people</span>
        </div>
      </div>

      {/* Location warning */}
      {!hasLocation && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
          Enable location to see how far this activity is from you. We only group you with nearby people.
        </div>
      )}

      {/* Matching CTA */}
      <Button
        className="w-full"
        size="lg"
        onClick={() => router.push(`/activities/${id}/matching`)}
      >
        I'm In — Find My Group
      </Button>
    </div>
  );
}
