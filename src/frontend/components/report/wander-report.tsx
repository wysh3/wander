"use client";

import { motion } from "framer-motion";
import { Users, MapPin, TrendingDown, Award, Compass } from "lucide-react";

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
    <div className="space-y-6 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-6 bg-gradient-to-br from-wander-teal/10 to-wander-coral/10 rounded-2xl"
      >
        <p className="text-sm font-medium text-wander-teal mb-1">AI-Generated Wander Report</p>
        <h2 className="text-2xl font-bold">{data.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">Every other app measures engagement with their platform. We measure engagement with the world.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingDown className="h-6 w-6 text-green-600" />
          <h3 className="font-semibold text-green-700">Screen Time Reduction</h3>
        </div>
        <p className="text-5xl font-bold text-green-600">{data.screen_time_percent}%</p>
        <p className="text-sm text-green-700/70 mt-1">less time on screens since joining Wander</p>
        <p className="text-xs text-green-600/50 mt-2">
          {data.screen_time_delta < 0 ? '-' : ''}{Math.abs(data.screen_time_delta)} min/day reclaimed for real life
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Experiences", value: data.total_experiences, icon: Compass },
          { label: "People Met", value: data.total_people_met, icon: Users },
          { label: "Neighborhoods", value: data.total_neighborhoods_explored, icon: MapPin },
          { label: "Week Streak", value: data.streak_weeks, icon: Award },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="bg-card border rounded-xl p-4 text-center"
          >
            <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="space-y-2"
      >
        <h3 className="font-semibold text-sm">Badges Earned</h3>
        <div className="flex gap-2 flex-wrap">
          {data.badges.filter((b) => b.earned).map((badge) => (
            <span key={badge.name} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
              {badge.name}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.blockquote
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center text-sm italic text-muted-foreground px-4 py-6 border-t"
      >
        "{data.quote}"
      </motion.blockquote>
    </div>
  );
}
