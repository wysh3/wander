"use client";

import Link from "next/link";
import { Calendar, MapPin, Users, ShieldOff, Navigation, Footprints, Car, Zap, Target } from "lucide-react";
import { format } from "date-fns";
import { useLocationStore } from "@/stores/location-store";
import { getActivityImage } from "@/lib/images";

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

export function ActivityCard({ 
  id, title, description, category, area, lat, lng,
  scheduled_at, group_size_min, group_size_max,
  participant_count, phone_free_encouraged,
  distance_km, distanceBand, isNearest,
}: ActivityCardProps) {
  
  const bgImage = getActivityImage(title, category);
  const formattedCategory = category ? category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "";




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

  const { lat: userLat, lng: userLng } = useLocationStore();
  const band = distanceBand || "far";
  const style = DISTANCE_STYLES[band] || DISTANCE_STYLES.far;

  return (
    <Link href={`/activities/${id}`}>
      <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full group">

        {/* Image/Banner Section */}
        <div 
          className="h-[180px] w-full relative flex flex-col justify-end bg-gray-100 bg-cover bg-center overflow-hidden"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
            style={{ backgroundImage: `url('${bgImage}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Top Left Badge */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-full px-3 py-1 shadow-sm">
            <span className="text-[11px] font-bold text-[#1e3a5f] tracking-wide">{formattedCategory}</span>
          </div>

          {/* Distance badge (top-right) */}
          {distance_km != null && (
            <div className={`absolute top-4 right-4 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold shadow-sm ${style.labelColor}`}>
              {style.icon}
              {formatDistance(distance_km)}
            </div>
          )}

          {/* Nearest badge */}
          {isNearest && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-green-600 text-white text-[10px] font-bold shadow-md">
              <Target className="h-3 w-3" />
              Nearest
            </div>
          )}

          {/* Bottom Left Badge */}
          {phone_free_encouraged && (
            <div className="absolute bottom-4 left-4 bg-[#34c759] rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-md shadow-black/20">
              <ShieldOff className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white tracking-wide">Phone-Free Zone</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-[#1e3a5f] text-[17px] leading-snug mb-4 line-clamp-2">{title}</h3>

          <div className="mt-auto space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-[15px] w-[15px] text-[#2cb1bc]" />
              <span className="text-[13px] font-medium text-[#1e3a5f]/60">
                {format(new Date(scheduled_at), "E, d MMM • h:mm a")}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="h-[15px] w-[15px] text-[#2cb1bc]" />
              <span className="text-[13px] font-medium text-[#1e3a5f]/60">{area}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Users className="h-[15px] w-[15px] text-[#2cb1bc]" />
              <span className="text-[13px] font-medium text-[#1e3a5f]/60">{participant_count} going</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

