"use client";

import { useParams } from "next/navigation";
import { useMatching } from "@/hooks/use-matching";
import { MatchingVisualization } from "@/components/matching/matching-visualization";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MatchingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { phase, progress, result, error, start } = useMatching(id);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">AI Matching Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">
          CP-SAT solver optimizing groups across 6 constraint dimensions
        </p>
      </div>

      <MatchingVisualization phase={phase} progress={progress} result={result} />

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {phase === "idle" && (
        <Button size="lg" className="w-full" onClick={start}>
          <Play className="h-4 w-4 mr-2" />
          Start Matching
        </Button>
      )}

      {phase === "done" && result?.groups && result.groups.length > 0 && (
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/groups/${result.groups[0].id}`)}
        >
          View My Group
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  );
}
