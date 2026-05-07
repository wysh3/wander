import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function VerifiedBadge() {
  return (
    <Badge variant="outline" className="flex items-center gap-1 border-green-300 text-green-700 bg-green-50">
      <ShieldCheck className="h-3 w-3" />
      <span>Verified</span>
    </Badge>
  );
}
