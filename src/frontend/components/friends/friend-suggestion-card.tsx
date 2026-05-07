"use client";

import { useRouter } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

interface SuggestionUser {
  id: string;
  name: string | null;
  vibe: string | null;
  interests: string[];
  home_area: string | null;
}

interface FriendSuggestion {
  user: SuggestionUser;
  compatibility: number;
  shared_interests: string[];
  distance_km: number;
  ai_reason: string | null;
}

export function FriendSuggestionCard({
  suggestion,
  onConnect,
}: {
  suggestion: FriendSuggestion;
  onConnect?: () => void;
}) {
  const router = useRouter();
  const { user, compatibility, shared_interests, distance_km, ai_reason } = suggestion;

  const compatPercent = Math.round(compatibility * 100);
  const compatColor =
    compatPercent >= 85
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : compatPercent >= 70
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-muted text-muted-foreground";

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-wander-teal/20 flex items-center justify-center text-sm font-medium shrink-0">
              {(user.name || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base flex items-center gap-2">
                {user.name || "User"}
                {user.vibe && (
                  <span className="text-xs font-normal text-muted-foreground">
                    · {user.vibe}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {user.home_area && <span>{user.home_area}</span>}
                {user.home_area && distance_km > 0 && (
                  <span> · {distance_km} km away</span>
                )}
              </CardDescription>
            </div>
          </div>
          <Badge className={cn("shrink-0 text-xs font-bold", compatColor)}>
            {compatPercent}%
          </Badge>
        </div>

        {shared_interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {shared_interests.slice(0, 4).map((interest) => (
              <Badge key={interest} variant="secondary" className="text-[10px]">
                {interest}
              </Badge>
            ))}
            {shared_interests.length > 4 && (
              <Badge variant="outline" className="text-[10px]">
                +{shared_interests.length - 4}
              </Badge>
            )}
          </div>
        )}

        {ai_reason && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            "{ai_reason}"
          </p>
        )}

        <Button
          size="sm"
          className="mt-3 w-full"
          onClick={() => {
            apiFetch(`/friends/request/${user.id}`, { method: "POST" })
              .then(() => onConnect?.());
          }}
        >
          <HeartHandshake className="h-3.5 w-3.5 mr-1" />
          Connect
        </Button>
      </CardHeader>
    </Card>
  );
}
