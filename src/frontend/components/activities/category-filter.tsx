"use client";

import { cn } from "@/lib/utils";
import { ACTIVITY_CATEGORIES } from "@/lib/constants";

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
          !selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
        )}
      >
        All
      </button>
      {ACTIVITY_CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(selected === cat.value ? null : cat.value)}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            selected === cat.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
