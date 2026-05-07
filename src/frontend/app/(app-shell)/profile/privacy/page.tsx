"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Sparkles, Check, X, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function PrivacyPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [womenOnlyMode, setWomenOnlyMode] = useState(false);

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["profile", user?.id],
    queryFn: () => apiFetch(`/users/${user?.id}`),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile && profile.women_only_mode !== undefined) {
      setWomenOnlyMode(profile.women_only_mode);
    }
  }, [profile]);

  const { mutate: updateMode, isPending } = useMutation({
    mutationFn: (mode: boolean) =>
      apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ women_only_mode: mode }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile", user?.id], data);
    },
  });

  const handleToggle = () => {
    const newMode = !womenOnlyMode;
    setWomenOnlyMode(newMode);
    updateMode(newMode);
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
        <h1 className="text-[22px] font-bold text-[#1e3a5f]">Privacy Settings</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm"
      >
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#1e3a5f]">Women-Only Mode</h2>
              <p className="text-[13px] text-[#1e3a5f]/60 mt-1 pr-4 leading-relaxed">
                When enabled, you will only be matched with other women and see activities hosted by women.
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleToggle}
            disabled={isPending}
            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${womenOnlyMode ? 'bg-purple-500' : 'bg-gray-200'} ${isPending ? 'opacity-50' : ''}`}
            role="switch"
            aria-checked={womenOnlyMode}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${womenOnlyMode ? 'translate-x-7' : 'translate-x-0'}`}
            >
              {womenOnlyMode ? (
                <Check className="w-3.5 h-3.5 text-purple-500" />
              ) : (
                <X className="w-3.5 h-3.5 text-gray-400" />
              )}
            </span>
          </button>
        </div>

        {womenOnlyMode && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-5 p-4 bg-purple-50 rounded-2xl flex gap-3 border border-purple-100"
          >
            <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] font-medium text-purple-900/80">
              Your profile is now strictly visible to verified female users. Groups you create will be marked as "Women Only".
            </p>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm"
      >
        <div className="flex gap-4 opacity-50 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-[#1e3a5f]">Incognito Mode</h2>
            <p className="text-[13px] text-[#1e3a5f]/60 mt-1 leading-relaxed">
              Hide your exact live location from other users until you accept their meet request.
            </p>
            <div className="mt-3 inline-block px-2 py-1 bg-gray-100 text-[10px] font-bold text-gray-500 uppercase rounded">Coming Soon</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}