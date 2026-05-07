import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
}

export function StarRating({ rating, max = 5, size = 4 }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30",
              size === 5 ? "h-5 w-5" : size === 3 ? "h-3 w-3" : "h-4 w-4"
          )}
        />
      ))}
    </div>
  );
}
