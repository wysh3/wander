"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

interface ActivityCardProps {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  area: string | null;
  scheduled_at: string;
  group_size_min: number;
  group_size_max: number;
  participant_count: number;
  phone_free_encouraged: boolean;
}

const categoryColors: Record<string, string> = {
  physical: "bg-orange-100 text-orange-800",
  social_good: "bg-green-100 text-green-800",
  skill: "bg-blue-100 text-blue-800",
  mental: "bg-purple-100 text-purple-800",
  chaotic: "bg-pink-100 text-pink-800",
  explore: "bg-teal-100 text-teal-800",
  slow: "bg-amber-100 text-amber-800",
};

export function ActivityCard({ id, title, description, category, area, scheduled_at, group_size_min, group_size_max, participant_count, phone_free_encouraged }: ActivityCardProps) {
  return (
    <Link href={`/activities/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-wander-teal/20 to-wander-coral/20 flex items-center justify-center">
          <span className="text-4xl">
            {category === "physical" ? "🏃" : category === "explore" ? "🌄" : category === "social_good" ? "💚" : "✨"}
          </span>
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={categoryColors[category || ""] || ""}>
              {category?.replace("_", " ")}
            </Badge>
            {phone_free_encouraged && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Phone-Free Zone
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-sm line-clamp-1">{title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(scheduled_at), "MMM d, h:mm a")}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {area}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {group_size_min}-{group_size_max} people
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
