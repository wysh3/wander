"use client";

import { useState } from "react";
import { CategoryFilter } from "@/components/activities/category-filter";
import { ActivityFeed } from "@/components/activities/activity-feed";
import { Bell, ChevronDown } from "lucide-react";

export default function ActivitiesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#1e3a5f]">Discover</h1>
          <p className="text-sm font-medium text-[#1e3a5f]/60 mt-1">No algorithm feed. No infinite scroll.</p>
        </div>
        
        {/* Top Right Header Items */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
            <Bell className="w-5 h-5 text-[#1e3a5f]/60" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
          </button>
          
          <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-full shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-blue-500 overflow-hidden shadow-sm">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col -gap-1">
              <span className="text-xs font-bold text-[#1e3a5f]">Alex Morgan</span>
              <span className="text-[10px] text-[#1e3a5f]/50">Pro Member</span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#1e3a5f]/40" />
          </div>
        </div>
      </div>
      
      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      <ActivityFeed category={selectedCategory} />
    </div>
  );
}

