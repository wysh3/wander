"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/shared/star-rating";
import { Users, MessageCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: group, isLoading } = useQuery<any>({
    queryKey: ["groups", "detail", id],
    queryFn: () => apiFetch(`/groups/${id}`),
  });

  if (isLoading) return <div className="h-80 bg-muted animate-pulse rounded-xl" />;
  if (!group) return <p>Group not found</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{group.activity_title || "Your Group"}</CardTitle>
            <Badge variant="secondary">{group.match_score?.toFixed(2)} match</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {group.activity_scheduled_at
                ? format(new Date(group.activity_scheduled_at), "MMM d, h:mm a")
                : "TBD"}
            </span>
          </div>

          {group.host_name && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wander-teal to-wander-coral flex items-center justify-center text-white font-bold">
                {group.host_name[0]}
              </div>
              <div>
                <p className="font-medium text-sm">{group.host_name}</p>
                <p className="text-xs text-muted-foreground">Wander Host</p>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" /> Group Members
            </h4>
            <div className="space-y-2">
              {group.members?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                      {m.name?.[0] || "?"}
                    </div>
                    <span className="text-sm">{m.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{m.role}</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={() => router.push(`/groups/${id}/chat`)}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Open Group Chat
      </Button>
    </div>
  );
}
