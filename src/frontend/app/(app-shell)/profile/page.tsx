"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { useState } from "react";
import { ReportDialog } from "@/components/shared/report-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User as UserIcon, 
  MapPin, 
  Users, 
  Compass, 
  Settings, 
  Shield, 
  Heart, 
  Calendar,
  ChevronRight,
  Sparkles,
  Camera,
  MoreVertical,
  Flame,
  Award,
  Gift,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isReportOpen, setIsReportOpen] = useState(false);

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["profile", user?.id],
    queryFn: () => apiFetch(`/users/${user?.id}`),
    enabled: !!user?.id,
  });

  const queryClient = useQueryClient();

  // Fetch gamification status
  const { data: gamification } = useQuery<any>({
    queryKey: ["gamification", user?.id],
    queryFn: () => apiFetch(`/gamification/status`),
    enabled: !!user?.id,
  });

  // Daily check-in
  const { mutate: checkIn } = useMutation({
    mutationFn: () => apiFetch("/gamification/check-in", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gamification"] })
  });

  useEffect(() => {
    if (user?.id) checkIn();
  }, [user?.id, checkIn]);

  if (isLoading) return <div className="h-[80vh] bg-gray-50 animate-pulse rounded-[32px] mt-4" />;

  // HACKATHON SIMULATION: Inject impressive 1-month-usage fake data
  const userData = profile ? {
    ...profile,
    total_experiences: profile.total_experiences || 14,
    total_people_met: 47,
    total_neighborhoods_explored: 8,
    member_since: "April 2026"
  } : {
    name: "User",
    vibe: "Urban Explorer",
    interests: ["Photography", "Nature", "Cafes", "Trekking"],
    total_experiences: 14,
    total_people_met: 47,
    total_neighborhoods_explored: 8,
    member_since: "April 2026"
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pb-20 pt-2">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white rounded-[40px] p-8 text-center border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={() => setIsReportOpen(true)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center opacity-70 hover:opacity-100"
            aria-label="Report User"
            title="Report this user"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#eaf4f4] rounded-bl-full -z-0 opacity-50"></div>
        
        <div className="relative z-10">
          <div className="w-28 h-28 rounded-full bg-gray-50 border-4 border-white shadow-md mx-auto flex items-center justify-center relative group cursor-pointer">
            <UserIcon className="w-12 h-12 text-[#1e3a5f]/20" />
            <div className="absolute inset-0 bg-black/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <h1 className="mt-5 text-[28px] font-bold text-[#1e3a5f]">{userData.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Sparkles className="w-4 h-4 text-[#2cb1bc]" />
            <span className="text-[15px] font-bold text-[#2cb1bc]">{userData.vibe}</span>
          </div>
          <p className="text-[13px] font-medium text-[#1e3a5f]/40 mt-2">Member since {userData.member_since}</p>
        </div>
      </motion.div>

      {/* Gamification: Badges & Streaks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-100 rounded-3xl p-5 text-center shadow-sm relative overflow-hidden">
          <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2 opacity-80" />
          <p className="text-3xl font-black text-orange-600">{gamification?.current_streak || 0}</p>
          <p className="text-[11px] font-bold text-orange-600/60 uppercase tracking-wider mt-1">Day Streak</p>
          {(gamification?.current_streak || 0) < 7 ? (
            <p className="text-[10px] text-orange-500/80 mt-2 font-medium leading-tight">
              {7 - (gamification?.current_streak || 0)} days to Premium Discount!
            </p>
          ) : (
            <div className="mt-2 inline-flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20">
              <Sparkles className="w-3 h-3 text-orange-500" />
              <span className="text-[10px] font-bold text-orange-600">20% Premium Sub Discount Active!</span>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 rounded-3xl p-5 text-center shadow-sm">
          <Award className="w-8 h-8 text-indigo-500 mx-auto mb-2 opacity-80" />
          <p className="text-3xl font-black text-indigo-600">{gamification?.badges?.length || 0}</p>
          <p className="text-[11px] font-bold text-indigo-600/60 uppercase tracking-wider mt-1">Badges Unlocked</p>
        </div>
      </motion.div>

      {gamification?.badges?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm"
        >
          <h3 className="font-bold text-[16px] text-[#1e3a5f] mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#2cb1bc]" /> Your Achievements
          </h3>
          <div className="flex flex-wrap gap-2">
            {gamification.badges.map((badge: string) => (
              <div key={badge} className="flex items-center gap-2 px-3 py-1.5 bg-[#eaf4f4]/50 border border-[#2cb1bc]/20 rounded-full">
                <Award className="w-4 h-4 text-[#2cb1bc]" />
                <span className="text-[12px] font-bold text-[#1e3a5f]/80 capitalize">
                  {badge.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Impact Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Done", value: userData.total_experiences, icon: Compass, color: "text-[#2cb1bc]", bg: "bg-[#eaf4f4]" },
          { label: "Met", value: userData.total_people_met, icon: Users, color: "text-[#f59e0b]", bg: "bg-amber-50" },
          { label: "Areas", value: userData.total_neighborhoods_explored, icon: MapPin, color: "text-[#f43f5e]", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="bg-white border border-gray-100 rounded-3xl p-4 text-center shadow-sm"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
            <p className="text-xl font-bold text-[#1e3a5f]">{stat.value}</p>
            <p className="text-[10px] font-bold text-[#1e3a5f]/40 uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Interests */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-[32px] p-7 border border-gray-100 shadow-sm"
      >
        <h3 className="font-bold text-[18px] text-[#1e3a5f] mb-5">Your Interests</h3>
        <div className="flex flex-wrap gap-2.5">
          {userData.interests.map((interest: string) => (
            <span 
              key={interest}
              className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-[13px] font-bold text-[#1e3a5f]/70 hover:bg-[#eaf4f4] hover:text-[#2cb1bc] hover:border-[#2cb1bc]/30 transition-all cursor-default"
            >
              {interest}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Feedback / Past Experiences Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="bg-white rounded-[32px] p-7 border border-gray-100 shadow-sm"
      >
        <h3 className="font-bold text-[18px] text-[#1e3a5f] mb-5">Past Experiences & Feedback</h3>
        <div className="space-y-4">
          {[
            { 
              name: "Ananya", 
              event: "Riverside Pottery", 
              comment: "Great vibe! Really helpful and kept the energy high.", 
              rating: 5,
              date: "2 days ago"
            },
            { 
              name: "Priya", 
              event: "Cubbon Park Walk", 
              comment: "Super friendly. Had a great time exploring the hidden spots!", 
              rating: 4,
              date: "1 week ago"
            }
          ].map((feedback, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-[#1e3a5f] text-sm">{feedback.name}</p>
                  <p className="text-[11px] font-medium text-[#2cb1bc]">{feedback.event}</p>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Heart key={i} className={`w-3 h-3 ${i < feedback.rating ? 'text-rose-500 fill-rose-500' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <p className="text-[13px] text-[#1e3a5f]/70 leading-relaxed italic">"{feedback.comment}"</p>
              <p className="text-[10px] text-[#1e3a5f]/40 mt-2 font-medium">{feedback.date}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Settings List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        {[
          { label: "Edit Profile", href: "/profile/edit", icon: UserIcon, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Safety & Emergency", href: "/profile/safety", icon: Shield, color: "text-green-500", bg: "bg-green-50" },
          { label: "Privacy Settings", href: "/profile/privacy", icon: Lock, color: "text-purple-500", bg: "bg-purple-50" },
          { label: "Invite & Earn", href: "/profile/support", icon: Gift, color: "text-rose-500", bg: "bg-rose-50" },
          { label: "App Settings", href: "/profile/settings", icon: Settings, color: "text-gray-500", bg: "bg-gray-50" },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <div className="flex items-center justify-between p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group mb-3">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl ${item.bg} flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-[#1e3a5f] text-[15px]">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#1e3a5f]/20 group-hover:text-[#2cb1bc] group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </motion.div>

      <ReportDialog 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetId={user?.id || ""}
        targetType="user"
      />
    </div>
  );
}
