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
        <h2 className="text-[32px] font-bold text-[#1e3a5f] leading-tight">{data.name}'s<br/>Wander Report</h2>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Experiences", value: data.total_experiences, icon: Compass, color: "text-[#2cb1bc]", bg: "bg-[#eaf4f4]" },
          { label: "People Met", value: data.total_people_met, icon: Users, color: "text-[#f59e0b]", bg: "bg-amber-50" },
          { label: "Neighborhoods", value: data.total_neighborhoods_explored, icon: MapPin, color: "text-[#f43f5e]", bg: "bg-rose-50" },
          { label: "Week Streak", value: data.streak_weeks, icon: Award, color: "text-[#8b5cf6]", bg: "bg-violet-50" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm text-center"
          >
            <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <p className="text-[28px] font-bold text-[#1e3a5f] leading-none mb-1">{stat.value}</p>
            <p className="text-[12px] font-bold text-[#1e3a5f]/50 uppercase tracking-wide">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm"
      >
        <h3 className="font-bold text-[17px] text-[#1e3a5f] mb-4">Badges Earned</h3>
        <div className="flex flex-wrap gap-2.5">
          {data.badges.filter((b) => b.earned).map((badge) => (
            <div key={badge.name} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eaf4f4] rounded-full border border-[#2cb1bc]/20">
              <span>{badge.icon}</span>
              <span className="text-[12px] font-bold text-[#2cb1bc]">{badge.name}</span>
            </div>
          ))}
          {data.badges.filter((b) => !b.earned).length > 0 && (
            <div className="px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
              <span className="text-[12px] font-bold text-[#1e3a5f]/40">+ {data.badges.filter((b) => !b.earned).length} to unlock</span>
            </div>
          )}
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

