"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { RecommendedCard } from "./recommended-card";

interface RecommendedActivity {
  activity: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    area: string | null;
    lat: number | null;
    lng: number | null;
    scheduled_at: string;
    duration_minutes: number;
    group_size_min: number;
    group_size_max: number;
    status: string;
  };
  score: number;
  ai_reason: string;
  score_breakdown: {
    interest_match: number;
    location_score: number;
    personality_fit: number;
    social_proof: number;
  };
}

export function RecommendedCarousel() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["recommendations", "user"],
    queryFn: () => apiFetch<RecommendedActivity[]>("/activities/recommended?limit=5"),
    staleTime: 120000,
    retry: 1,
  });

  if (isError || (!isLoading && (!data || data.length === 0))) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-wander-teal" />
        <h2 className="text-lg font-semibold">Recommended For You</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Finding your best matches...
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {data!.map((item) => (
            <RecommendedCard key={item.activity.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
