"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Star, Calendar, Activity } from "lucide-react";

export default function HostDashboardPage() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["host", "dashboard"],
    queryFn: () => apiFetch("/host/dashboard"),
  });

  if (isLoading) return <div className="h-48 bg-muted animate-pulse rounded-xl" />;

  const stats = data?.stats || { total_experiences_hosted: 0, rating_avg: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Host Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your hosted experiences</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.total_experiences_hosted}</p>
            <p className="text-xs text-muted-foreground">Experiences Hosted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto mb-2 text-amber-400" />
            <p className="text-2xl font-bold">{stats.rating_avg?.toFixed(1) || "N/A"}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Groups</CardTitle>
        </CardHeader>
        <CardContent>
          {(!data?.upcoming_groups || data.upcoming_groups.length === 0) ? (
            <p className="text-sm text-muted-foreground">No upcoming groups</p>
          ) : (
            <div className="space-y-2">
              {data.upcoming_groups.map((g: any) => (
                <div key={g.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <span className="text-sm font-medium">{g.activity_title}</span>
                  <Badge variant="outline">{g.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
