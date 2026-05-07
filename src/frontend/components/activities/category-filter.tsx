"use client";

import { cn } from "@/lib/utils";
import { ACTIVITY_CATEGORIES } from "@/lib/constants";
import { ChevronRight } from "lucide-react";

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="relative flex items-center mb-6">
      <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide pr-12 w-full">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "flex-shrink-0 px-5 py-2 rounded-full text-[13px] font-semibold transition-all border",
            !selected 
              ? "bg-[#2cb1bc] text-white border-[#2cb1bc] shadow-md shadow-[#2cb1bc]/20" 
              : "bg-white text-[#1e3a5f]/70 border-gray-200 hover:border-gray-300 hover:text-[#1e3a5f]"
          )}
        >
          All
        </button>
        {ACTIVITY_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onSelect(selected === cat.value ? null : cat.value)}
            className={cn(
              "flex-shrink-0 px-5 py-2 rounded-full text-[13px] font-semibold transition-all border",
              selected === cat.value
                ? "bg-[#2cb1bc] text-white border-[#2cb1bc] shadow-md shadow-[#2cb1bc]/20"
                : "bg-white text-[#1e3a5f]/70 border-gray-200 hover:border-gray-300 hover:text-[#1e3a5f]"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
      
      {/* Fade out + Arrow indicator for scrolling */}
      <div className="absolute right-0 top-0 bottom-2 w-20 bg-gradient-to-l from-[#fcfcfc] to-transparent pointer-events-none flex items-center justify-end pr-2">
        <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center pointer-events-auto cursor-pointer text-[#1e3a5f]/40 hover:text-[#1e3a5f]">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

