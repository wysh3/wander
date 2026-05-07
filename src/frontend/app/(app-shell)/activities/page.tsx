"use client";

import { useState } from "react";
import { CategoryFilter } from "@/components/activities/category-filter";
import { ActivityFeed } from "@/components/activities/activity-feed";
import { RecommendedCarousel } from "@/components/activities/recommended-carousel";
import { RadiusSelector, NearbyCountBadge } from "@/components/location/radius-selector";
import { Compass } from "lucide-react";

export default function ActivitiesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Compass className="h-6 w-6 text-wander-teal" />
        <div>
          <h1 className="text-2xl font-bold">Discover</h1>
          <p className="text-sm text-muted-foreground">AI-curated experiences, just for you.</p>
        </div>
        <div className="ml-auto">
          <NearbyCountBadge />
        </div>
      </div>
      <div className="bg-card border rounded-xl p-4">
        <RadiusSelector />
      </div>
      <RecommendedCarousel />
      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      <ActivityFeed category={selectedCategory} />
    </div>
  );
}
