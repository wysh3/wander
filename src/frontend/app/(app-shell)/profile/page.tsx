"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
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
  Lock
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["profile", user?.id],
    queryFn: () => apiFetch(`/users/${user?.id}`),
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="h-[80vh] bg-gray-50 animate-pulse rounded-[32px] mt-4" />;

  const userData = profile || {
    name: "User",
    vibe: "Urban Explorer",
    interests: ["Photography", "Nature", "Cafes", "Trekking"],
    total_experiences: 12,
    total_people_met: 48,
    total_neighborhoods_explored: 8,
    streak_weeks: 4
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pb-20 pt-2">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white rounded-[40px] p-8 text-center border border-gray-100 shadow-sm overflow-hidden"
      >
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
          <p className="text-[13px] font-medium text-[#1e3a5f]/40 mt-2">Member since May 2024</p>
        </div>
      </motion.div>

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

      {/* Settings List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
      {[
          { label: "Edit Profile", icon: UserIcon, color: "text-blue-500", bg: "bg-blue-50", href: null },
          { label: "Safety & Emergency", icon: Shield, color: "text-green-500", bg: "bg-green-50", href: null },
          { label: "Privacy Settings", icon: Lock, color: "text-purple-500", bg: "bg-purple-50", href: "/settings/privacy" },
          { label: "Support", icon: Heart, color: "text-rose-500", bg: "bg-rose-50", href: null },
          { label: "App Settings", icon: Settings, color: "text-gray-500", bg: "bg-gray-50", href: null },
        ].map((item) => (
          <div 
            key={item.label}
            onClick={() => item.href && router.push(item.href)}
            className={`flex items-center justify-between p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group ${item.href ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl ${item.bg} flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-[#1e3a5f] text-[15px]">{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#1e3a5f]/20 group-hover:text-[#2cb1bc] group-hover:translate-x-1 transition-all" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
