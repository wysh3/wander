"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Navigation, Footprints, Car, Zap, Target } from "lucide-react";
import { format } from "date-fns";
import { useLocationStore } from "@/stores/location-store";

interface ActivityCardProps {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  area: string | null;
  lat?: number | null;
  lng?: number | null;
  scheduled_at: string;
  group_size_min: number;
  group_size_max: number;
  participant_count: number;
  phone_free_encouraged: boolean;
  distance_km?: number | null;
  distanceBand?: string | null;
  isNearest?: boolean;
}

const categoryColors: Record<string, string> = {
  physical: "bg-orange-100 text-orange-800",
  social_good: "bg-green-100 text-green-800",
  skill: "bg-blue-100 text-blue-800",
  mental: "bg-purple-100 text-purple-800",
  chaotic: "bg-pink-100 text-pink-800",
  explore: "bg-teal-100 text-teal-800",
  slow: "bg-amber-100 text-amber-800",
};

/** Border + tint keyed by distance band */
const DISTANCE_STYLES: Record<string, { border: string; tint: string; label: string; labelColor: string; icon: React.ReactNode }> = {
  walking: {
    border: "border-l-green-500",
    tint: "bg-gradient-to-r from-green-50/40 to-transparent",
    label: "Walking distance",
    labelColor: "text-green-700 bg-green-100",
    icon: <Footprints className="h-3 w-3" />,
  },
  nearby: {
    border: "border-l-teal-500",
    tint: "bg-gradient-to-r from-teal-50/30 to-transparent",
    label: "Short drive",
    labelColor: "text-teal-700 bg-teal-100",
    icon: <Car className="h-3 w-3" />,
  },
  within_radius: {
    border: "border-l-wander-teal",
    tint: "bg-gradient-to-r from-wander-teal/5 to-transparent",
    label: "Within radius",
    labelColor: "text-wander-teal bg-wander-teal/10",
    icon: <Navigation className="h-3 w-3" />,
  },
  reachable: {
    border: "border-l-amber-400",
    tint: "bg-gradient-to-r from-amber-50/20 to-transparent",
    label: "Reachable",
    labelColor: "text-amber-700 bg-amber-100",
    icon: <Car className="h-3 w-3" />,
  },
  far: {
    border: "border-l-gray-400",
    tint: "bg-gradient-to-r from-gray-50/10 to-transparent",
    label: "Further away",
    labelColor: "text-gray-500 bg-gray-100",
    icon: <Zap className="h-3 w-3" />,
  },
};

function formatDistance(km: number | null | undefined): string {
  if (km == null) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function ActivityCard({
  id, title, description, category, area, lat, lng,
  scheduled_at, group_size_min, group_size_max,
  participant_count, phone_free_encouraged,
  distance_km, distanceBand, isNearest,
}: ActivityCardProps) {
  const { lat: userLat, lng: userLng } = useLocationStore();
  const band = distanceBand || "far";
  const style = DISTANCE_STYLES[band] || DISTANCE_STYLES.far;

  return (
    <Link href={`/activities/${id}`}>
      <Card className={`relative overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 ${style.border} group`}>
        {/* Distance tint overlay */}
        <div className={`absolute inset-0 ${style.tint} pointer-events-none`} />

        {/* Hero image area */}
        <div className="h-36 bg-gradient-to-br from-wander-teal/15 to-wander-coral/15 flex items-center justify-center relative">
          {/* Nearest badge */}
          {isNearest && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-green-600 text-white text-[10px] font-bold shadow-md">
              <Target className="h-3 w-3" />
              Nearest
            </div>
          )}
          {/* Distance badge (top-right) */}
          {distance_km != null && (
            <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold shadow-sm ${style.labelColor}`}>
              {style.icon}
              {formatDistance(distance_km)}
            </div>
          )}
          <span className="text-4xl opacity-80">
            {category === "physical" ? "🏃" : category === "explore" ? "🌄" : category === "social_good" ? "💚" : "✨"}
          </span>
        </div>

        <CardContent className="p-4 space-y-2 relative">
          {/* Category + phone-free badge */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge variant="outline" className={`${categoryColors[category || ""] || ""} text-[10px]`}>
              {category?.replace("_", " ")}
            </Badge>
            {phone_free_encouraged && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-[10px]">
                Phone-Free
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-wander-teal transition-colors">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Calendar className="h-3 w-3" />
              {format(new Date(scheduled_at), "MMM d, h:mm a")}
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <MapPin className="h-3 w-3" />
              {area}
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Users className="h-3 w-3" />
              {group_size_min}–{group_size_max}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
