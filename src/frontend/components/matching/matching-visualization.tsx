"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Users, ClipboardList, Brain, Heart, Shield, Star, Calendar, MapPin, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { getActivityImage } from "@/lib/images";

interface MatchingVisualizationProps {
  phase: "idle" | "filtering" | "constraints" | "solving" | "done";
  progress: number;
  result: any | null;
}

export function MatchingVisualization({ phase, progress, result }: MatchingVisualizationProps) {
  const router = useRouter();
  
  const steps = [
    { key: "filtering", label: "Filtering", sub: "Shortlisting people", icon: Users },
    { key: "constraints", label: "Constraints", sub: "Applying rules", icon: ClipboardList },
    { key: "solving", label: "Solving", sub: "CP-SAT in action", icon: Brain },
    { key: "done", label: "Done", sub: "Optimal groups ready", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === phase);
  
  return (
    <div className="flex flex-col space-y-8 w-full">
      {/* Horizontal Stepper */}
      <div className="relative flex justify-between items-center w-full max-w-2xl mx-auto py-4">
        {/* Connecting Lines */}
        <div className="absolute top-8 left-[10%] right-[10%] h-1 bg-[#eaf4f4] rounded-full z-0"></div>
        <div 
          className="absolute top-8 left-[10%] h-1 bg-[#2cb1bc] rounded-full z-0 transition-all duration-500"
          style={{ width: `${Math.max(0, currentStepIndex * 33)}%`, right: '10%' }}
        ></div>

        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isCurrent = step.key === phase;
          const isDone = index < currentStepIndex || phase === "done";
          
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-3">
              <div 
                className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-white transition-all duration-500 shadow-sm ${
                  isDone || isCurrent ? "bg-[#eaf4f4] text-[#2cb1bc]" : "bg-gray-50 text-gray-400"
                }`}
              >
                <step.icon className={`w-7 h-7 ${isCurrent ? "animate-pulse" : ""}`} />
              </div>
              <div className="text-center">
                <p className={`text-[13px] font-bold ${isActive ? "text-[#1e3a5f]" : "text-[#1e3a5f]/40"}`}>{step.label}</p>
                <p className={`text-[11px] ${isActive ? "text-[#1e3a5f]/60" : "text-[#1e3a5f]/30"}`}>{step.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Card */}
      <AnimatePresence mode="wait">
        {phase === "done" && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgba(30,58,95,0.04)] border border-gray-100 flex flex-col md:flex-row items-center gap-10"
          >
            {/* Circular Progress */}
            <div className="flex-shrink-0 flex flex-col items-center relative pl-4 md:border-r border-gray-100 md:pr-10">
              <div className="relative w-44 h-44 mb-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#eaf4f4" strokeWidth="8" />
                  <motion.circle
                    cx="50" cy="50" r="44" fill="none" stroke="#2cb1bc" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 44}
                    strokeDashoffset={0}
                    initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[32px] font-bold text-[#1e3a5f]">100%</span>
                  <span className="text-[11px] font-bold text-[#1e3a5f]/60 text-center px-4 leading-tight">Matching Complete!</span>
                </div>
              </div>
              <div className="absolute -bottom-2 bg-[#34c759] rounded-full p-2 text-white shadow-lg shadow-green-500/20 border-4 border-white">
                <CheckCircle2 className="w-5 h-5 fill-current" />
              </div>
            </div>

            {/* 2x2 Grid */}
            <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-6">
              {[
                { 
                  label: "Personality Similarity", 
                  value: `${(result.constraint_stats.personality_similarity_avg * 100).toFixed(0)}%`, 
                  sub: "Average across groups",
                  icon: Heart, 
                  color: "text-[#2cb1bc] bg-[#eaf4f4]" 
                },
                { 
                  label: "Repeat Pairs Avoided", 
                  value: `${result.constraint_stats.repeat_pairs_avoided}%`, 
                  sub: "New connections prioritized",
                  icon: Users, 
                  color: "text-[#34c759] bg-green-50" 
                },
                { 
                  label: "Women-Only Groups", 
                  value: String(result.constraint_stats.women_only_groups), 
                  sub: "Groups created",
                  icon: Users, 
                  color: "text-[#f43f5e] bg-rose-50" 
                },
                { 
                  label: "Hosts Assigned", 
                  value: String(result.constraint_stats.hosts_assigned), 
                  sub: "Trusted hosts matched",
                  icon: Star, 
                  color: "text-[#f59e0b] bg-amber-50" 
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#1e3a5f]/50 mb-0.5">{stat.label}</p>
                    <p className="text-[28px] font-bold text-[#1e3a5f] leading-none mb-1">{stat.value}</p>
                    <p className="text-[11px] font-medium text-[#1e3a5f]/60">{stat.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results List */}
      <AnimatePresence>
        {result && phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="space-y-4 pt-4"
          >
            <div className="flex items-end justify-between mb-2">
              <div>
                <h3 className="text-xl font-bold text-[#1e3a5f]">Your Matched Groups</h3>
                <p className="text-[13px] text-[#1e3a5f]/60 font-medium">Balanced groups. Meaningful connections.</p>
              </div>
              <button onClick={() => router.push('/groups')} className="text-[#2cb1bc] text-sm font-semibold hover:underline flex items-center gap-1">
                View All Groups <span className="text-lg leading-none">→</span>
              </button>
            </div>

            <div className="space-y-4">
              {result.groups?.map((group: any, i: number) => {
                const bgImage = getActivityImage(group.activity_title, group.activity_category);

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + i * 0.15 }}
                    className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex gap-5 items-center relative overflow-hidden group"
                    onClick={() => router.push(`/groups/${group.id}`)}
                  >
                    <div 
                      className="w-[120px] h-[120px] rounded-xl shrink-0 bg-gray-100 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url('${bgImage}')` }}
                    />
                    
                    <div className="flex-1 py-1">
                      {/* Badge Score */}
                      <div className="absolute top-4 right-4 border border-[#34c759] text-[#34c759] bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
                        {group.match_score?.toFixed(0)}% Match
                      </div>

                      <h4 className="font-bold text-[17px] text-[#1e3a5f] pr-20">{group.activity_title || "Activity Group"}</h4>
                      
                      <div className="flex items-center gap-4 mt-2 mb-4">
                        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#1e3a5f]/60">
                          <Calendar className="w-[14px] h-[14px] text-[#2cb1bc]" />
                          <span>Sun, 26 May • 8:00 AM</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#1e3a5f]/60">
                          <MapPin className="w-[14px] h-[14px] text-[#2cb1bc]" />
                          <span>Location</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        {group.members?.slice(0, 4).map((m: any, idx: number) => {
                          return (
                            <div key={m.id} className="w-7 h-7 rounded-full bg-gray-100 overflow-hidden border border-white shadow-sm">
                              <img src={`https://i.pravatar.cc/150?u=${m.id}`} alt={m.name || ""} className="w-full h-full object-cover" />
                            </div>
                          );
                        })}
                        {group.members?.length > 4 && (
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-[#1e3a5f]/50">
                            +{group.members.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-2 mt-8 py-4 bg-gray-50/50 rounded-xl border border-gray-100">
              <Lock className="w-4 h-4 text-[#2cb1bc]" />
              <span className="text-[12px] font-medium text-[#1e3a5f]/60">Our AI respects your preferences and privacy. You're always in control.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

