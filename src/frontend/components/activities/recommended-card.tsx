"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendedActivity {
  activity: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    area: string | null;
    scheduled_at: string;
    duration_minutes: number;
  };
  score: number;
  ai_reason: string;
}

export function RecommendedCard({ item }: { item: RecommendedActivity }) {
  const router = useRouter();
  const { activity, score, ai_reason } = item;

  const scorePercent = Math.round(score * 100);
  const scoreColor =
    scorePercent >= 85
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : scorePercent >= 70
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-muted text-muted-foreground";

  const date = new Date(activity.scheduled_at);
  const dateStr = date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors flex-shrink-0 w-72"
      onClick={() => router.push(`/activities/${activity.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight">{activity.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2 text-xs">
              {activity.description}
            </CardDescription>
          </div>
          <Badge className={cn("shrink-0 text-xs font-bold", scoreColor)}>
            {scorePercent}%
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          <Badge variant="outline" className="text-[10px]">
            {activity.category}
          </Badge>
          {activity.area && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />
              {activity.area}
            </span>
          )}
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {dateStr} {timeStr}
          </span>
        </div>

        {ai_reason && (
          <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
            <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-wander-teal" />
            <span className="italic">{ai_reason}</span>
          </p>
        )}
      </CardHeader>
    </Card>
  );
}
