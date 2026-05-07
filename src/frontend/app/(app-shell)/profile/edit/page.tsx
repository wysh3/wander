"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User as UserIcon, Mail, Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["profile", user?.id],
    queryFn: () => apiFetch(`/users/${user?.id}`),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
      });
    }
  }, [profile]);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: (data: typeof formData) =>
      apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      router.back();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
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
        <h1 className="text-[22px] font-bold text-[#1e3a5f]">Edit Profile</h1>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-5"
      >
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-[#1e3a5f]/60 uppercase tracking-wide ml-1">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-blue-500" />
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-[15px] font-medium text-[#1e3a5f] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              placeholder="Your name"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-[#1e3a5f]/60 uppercase tracking-wide ml-1">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-[15px] font-medium text-[#1e3a5f] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-blue-500 text-white rounded-2xl font-bold text-[16px] shadow-sm shadow-blue-500/20 hover:bg-blue-600 transition-colors disabled:opacity-70"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Changes
        </button>
      </motion.form>
    </div>
  );
}
