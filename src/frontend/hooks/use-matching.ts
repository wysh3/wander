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
    try {
      const startResp = await apiFetch<{ total_users: number }>(`/match/${activityId}`, { method: "POST" });
    } catch (e) {
      setError("Matching failed to start");
      return;
    }
    await animateProgress(setProgress, 15, 40, 600);

    setPhase("solving");
    let polled = 0;
    const maxPolls = 30;
    while (polled < maxPolls) {
      await new Promise((r) => setTimeout(r, 800));
      polled++;
      try {
        const status = await apiFetch<{ status: string; progress: number; phase?: string; total_users?: number; geo_method?: string; search_radius_km?: number }>(
          `/match/${activityId}/status`
        );
        const clientProgress = 40 + (status.progress || 0) * 0.55 / 100;
        setProgress(Math.min(clientProgress, 95));
        
        // Update stats if provided
        if (status.geo_method || status.search_radius_km) {
          setMatchStats({ geo_method: status.geo_method, search_radius_km: status.search_radius_km });
        }
        
        if (status.status === "complete") break;
        if (status.status === "failed") {
          setError("Matching solver failed. Try increasing your search radius.");
          return;
        }
      } catch (e) {
        continue;
      }
    }

    try {
      const data = await apiFetch<MatchResult>(`/match/${activityId}/result`);
      await animateProgress(setProgress, 95, 100, 200);
      setPhase("done");
      setResult(data);
    } catch (e) {
      setError("Failed to fetch match results");
    }
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
