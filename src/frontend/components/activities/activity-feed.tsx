"use client";

import { ActivityCard } from "./activity-card";
import { apiFetch } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

interface ActivityFeedProps {
  category?: string | null;
}

export function ActivityFeed({ category }: ActivityFeedProps) {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["activities", category],
    queryFn: () =>
      apiFetch<{ items: any[]; next_cursor: string | null }>(
        `/activities?limit=10${category ? `&category=${category}` : ""}`
      ),
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data?.items?.map((activity: any) => (
        <ActivityCard key={activity.id} {...activity} />
      ))}
      {(!data?.items || data.items.length === 0) && (
        <p className="col-span-full text-center text-muted-foreground py-12">
          No activities found. Check back soon!
        </p>
      )}
    </div>
  );
}
