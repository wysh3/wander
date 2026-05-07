"use client";

import { motion } from "framer-motion";
import { Users, MapPin, TrendingDown, Award, Compass, Sparkles } from "lucide-react";

interface WanderReportProps {
  data: {
    name: string;
    total_experiences: number;
    total_people_met: number;
    total_neighborhoods_explored: number;
    streak_weeks: number;
    top_categories: { category: string; count: number }[];
    screen_time_delta: number;
    screen_time_percent: number;
    recent_groups: { activity_title: string; scheduled_at: string; people_met: number }[];
    badges: { name: string; icon: string; earned: boolean }[];
    quote: string;
  };
}

export function WanderReport({ data }: WanderReportProps) {
  return (
    <div className="space-y-6 max-w-md mx-auto pb-12">
      {/* Header section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-2"
      >
        <div className="inline-flex items-center gap-1.5 bg-[#eaf4f4] text-[#2cb1bc] px-3 py-1 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold tracking-wide uppercase">AI-Generated</span>
        </div>
        <h2 className="text-[32px] font-bold text-[#1e3a5f] leading-tight">Your<br/>Wander Report</h2>
        <p className="text-[14px] text-[#1e3a5f]/60 mt-3 font-medium px-4">
          Every other app measures engagement with their platform. We measure engagement with the world.
        </p>
      </motion.div>

      {/* Screen Time Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-[#34c759] to-[#28a745] rounded-3xl p-6 text-white shadow-lg shadow-green-500/20 relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
            <TrendingDown className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-white/90 text-[15px] uppercase tracking-wider mb-1">Screen Time Reduction</h3>
          <p className="text-[64px] font-bold leading-none mb-2">{data.screen_time_percent}%</p>
          <p className="text-[15px] font-medium text-white/90 mb-4">less time on screens</p>
          <div className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
            <p className="text-[13px] font-bold">
              {data.screen_time_delta < 0 ? '-' : ''}{Math.abs(data.screen_time_delta)} min/day reclaimed
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Section Header */}
      <div className="px-1">
        <h3 className="font-bold text-[18px] text-[#1e3a5f] mb-2">Real-World Impact</h3>
        <p className="text-[13px] text-[#1e3a5f]/50 font-medium mb-4">Your journey beyond the screen</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Experiences", desc: "Total joined", value: data.total_experiences, icon: Compass, color: "text-[#2cb1bc]", bg: "bg-[#eaf4f4]" },
          { label: "People Met", desc: "New connections", value: data.total_people_met, icon: Users, color: "text-[#f59e0b]", bg: "bg-amber-50" },
          { label: "Neighborhoods", desc: "Areas explored", value: data.total_neighborhoods_explored, icon: MapPin, color: "text-[#f43f5e]", bg: "bg-rose-50" },
          { label: "Active Streak", desc: "Weeks in a row", value: data.streak_weeks, icon: Award, color: "text-[#8b5cf6]", bg: "bg-violet-50" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="bg-white border border-gray-100 rounded-[28px] p-5 shadow-sm text-center group hover:border-[#2cb1bc]/30 transition-all"
          >
            <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${stat.bg} group-hover:scale-110 transition-transform`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <p className="text-[28px] font-bold text-[#1e3a5f] leading-none mb-1">{stat.value}</p>
            <p className="text-[12px] font-bold text-[#1e3a5f] uppercase tracking-wide">{stat.label}</p>
            <p className="text-[10px] font-medium text-[#1e3a5f]/40 mt-1">{stat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Badges Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-white border border-gray-100 rounded-[32px] p-7 shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-[18px] text-[#1e3a5f]">Wander Achievements</h3>
          <span className="text-[11px] font-bold text-[#2cb1bc] bg-[#eaf4f4] px-2.5 py-1 rounded-full uppercase tracking-wider">
            {data.badges.filter(b => b.earned).length}/{data.badges.length} Collected
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {data.badges.map((badge, idx) => {
            const isEarned = badge.earned;
            return (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + idx * 0.05 }}
                className={`relative flex flex-col items-center text-center p-3 rounded-2xl border transition-all ${
                  isEarned 
                    ? "bg-white border-[#eaf4f4] shadow-sm" 
                    : "bg-gray-50/50 border-gray-100 grayscale opacity-40"
                }`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-2.5 relative ${
                  isEarned 
                    ? "bg-gradient-to-br from-white to-[#eaf4f4] shadow-[inset_0_2px_4px_rgba(44,177,188,0.1),0_4px_12px_rgba(44,177,188,0.15)] border-2 border-[#eaf4f4]" 
                    : "bg-gray-50 border-2 border-gray-100"
                }`}>
                  {isEarned ? (
                    <span className="drop-shadow-md transform group-hover:scale-110 transition-transform duration-300">
                      {badge.icon === 'map_pin' ? '📍' : 
                       badge.icon === 'users' ? '👥' : 
                       badge.icon === 'compass' ? '🧭' : 
                       badge.icon === 'sparkles' ? '✨' :
                       badge.icon === 'shield' ? '🛡️' :
                       badge.icon === 'award' ? '🏆' :
                       badge.icon}
                    </span>
                  ) : (
                    <span className="text-[16px] opacity-20">🔒</span>
                  )}
                </div>
                <p className={`text-[11px] font-bold leading-tight ${isEarned ? "text-[#1e3a5f]" : "text-[#1e3a5f]/40"}`}>
                  {badge.name}
                </p>
                {isEarned && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#2cb1bc] rounded-full flex items-center justify-center border-2 border-white">
                    <Sparkles className="w-2 h-2 text-white" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Quote */}
      <motion.blockquote
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center px-6 py-8"
      >
        <p className="text-[18px] italic font-medium text-[#1e3a5f]/70 leading-relaxed">
          "{data.quote}"
        </p>
      </motion.blockquote>
    </div>
  );
}

