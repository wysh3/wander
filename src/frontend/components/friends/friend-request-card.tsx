"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RequestUser {
  id: string;
  name: string | null;
  vibe: string | null;
  interests: string[];
  home_area: string | null;
}

interface FriendRequest {
  id: string;
  from_user: RequestUser;
  compatibility_score: number | null;
  created_at: string | null;
}

export function FriendRequestCard({
  request,
  onHandled,
}: {
  request: FriendRequest;
  onHandled?: () => void;
}) {
  const { id, from_user, compatibility_score } = request;
  const compatPercent = compatibility_score
    ? Math.round(compatibility_score * 100)
    : null;

  const handleAccept = async () => {
    const token = localStorage.getItem("wander-auth");
    const accessToken = token ? JSON.parse(token).state?.accessToken : "";
    await fetch(`/api/v1/friends/accept/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    onHandled?.();
  };

  const handleReject = async () => {
    const token = localStorage.getItem("wander-auth");
    const accessToken = token ? JSON.parse(token).state?.accessToken : "";
    await fetch(`/api/v1/friends/reject/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    onHandled?.();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-wander-coral/20 flex items-center justify-center text-sm font-medium shrink-0">
              {(from_user.name || "U")[0].toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-base">{from_user.name || "User"}</CardTitle>
              <CardDescription className="text-xs">
                {from_user.home_area && <span>{from_user.home_area}</span>}
                {from_user.vibe && <span> · {from_user.vibe}</span>}
                {compatPercent !== null && (
                  <span> · {compatPercent}% match</span>
                )}
              </CardDescription>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button size="sm" className="flex-1" onClick={handleAccept}>
            Accept
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={handleReject}>
            Decline
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
