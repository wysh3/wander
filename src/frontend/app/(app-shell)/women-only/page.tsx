"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Lock, Users, ArrowRight, CheckCircle2, XCircle, MapPin, Calendar, Clock, User } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export default function WomenOnlyPage() {
  const { user } = useAuthStore();
  const [verificationState, setVerificationState] = useState<"idle" | "verifying" | "success" | "denied">("idle");

  // Fetch full profile to get gender if available
  const { data: profile } = useQuery<any>({
    queryKey: ["profile", user?.id],
    queryFn: () => apiFetch(`/users/${user?.id}`),
    enabled: !!user?.id,
  });

  const handleVerify = () => {
    setVerificationState("verifying");
    
    // Simulate API call to digilocker/aadhar
    setTimeout(() => {
      // For demo purposes, we'll allow access if gender is female or not explicitly set to male
      const isFemale = profile?.gender?.toLowerCase() !== "male";
      setVerificationState(isFemale ? "success" : "denied");
    }, 2000);
  };

  const dummyEvents = [
    {
      id: 1,
      title: "Women's Pottery Workshop",
      location: "Indiranagar, Bangalore",
      date: "Tomorrow, 4:00 PM",
      attendees: 12,
      max: 15,
      image: "bg-rose-100",
      tag: "Art & Craft"
    },
    {
      id: 2,
      title: "Cubbon Park Morning Walk",
      location: "Cubbon Park",
      date: "Saturday, 6:30 AM",
      attendees: 24,
      max: 30,
      image: "bg-green-100",
      tag: "Wellness"
    },
    {
      id: 3,
      title: "Networking Cafe Mixer",
      location: "Koramangala",
      date: "Sunday, 5:00 PM",
      attendees: 18,
      max: 20,
      image: "bg-purple-100",
      tag: "Social"
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 pt-4 px-4">
      
      {verificationState === "idle" && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] p-8 text-center border border-purple-100 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-50 to-transparent -z-10" />
          
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-purple-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-4">Women-Only Mode</h1>
          <p className="text-[#1e3a5f]/70 mb-8 leading-relaxed max-w-md mx-auto">
            A safe, verified space exclusively for women. Join events, find companions, and explore the city with complete peace of mind.
          </p>

          <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left border border-gray-100 flex gap-4 items-start">
            <ShieldCheck className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#1e3a5f] text-sm">Verification Required</h3>
              <p className="text-xs text-[#1e3a5f]/60 mt-1">
                To maintain the integrity of this space, we require a one-time gender verification using your official ID.
              </p>
            </div>
          </div>

          <button 
            onClick={handleVerify}
            className="w-full bg-purple-500 text-white font-bold py-4 rounded-2xl hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/20"
          >
            Proceed to Verification
          </button>
        </motion.div>
      )}

      {verificationState === "verifying" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[40px] p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]"
        >
          <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-500 rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-bold text-[#1e3a5f] mb-2">Verifying Identity</h2>
          <p className="text-[#1e3a5f]/60">Checking Digilocker / Aadhaar records...</p>
        </motion.div>
      )}

      {verificationState === "denied" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[40px] p-12 text-center border border-red-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]"
        >
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1e3a5f] mb-2">Access Denied</h2>
          <p className="text-[#1e3a5f]/60 max-w-sm mb-8">
            Our records indicate you do not meet the criteria for the Women-Only space. If you believe this is an error, please contact support.
          </p>
          <button 
            onClick={() => setVerificationState("idle")}
            className="px-8 py-3 bg-gray-100 text-[#1e3a5f] font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      )}

      {verificationState === "success" && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-[32px] p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-200" />
                  <span className="font-bold text-purple-100 tracking-wide text-sm uppercase">Verified</span>
                </div>
                <h2 className="text-3xl font-black mb-2">Women-Only Mode</h2>
                <p className="text-purple-100 max-w-md">Discover curated events and experiences tailored to your interests, exclusively with other verified women.</p>
              </div>
              <div className="hidden md:flex w-16 h-16 bg-white/20 rounded-full items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-lg text-[#1e3a5f]">Recommended for You</h3>
            <span className="text-sm font-semibold text-purple-500 cursor-pointer hover:underline">View All</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dummyEvents.map(event => (
              <div key={event.id} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className={"w-12 h-12 rounded-xl flex items-center justify-center " + event.image}>
                    <Users className="w-6 h-6 text-purple-600 opacity-50" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                    {event.tag}
                  </span>
                </div>
                
                <h4 className="font-bold text-[16px] text-[#1e3a5f] mb-3 group-hover:text-purple-600 transition-colors">{event.title}</h4>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-[#1e3a5f]/60">
                    <Calendar className="w-4 h-4 text-[#1e3a5f]/40" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-medium text-[#1e3a5f]/60">
                    <MapPin className="w-4 h-4 text-[#1e3a5f]/40" />
                    {event.location}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center">
                          <User className="w-3 h-3 text-purple-400" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-[#1e3a5f]/50">
                      {event.attendees}/{event.max} joined
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Demo Disclaimer */}
      <div className="text-center mt-12 pb-8">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
          * Digilocker / Aadhaar verification is simulated for demo purposes
        </p>
      </div>

    </div>
  );
}
