"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

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
  const [status, setStatus] = useState<"pending" | "accepted" | "declined">("pending");
  const { id, from_user, compatibility_score } = request;
  const compatPercent = compatibility_score
    ? Math.round(compatibility_score * 100)
    : null;

  const handleAccept = async () => {
    // Mock handler
    setStatus("accepted");
  };

  const handleReject = async () => {
    // Mock handler
    setStatus("declined");
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

        {status === "pending" ? (
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1" onClick={handleAccept}>
              Accept
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={handleReject}>
              Decline
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="secondary" className="flex-1" disabled>
              {status === "accepted" ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                  Accepted
                </>
              ) : (
                <>
                  <X className="h-3.5 w-3.5 mr-1 text-red-500" />
                  Declined
                </>
              )}
            </Button>
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
