"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Users, Filter, Brain, Zap, Shield, Heart } from "lucide-react";

interface ConstraintStats {
  personality_similarity_avg: number;
  repeat_pairs_avoided: number;
  women_only_groups: number;
  hosts_assigned: number;
  total_constraints: number;
}

interface MatchingVisualizationProps {
  phase: "idle" | "filtering" | "constraints" | "solving" | "done";
  progress: number;
  result: any | null;
  matchStats?: { geo_method?: string; search_radius_km?: number };
}

export function MatchingVisualization({ phase, progress, result, matchStats }: MatchingVisualizationProps) {
  const steps = [
    { key: "filtering", label: `Geo-filtering by location${matchStats?.search_radius_km ? ` (${matchStats.search_radius_km}km)` : ""}`, icon: Filter },
    { key: "constraints", label: "Applying 6 constraint dimensions", icon: Users },
    { key: "solving", label: "CP-SAT solver optimizing groups", icon: Brain },
    { key: "done", label: "Groups formed", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === phase);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      {/* Progress Ring */}
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
          <motion.circle
            cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="4"
            strokeLinecap="round"
            className="text-primary"
            strokeDasharray={2 * Math.PI * 42}
            strokeDashoffset={2 * Math.PI * 42 * (1 - progress / 100)}
            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - progress / 100) }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-primary">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Phase Steps */}
      <div className="space-y-3 w-full max-w-sm">
        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isCurrent = step.key === phase;
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              <motion.div
                animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <step.icon className="h-5 w-5" />
              </motion.div>
              <span className="text-sm font-medium">{step.label}</span>
              {isActive && !isCurrent && <CheckCircle2 className="h-4 w-4 ml-auto text-green-500" />}
              {isCurrent && <Zap className="h-4 w-4 ml-auto text-primary animate-pulse" />}
            </motion.div>
          );
        })}
      </div>

      {/* Constraint Stats Animation */}
      <AnimatePresence>
        {phase === "done" && result?.constraint_stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3 w-full max-w-sm"
          >
            {[
              { label: "Personality Similarity", value: `${(result.constraint_stats.personality_similarity_avg * 100).toFixed(0)}%`, icon: Heart },
              { label: "Repeat Pairs Avoided", value: String(result.constraint_stats.repeat_pairs_avoided), icon: Shield },
              { label: "Women-Only Groups", value: String(result.constraint_stats.women_only_groups), icon: Users },
              { label: "Hosts Assigned", value: `${result.constraint_stats.hosts_assigned}/${result.constraint_stats.hosts_assigned}`, icon: CheckCircle2 },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="bg-card border rounded-xl p-3 text-center"
              >
                <stat.icon className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-4"
          >
            <h3 className="text-xl font-semibold">
              {result.total_groups} groups formed from {result.total_users} users
            </h3>
            <p className="text-sm text-muted-foreground">
              Solved in {result.solved_in_ms?.toFixed(1)}ms using {result.solver}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {result.groups?.map((group: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.3 }}
                  className="border rounded-xl p-4 text-left"
                >
                  <p className="font-semibold text-sm mb-2">Group {i + 1} — Score {group.match_score?.toFixed(2)}</p>
                  <div className="flex flex-wrap gap-1">
                    {group.members?.map((m: any) => (
                      <span key={m.id} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                        {m.name}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
