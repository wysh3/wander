"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Calendar, MapPin, Clock, Users, Navigation, Footprints, Car, Target, Zap, ArrowLeft, Share, Heart, ShieldCheck, ShieldOff } from "lucide-react";
import { format } from "date-fns";
import { useLocationStore } from "@/stores/location-store";
import { haversineKm, formatDistance } from "@/lib/geo-utils";
import { getActivityImage } from "@/lib/images";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lat: userLat, lng: userLng } = useLocationStore();

  const { data: activity, isLoading } = useQuery<any>({
    queryKey: ["activities", "detail", id],
    queryFn: () => apiFetch(`/activities/${id}`),
  });

  if (isLoading) return <div className="h-80 bg-gray-100 animate-pulse rounded-[32px] mt-4" />;
  if (!activity) return <div className="p-8 text-center text-gray-500">Activity not found</div>;

  const bgImage = getActivityImage(activity.title, activity.category);
  const formattedCategory = activity.category ? activity.category.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "";


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
    <div className="flex flex-col h-full bg-white max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pt-2">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#2cb1bc] font-semibold text-sm hover:opacity-80">
          <ArrowLeft className="w-4 h-4" />
          Back to Discover
        </button>
        <div className="flex items-center gap-4 text-[#1e3a5f]/40">
          <Share className="w-5 h-5 cursor-pointer hover:text-[#1e3a5f]" />
          <Heart className="w-5 h-5 cursor-pointer hover:text-red-500" />
        </div>
      </div>

      {/* Hero Banner */}
      <div 
        className="h-[280px] w-full rounded-[32px] overflow-hidden relative shadow-sm mb-6 bg-cover bg-center"
        style={{ backgroundImage: `url('${bgImage}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          <div className="bg-white/95 backdrop-blur-md rounded-full px-4 py-1.5 shadow-sm">
            <span className="text-xs font-bold text-[#1e3a5f] tracking-wide">{formattedCategory}</span>
          </div>
          {activity.phone_free_encouraged && (
            <div className="bg-[#34c759] rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-md shadow-black/20">
              <ShieldOff className="w-3.5 h-3.5 text-white" />
              <span className="text-[11px] font-bold text-white tracking-wide">Phone-Free Zone</span>
            </div>
          )}
        </div>

        {/* Distance badges */}
        {distanceKm != null && (
          <div className={`absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg border bg-white ${bandConfig[band]?.color || ""}`}>
            {bandConfig[band]?.icon}
            {formatDistance(distanceKm)}
          </div>
        )}
        {distanceKm != null && distanceKm <= 2 && (
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-600 text-white text-xs font-bold shadow-md">
            <Target className="h-3 w-3" />
            Closest
          </div>
        )}
      </div>

      {/* Distance band bar */}
      {distanceKm != null && (
        <div className={`rounded-xl p-3 mb-6 flex items-center gap-3 border ${bandConfig[band]?.color || ""}`}>
          {bandConfig[band]?.icon}
          <div>
            <p className="text-sm font-semibold">{bandConfig[band]?.label}</p>
            <p className="text-xs opacity-75">{bandConfig[band]?.description}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-1 mb-8">
        <h1 className="text-[28px] font-bold text-[#1e3a5f] leading-tight mb-3">{activity.title}</h1>
        <p className="text-[#1e3a5f]/70 text-[15px] leading-relaxed mb-8">
          {activity.description || "Let's catch the first light together. A refreshing morning hike with breathtaking views, good company, and zero phone distractions. Start your day with nature and real conversations."}
        </p>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {/* Date & Time */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 bg-white shadow-sm transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#eaf4f4] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-[#2cb1bc]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#1e3a5f]/50 uppercase tracking-wide mb-0.5">Date & Time</p>
              <p className="text-[13px] font-semibold text-[#1e3a5f] leading-snug">
                {activity.scheduled_at ? format(new Date(activity.scheduled_at), "E, d MMM yyyy\nh:mm a") : "TBD"}
              </p>
            </div>
          </div>
          
          {/* Duration */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 bg-white shadow-sm transition-colors">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#1e3a5f]/50 uppercase tracking-wide mb-0.5">Duration</p>
              <p className="text-[13px] font-semibold text-[#1e3a5f] leading-snug">
                {activity.duration_minutes ? `${activity.duration_minutes / 60} Hours` : "2.5 - 3 Hours"}
                <br/><span className="text-[#1e3a5f]/50 font-normal">(Approx.)</span>
              </p>
            </div>
          </div>

          {/* Area */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 bg-white shadow-sm transition-colors">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#1e3a5f]/50 uppercase tracking-wide mb-0.5">Area</p>
              <p className="text-[13px] font-semibold text-[#1e3a5f] leading-snug">
                {activity.area || "Bengaluru"}
                <br/><span className="text-[#1e3a5f]/50 font-normal">Bengaluru</span>
              </p>
            </div>
          </div>

          {/* Group Size */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 bg-white shadow-sm transition-colors">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#1e3a5f]/50 uppercase tracking-wide mb-0.5">Group Size</p>
              <p className="text-[13px] font-semibold text-[#1e3a5f] leading-snug">
                {activity.group_size_min}-{activity.group_size_max} People
                <br/><span className="text-[#1e3a5f]/50 font-normal">(Approx.)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Location warning */}
        {!hasLocation && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-700">
            Enable location to see how far this activity is from you. We only group you with nearby people.
          </div>
        )}

        {/* Action Button */}
        <button
          className="w-full bg-[#2cb1bc] hover:bg-[#209ba5] text-white rounded-2xl py-4 font-bold text-[15px] flex justify-center items-center gap-3 transition-colors shadow-md shadow-[#2cb1bc]/20"
          onClick={() => router.push(`/activities/${id}/matching`)}
        >
          <Users className="w-5 h-5" />
          I'm In — Find My Group
        </button>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[#1e3a5f]/50 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#2cb1bc]" />
          <span>Safe. Verified. Phone-Free.</span>
        </div>
      </div>
    </div>
  );
}

