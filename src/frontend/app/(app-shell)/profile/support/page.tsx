"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { motion } from "framer-motion";
import { ArrowLeft, Gift, Share2, Copy, CheckCircle, HelpCircle, MessageCircle, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SupportPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["profile", user?.id],
    queryFn: () => apiFetch(`/users/${user?.id}`),
    enabled: !!user?.id,
  });

  const handleCopy = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.share && profile?.referral_code) {
      navigator.share({
        title: 'Join me on Wander!',
        text: `Use my referral code ${profile.referral_code} to join Wander and let's explore together!`,
        url: window.location.origin,
      }).catch(console.error);
    } else {
      handleCopy();
    }
  };

  if (isLoading) {
    return <div className="h-[80vh] bg-gray-50 animate-pulse rounded-[32px] mt-4 max-w-md mx-auto" />;
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 pt-2 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white rounded-full border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1e3a5f]" />
        </button>
        <h1 className="text-[22px] font-bold text-[#1e3a5f]">Invite & Support</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-[32px] p-6 border border-rose-100 shadow-sm text-center"
      >
        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-[20px] font-bold text-rose-900">Invite Friends</h2>
        <p className="text-[14px] text-rose-700/80 mt-2 mb-6">
          Share your code to earn 50 Wander Points and unlock premium badges!
        </p>

        <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-rose-100 shadow-sm">
          <div className="text-left">
            <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block mb-1">Your Code</span>
            <span className="text-[20px] font-black text-rose-600 tracking-widest">{profile?.referral_code || "WANDER26"}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCopy}
              className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-500" />}
            </button>
            <button 
              onClick={handleShare}
              className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors shadow-sm shadow-rose-500/30"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4"
      >
        <h3 className="font-bold text-[16px] text-[#1e3a5f] mb-2 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-500" /> Need Help?
        </h3>
        
        <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-[#eaf4f4] rounded-2xl transition-colors group">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-[#2cb1bc]" />
            <span className="font-semibold text-[#1e3a5f] text-[15px]">Chat with Support</span>
          </div>
        </button>

        <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-[#eaf4f4] rounded-2xl transition-colors group">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#2cb1bc]" />
            <span className="font-semibold text-[#1e3a5f] text-[15px]">Email Us</span>
          </div>
        </button>
      </motion.div>
    </div>
  );
}
