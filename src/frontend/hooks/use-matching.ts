"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

interface MatchMember {
  id: string;
  name: string;
  gender: string;
  vector: number[];
}

interface GroupResult {
  id: string;
  host_id: string;
  host_name: string;
  match_score: number;
  member_ids: string[];
  members: MatchMember[];
}

interface ConstraintStats {
  personality_similarity_avg: number;
  repeat_pairs_avoided: number;
  women_only_groups: number;
  hosts_assigned: number;
  total_constraints: number;
}

interface MatchResult {
  groups: GroupResult[];
  solved_in_ms: number;
  solver: string;
  total_users: number;
  total_groups: number;
  constraint_stats: ConstraintStats | null;
}

export function useMatching(activityId: string) {
  const [phase, setPhase] = useState<"idle" | "filtering" | "constraints" | "solving" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matchStats, setMatchStats] = useState<{ geo_method?: string; search_radius_km?: number }>({});

  const start = useCallback(async () => {
    setError(null);
    setResult(null);
    setPhase("filtering");
    await animateProgress(setProgress, 0, 15, 600);

    setPhase("constraints");
    // Simulate backend delay for starting the process
    await new Promise((r) => setTimeout(r, 600));
    await animateProgress(setProgress, 15, 40, 600);

    setPhase("solving");
    // Simulate solving progress
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 400));
      setProgress(40 + i * 5);
    }
    
    // Simulate successful result
    await animateProgress(setProgress, 90, 100, 200);
    setPhase("done");
    setResult({
      groups: [
        {
          id: "group1",
          host_id: "host1",
          host_name: "John Doe",
          match_score: 98,
          member_ids: ["host1", "user2", "user3", "user4"],
          members: [
            { id: "host1", name: "John Doe", gender: "M", vector: [] },
            { id: "user2", name: "Emma Smith", gender: "F", vector: [] },
            { id: "user3", name: "Michael Chen", gender: "M", vector: [] },
            { id: "user4", name: "Sophia Li", gender: "F", vector: [] },
          ]
        },
        {
          id: "group2",
          host_id: "host2",
          host_name: "Alex Wang",
          match_score: 85,
          member_ids: ["host2", "user5", "user6"],
          members: [
            { id: "host2", name: "Alex Wang", gender: "M", vector: [] },
            { id: "user5", name: "David Kim", gender: "M", vector: [] },
            { id: "user6", name: "Sarah Jones", gender: "F", vector: [] },
          ]
        }
      ],
      solved_in_ms: 4321,
      solver: "FakeDemoOptimizer",
      total_users: 7,
      total_groups: 2,
      constraint_stats: {
        personality_similarity_avg: 0.88,
        repeat_pairs_avoided: 5,
        women_only_groups: 0,
        hosts_assigned: 2,
        total_constraints: 24
      }
    });

  }, [activityId]);

  return { phase, progress, result, error, start, matchStats };
}

async function animateProgress(
  setProgress: (p: number) => void,
  from: number,
  to: number,
  duration: number
): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(from + (to - from) * easeOutCubic(p));
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}
