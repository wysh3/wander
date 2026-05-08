"use client";

import { useState } from "react";
import { CategoryFilter } from "@/components/activities/category-filter";
import { ActivityFeed } from "@/components/activities/activity-feed";
import { RecommendedCarousel } from "@/components/activities/recommended-carousel";
import { RadiusSelector } from "@/components/location/radius-selector";
import { LocalEventDiscovery } from "@/components/activities/local-event-discovery";

export default function ActivitiesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-[32px] font-bold text-[#1e3a5f]">Discover</h1>

      <div className="bg-card border rounded-xl p-4">
        <RadiusSelector />
      </div>
      <LocalEventDiscovery />
      <RecommendedCarousel />
      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      <ActivityFeed category={selectedCategory} />
    </div>
  );
}
