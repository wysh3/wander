"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export default function CommunitiesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["communities", "list"],
    queryFn: () => apiFetch<{ items: CommunityItem[]; next_cursor: string | null }>("/communities?limit=20"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Communities</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-3/4 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const communities = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find your tribe. Join communities built around shared interests.
          </p>
        </div>
      </div>

      {communities.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>No communities yet</CardTitle>
            <CardDescription>
              Communities will appear here when they are created. Check back soon!
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {communities.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push(`/communities/${c.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="h-4 w-4 text-wander-teal" />
                      {c.name}
                    </CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {c.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {c.interest_tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {c.interest_tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{c.interest_tags.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{c.member_count}</span>
                  {c.is_member && (
                    <Badge variant="default" className="ml-1 text-xs">Joined</Badge>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface CommunityItem {
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
