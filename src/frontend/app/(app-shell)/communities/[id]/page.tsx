"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Globe, Users, Shield, ArrowLeft, MessageCircle, LogOut, Loader2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export default function CommunityDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isMemberMock, setIsMemberMock] = useState(false);

  const { data: qCommunity, isLoading } = useQuery({
    queryKey: ["communities", "detail", params.id],
    queryFn: () => apiFetch<CommunityDetail>(`/communities/${params.id}`),
  });

  const { data: qMembers } = useQuery({
    queryKey: ["communities", "members", params.id],
    queryFn: () => apiFetch<MemberItem[]>(`/communities/${params.id}/members`),
    enabled: !!qCommunity,
  });

  // Fake demo community logic
  const community: CommunityDetail = qCommunity || {
    id: params.id,
    name: "Demo Community",
    interest_tags: ["Demo", "Mock"],
    description: "This is a simulated community for demonstration purposes.",
    member_count: 42,
    cover_image_url: null,
    rules: "1. Be kind\n2. Have fun",
    member_limit: 100,
    is_member: false,
    role: null,
    created_by: "Demo Admin",
    created_at: new Date().toISOString()
  };

  const members: MemberItem[] = qMembers || [
    { id: "cm1", user_id: "u1", role: "founder", joined_at: new Date().toISOString(), name: "Demo Admin" }
  ];

  const joinMutation = useMutation({
    mutationFn: async () => {
      // Simulate API delay
      await new Promise(r => setTimeout(r, 600));
      return { success: true };
    },
    onSuccess: () => {
      setIsMemberMock(true);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      // Simulate API delay
      await new Promise(r => setTimeout(r, 600));
      return { success: true };
    },
    onSuccess: () => {
       setIsMemberMock(false);
    },
  });

  // Never show loading completely since it's a demo
  /* if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  } */

  if (!community) {
    return (
      <div className="text-center py-16">
        <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Community not found</h2>
        <p className="text-muted-foreground mt-2">This community may have been archived or deleted.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/communities")}>
          Back to Communities
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <button
        onClick={() => router.push("/communities")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Communities
      </button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Globe className="h-5 w-5 text-wander-teal" />
                {community.name}
              </CardTitle>
              {community.created_by && (
                <p className="text-sm text-muted-foreground mt-1">
                  Founded by {community.created_by}
                </p>
              )}
            </div>
            <div>
              {isMemberMock ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/communities/${params.id}/chat`)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => leaveMutation.mutate()}
                    disabled={leaveMutation.isPending}
                  >
                    {leaveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-1" />
                    )}
                    Leave
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                >
                  {joinMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1" />
                  )}
                  Join
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {community.description && (
            <p className="text-muted-foreground">{community.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {community.interest_tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>

          {community.rules && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Shield className="h-4 w-4" />
                Community Rules
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{community.rules}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{community.member_count} / {community.member_limit} members</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {members && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Members ({members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-wander-teal/20 flex items-center justify-center text-sm font-medium">
                      {(m.name || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.name || "User"}</p>
                    </div>
                  </div>
                  <Badge variant={m.role === "founder" ? "default" : "outline"} className="text-xs">
                    {m.role === "founder" ? "Founder" : m.role === "admin" ? "Admin" : "Member"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CommunityDetail {
  id: string;
  name: string;
  interest_tags: string[];
  description: string | null;
  member_count: number;
  cover_image_url: string | null;
  rules: string | null;
  member_limit: number;
  is_member: boolean;
  role: string | null;
  created_by: string | null;
  created_at: string | null;
}

interface MemberItem {
  id: string;
  user_id: string;
  name: string | null;
  role: string;
  joined_at: string | null;
}
