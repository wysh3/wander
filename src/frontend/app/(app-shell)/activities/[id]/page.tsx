"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, Users } from "lucide-react";
import { format } from "date-fns";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: activity, isLoading } = useQuery<any>({
    queryKey: ["activities", "detail", id],
    queryFn: () => apiFetch(`/activities/${id}`),
  });

  if (isLoading) return <div className="h-80 bg-muted animate-pulse rounded-xl" />;
  if (!activity) return <p>Activity not found</p>;

  return (
    <div className="space-y-6">
      <div className="h-48 bg-gradient-to-br from-wander-teal/20 to-wander-coral/20 rounded-xl flex items-center justify-center">
        <span className="text-5xl">🌄</span>
      </div>

      <div>
        <Badge variant="outline" className="mb-2">{activity.category}</Badge>
        <h1 className="text-2xl font-bold">{activity.title}</h1>
        <p className="text-muted-foreground mt-1">{activity.description}</p>
      </div>

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
          <span>{activity.group_size_min}-{activity.group_size_max} people</span>
        </div>
      </div>

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
