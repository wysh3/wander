"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartHandshake, Users, UserPlus, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { FriendSuggestionCard } from "@/components/friends/friend-suggestion-card";
import { FriendRequestCard } from "@/components/friends/friend-request-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FriendsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"suggestions" | "friends" | "requests">("suggestions");

  const { data: qSuggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ["friends", "suggestions"],
    queryFn: () => apiFetch<Suggestion[]>(`/friends/suggestions?limit=10`),
    staleTime: 60000,
  });

  const { data: qFriends, isLoading: loadingFriends } = useQuery({
    queryKey: ["friends", "list"],
    queryFn: () => apiFetch<FriendItem[]>(`/friends`),
    enabled: tab === "friends",
  });

  const { data: qRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ["friends", "requests"],
    queryFn: () => apiFetch<RequestItem[]>(`/friends/requests`),
    enabled: tab === "requests",
  });

  const staticSuggestions: Suggestion[] = [
    {
      user: { id: "sugg1", name: "Jessica Chen", vibe: "Chill", interests: ["Hiking", "Photography"], home_area: "Downtown" },
      compatibility: 0.95,
      shared_interests: ["Hiking", "Photography"],
      distance_km: 2.4,
      ai_reason: "Both love weekend hikes and taking photos of nature."
    },
    {
      user: { id: "sugg2", name: "Mark Sloan", vibe: "Adventurous", interests: ["Coffee", "Cycling"], home_area: "Westside" },
      compatibility: 0.88,
      shared_interests: ["Coffee"],
      distance_km: 5.1,
      ai_reason: "High similarity in outgoing personality traits."
    },
    {
      user: { id: "sugg3", name: "Ana Silva", vibe: "Curious", interests: ["Art", "Reading"], home_area: "Eastside" },
      compatibility: 0.82,
      shared_interests: ["Art"],
      distance_km: 3.8,
      ai_reason: "Match based on shared introverted preferences."
    }
  ];

  const staticFriends: FriendItem[] = [
    {
      id: "f1",
      friend: { id: "u2", name: "David Kim", vibe: "Energetic", interests: ["Running"], home_area: "Uptown" },
      compatibility_score: 0.91,
      connected_at: new Date().toISOString()
    },
    {
      id: "f2",
      friend: { id: "u3", name: "Sarah Jones", vibe: "Chill", interests: ["Yoga"], home_area: "Downtown" },
      compatibility_score: 0.86,
      connected_at: new Date().toISOString()
    }
  ];

  const staticRequests: RequestItem[] = [
    {
      id: "req1",
      from_user: { id: "u4", name: "Michael T", vibe: "Fun", interests: ["Music"], home_area: "Midtown" },
      compatibility_score: 0.79,
      created_at: new Date().toISOString()
    }
  ];

  const suggestions = qSuggestions?.length ? qSuggestions : staticSuggestions;
  const friends = qFriends?.length ? qFriends : staticFriends;
  const requests = qRequests?.length ? qRequests : staticRequests;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["friends"] });
  };

  const tabs = [
    { key: "suggestions" as const, label: "Suggestions", icon: UserPlus, count: null },
    { key: "friends" as const, label: "My Friends", icon: Users, count: null },
    {
      key: "requests" as const,
      label: "Requests",
      icon: HeartHandshake,
      count: requests?.length || 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Friend Match</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered compatibility to find your people.
        </p>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count !== null && t.count > 0 && (
              <Badge variant="default" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                {t.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {tab === "suggestions" && (
        <div>
          {loadingSuggestions ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding compatible friends...
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {suggestions.map((s) => (
                <FriendSuggestionCard
                  key={s.user.id}
                  suggestion={s}
                  onConnect={invalidateAll}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardHeader>
                <UserPlus className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <CardTitle>No suggestions right now</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete more activities to get better friend matches.
                </p>
              </CardHeader>
            </Card>
          )}
        </div>
      )}

      {tab === "friends" && (
        <div>
          {loadingFriends ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading friends...
            </div>
          ) : friends && friends.length > 0 ? (
            <div className="space-y-2">
              {friends.map((f) => (
                <Card key={f.id} className="hover:bg-muted/30 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-wander-teal/20 flex items-center justify-center text-sm font-medium">
                        {(f.friend.name || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base">{f.friend.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {f.friend.home_area}
                          {f.friend.vibe && ` · ${f.friend.vibe}`}
                          {f.compatibility_score != null &&
                            ` · ${Math.round(f.compatibility_score * 100)}% match`}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardHeader>
                <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <CardTitle>No friends yet</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Check the Suggestions tab to find compatible people!
                </p>
              </CardHeader>
            </Card>
          )}
        </div>
      )}

      {tab === "requests" && (
        <div>
          {loadingRequests ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading requests...
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {requests.map((r) => (
                <FriendRequestCard key={r.id} request={r} onHandled={invalidateAll} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardHeader>
                <HeartHandshake className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <CardTitle>No pending requests</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Friend requests will appear here when someone connects with you.
                </p>
              </CardHeader>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

interface SuggestionUser {
  id: string;
  name: string | null;
  vibe: string | null;
  interests: string[];
  home_area: string | null;
}

interface Suggestion {
  user: SuggestionUser;
  compatibility: number;
  shared_interests: string[];
  distance_km: number;
  ai_reason: string | null;
}

interface FriendUser {
  id: string;
  name: string | null;
  vibe: string | null;
  interests: string[];
  home_area: string | null;
}

interface FriendItem {
  id: string;
  friend: FriendUser;
  compatibility_score: number | null;
  connected_at: string | null;
}

interface RequestUser {
  id: string;
  name: string | null;
  vibe: string | null;
  interests: string[];
  home_area: string | null;
}

interface RequestItem {
  id: string;
  from_user: RequestUser;
  compatibility_score: number | null;
  created_at: string | null;
}
