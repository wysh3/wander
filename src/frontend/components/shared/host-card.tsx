import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "./star-rating";
import { VerifiedBadge } from "./verified-badge";

interface HostCardProps {
  name: string;
  rating_avg: number;
  specialties: string[];
  total_experiences_hosted: number;
  background_verified: boolean;
}

export function HostCard({ name, rating_avg, specialties, total_experiences_hosted, background_verified }: HostCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-wander-teal to-wander-coral flex items-center justify-center text-white font-bold">
          {name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">{name}</h4>
            {background_verified && <VerifiedBadge />}
          </div>
          <StarRating rating={rating_avg} size={3} />
          <p className="text-xs text-muted-foreground mt-1">{total_experiences_hosted} experiences hosted</p>
          {specialties.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1">
              {specialties.map((s) => (
                <span key={s} className="text-xs bg-muted px-1.5 py-0.5 rounded">{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
