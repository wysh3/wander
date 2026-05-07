"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Switch } from "@/components/ui/switch";
import { Lock, Globe, ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

interface PrivacyState {
  profile_visibility: "public" | "private";
  show_full_name: boolean;
  show_interests: boolean;
  show_location: boolean;
}

export default function PrivacySettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["profile", user?.id],
    queryFn: () => apiFetch("/users/me"),
  });

  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [showFullName, setShowFullName] = useState(true);
  const [showInterests, setShowInterests] = useState(true);
  const [showLocation, setShowLocation] = useState(true);

  // Initialize form state from profile data
  useEffect(() => {
    if (profile) {
      setVisibility(profile.profile_visibility || "public");
      setShowFullName(profile.show_full_name ?? true);
      setShowInterests(profile.show_interests ?? true);
      setShowLocation(profile.show_location ?? true);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (data: PrivacyState) =>
      apiFetch("/users/me/privacy", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Privacy settings updated", {
        icon: <Check className="w-4 h-4" />,
      });
    },
    onError: () => {
      toast.error("Failed to save privacy settings");
    },
  });

  const handleSave = () => {
    const data: PrivacyState = visibility === "public"
      ? { profile_visibility: "public", show_full_name: true, show_interests: true, show_location: true }
      : { profile_visibility: "private", show_full_name: showFullName, show_interests: showInterests, show_location: showLocation };
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse mb-6" />
        <div className="h-60 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const userName = profile?.name || "User";
  const firstName = userName.split(" ")[0];
  const lastNameInitial = userName.split(" ")[1] ? userName.split(" ")[1][0] + "." : "";

  return (
    <div className="max-w-lg mx-auto pb-24 pt-2">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1e3a5f]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Privacy Settings</h1>
          <p className="text-sm text-[#1e3a5f]/50 font-medium">Control what others can see about you</p>
        </div>
      </div>

      {/* Visibility Mode Cards */}
      <h2 className="text-sm font-bold text-[#1e3a5f]/40 uppercase tracking-widest mb-3">Profile Visibility</h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => setVisibility("public")}
          className={`rounded-2xl border-2 p-5 text-left transition-all ${
            visibility === "public"
              ? "border-[#2cb1bc] bg-[#eaf4f4] shadow-sm"
              : "border-gray-100 bg-white hover:border-gray-200"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            visibility === "public" ? "bg-[#2cb1bc] text-white" : "bg-gray-100 text-[#1e3a5f]/40"
          }`}>
            <Globe className="w-5 h-5" />
          </div>
          <h3 className={`text-[15px] font-bold ${visibility === "public" ? "text-[#2cb1bc]" : "text-[#1e3a5f]"}`}>
            Public
          </h3>
          <p className="text-[12px] font-medium text-[#1e3a5f]/50 mt-1 leading-relaxed">
            Everyone can see your name, interests & area
          </p>
        </button>

        <button
          onClick={() => setVisibility("private")}
          className={`rounded-2xl border-2 p-5 text-left transition-all ${
            visibility === "private"
              ? "border-[#9244c7] bg-purple-50/50 shadow-sm"
              : "border-gray-100 bg-white hover:border-gray-200"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            visibility === "private" ? "bg-[#9244c7] text-white" : "bg-gray-100 text-[#1e3a5f]/40"
          }`}>
            <Lock className="w-5 h-5" />
          </div>
          <h3 className={`text-[15px] font-bold ${visibility === "private" ? "text-[#9244c7]" : "text-[#1e3a5f]"}`}>
            Private
          </h3>
          <p className="text-[12px] font-medium text-[#1e3a5f]/50 mt-1 leading-relaxed">
            You control what others can see
          </p>
        </button>
      </div>

      {/* Toggles */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <h4 className={`text-[15px] font-bold ${visibility === "private" ? "text-[#1e3a5f]" : "text-[#1e3a5f]/40"}`}>
                Show full name
              </h4>
              <p className="text-[13px] font-medium text-[#1e3a5f]/50 mt-0.5">
                Others see: {showFullName ? userName : firstName + " " + lastNameInitial}
              </p>
            </div>
            <Switch
              checked={visibility === "private" ? showFullName : true}
              onCheckedChange={setShowFullName}
              disabled={visibility === "public"}
            />
          </div>
        </div>

        <div className="p-5 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <h4 className={`text-[15px] font-bold ${visibility === "private" ? "text-[#1e3a5f]" : "text-[#1e3a5f]/40"}`}>
                Show interests
              </h4>
              <p className="text-[13px] font-medium text-[#1e3a5f]/50 mt-0.5">
                Others see your interest tags on your profile
              </p>
            </div>
            <Switch
              checked={visibility === "private" ? showInterests : true}
              onCheckedChange={setShowInterests}
              disabled={visibility === "public"}
            />
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <h4 className={`text-[15px] font-bold ${visibility === "private" ? "text-[#1e3a5f]" : "text-[#1e3a5f]/40"}`}>
                Show location area
              </h4>
              <p className="text-[13px] font-medium text-[#1e3a5f]/50 mt-0.5">
                Others see your neighbourhood e.g. Koramangala
              </p>
            </div>
            <Switch
              checked={visibility === "private" ? showLocation : true}
              onCheckedChange={setShowLocation}
              disabled={visibility === "public"}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        className="mt-8 w-full bg-[#2cb1bc] hover:bg-[#209ba5] disabled:bg-[#2cb1bc]/50 text-white rounded-2xl py-4 font-bold text-[15px] flex items-center justify-center gap-2 transition-colors shadow-md shadow-[#2cb1bc]/20"
      >
        {saveMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Privacy Settings"
        )}
      </button>
    </div>
  );
}
