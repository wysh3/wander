"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mountain, Palette, Users, Dumbbell, BookOpen, Coffee,
  Zap, Scale, Leaf, Calendar, Clock, Sun, Sunrise,
  User, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, Circle
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { LocationPermission } from "@/components/location/location-permission";

type Step = "interests" | "energy" | "availability" | "location";

interface Interest {
  id: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
}

const INTERESTS: Interest[] = [
  { id: "outdoors", label: "Outdoors", icon: <Mountain className="h-6 w-6" />, colorClass: "text-emerald-500 bg-emerald-50" },
  { id: "creative", label: "Creative", icon: <Palette className="h-6 w-6" />, colorClass: "text-purple-500 bg-purple-50" },
  { id: "social", label: "Social", icon: <Users className="h-6 w-6" />, colorClass: "text-amber-500 bg-amber-50" },
  { id: "fitness", label: "Fitness", icon: <Dumbbell className="h-6 w-6" />, colorClass: "text-rose-500 bg-rose-50" },
  { id: "learning", label: "Learning", icon: <BookOpen className="h-6 w-6" />, colorClass: "text-blue-500 bg-blue-50" },
  { id: "food_drink", label: "Food & Drink", icon: <Coffee className="h-6 w-6" />, colorClass: "text-teal-500 bg-teal-50" },
];

const ENERGIES = [
  { id: "high", label: "High Energy", description: "Always moving, love active and fast-paced plans.", icon: <Zap className="h-6 w-6" />, colorClass: "text-amber-500 bg-amber-50" },
  { id: "balanced", label: "Balanced", description: "Up for anything, enjoy a mix of chill and adventure.", icon: <Scale className="h-6 w-6" />, colorClass: "text-teal-500 bg-teal-50" },
  { id: "chill", label: "Chill", description: "Prefer relaxed vibes and easygoing experiences.", icon: <Leaf className="h-6 w-6" />, colorClass: "text-purple-500 bg-purple-50" },
];

const AVAILABILITY = [
  { id: "weekends", label: "Weekends", sub: "", icon: <Calendar className="h-5 w-5" />, colorClass: "text-teal-500 bg-teal-50" },
  { id: "weekday_evenings", label: "Weekday Evenings", sub: "(5 PM – 10 PM)", icon: <Clock className="h-5 w-5" />, colorClass: "text-purple-500 bg-purple-50" },
  { id: "weekday_mornings", label: "Weekday Mornings", sub: "(6 AM – 12 PM)", icon: <Sunrise className="h-5 w-5" />, colorClass: "text-amber-500 bg-amber-50" },
  { id: "afternoons", label: "Afternoons", sub: "(12 PM – 5 PM)", icon: <Sun className="h-5 w-5" />, colorClass: "text-emerald-500 bg-emerald-50" },
];

export function OnboardingForm() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState<Step>("interests");
  const [interests, setInterests] = useState<string[]>([]);
  const [energy, setEnergy] = useState("");
  const [availability, setAvailability] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAvailability = (id: string) => {
    setAvailability((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>("/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({ interests, energy, availability }),
      });
      const me = await apiFetch<any>("/users/me");
      setUser(me);
      router.push("/activities");
    } catch {
      setLoading(false);
    }
  };

  const canNext = step === "interests"
    ? interests.length > 0
    : step === "energy"
      ? !!energy
      : step === "availability"
        ? availability.length > 0
        : true; // location is optional

  const stepIndex = step === "interests" ? 1 : step === "energy" ? 2 : 3;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header inside card */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full border border-teal-100 bg-teal-50/50 flex items-center justify-center text-[#2cb1bc]">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1e3a5f]">Profile Setup</h2>
          <p className="text-[#1e3a5f]/60 text-sm">4 questions to get started</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="relative flex items-center justify-between px-2 mb-2">
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-[#eaf4f4] rounded-full z-0"></div>
          <div 
            className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-[#2cb1bc] rounded-full z-0 transition-all duration-500"
            style={{ width: stepIndex === 1 ? '0%' : stepIndex === 2 ? '33%' : stepIndex === 3 ? '66%' : '100%' }}
          ></div>
          
          {[1, 2, 3, 4].map((num) => (
            <div 
              key={num} 
              className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                num <= stepIndex ? "bg-[#2cb1bc] text-white" : "bg-[#eaf4f4] text-[#1e3a5f]/40"
              }`}
            >
              {num}
            </div>
          ))}
        </div>
        <p className="text-center text-[#2cb1bc] text-xs font-bold">Step {stepIndex} of 4</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col"
        >
          {/* Step 1: Interests */}
          {step === "interests" && (
            <div className="flex flex-col items-center">
              <h2 className="text-[22px] font-bold text-[#1e3a5f] mb-1 text-center">What are you interested in?</h2>
              <p className="text-[13px] text-[#1e3a5f]/60 mb-6 text-center">Select all that apply to help us find your vibe.</p>
              
              <div className="grid grid-cols-2 gap-3 w-full mb-6">
                {INTERESTS.map((item) => {
                  const isSelected = interests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleInterest(item.id)}
                      className={`relative flex flex-col items-center justify-center p-4 h-28 rounded-2xl border transition-all ${
                        isSelected
                          ? "border-[#2cb1bc] bg-white shadow-[0_2px_10px_rgba(44,177,188,0.15)]"
                          : "border-gray-100 bg-white hover:border-[#2cb1bc]/40 shadow-sm"
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-[#2cb1bc] fill-[#2cb1bc] text-white" />
                      ) : (
                        <Circle className="absolute top-2 right-2 w-5 h-5 text-gray-200" />
                      )}
                      
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${item.colorClass}`}>
                        {item.icon}
                      </div>
                      <span className="font-semibold text-[#1e3a5f] text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Energy */}
          {step === "energy" && (
            <div className="flex flex-col items-center">
              <h2 className="text-[22px] font-bold text-[#1e3a5f] mb-1 text-center">How would you describe your energy?</h2>
              <p className="text-[13px] text-[#1e3a5f]/60 mb-6 text-center">This helps us match you with the right people and activities.</p>
              
              <div className="space-y-3 w-full mb-6">
                {ENERGIES.map((item) => {
                  const isSelected = energy === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setEnergy(item.id)}
                      className={`relative w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? "border-[#2cb1bc] bg-white shadow-[0_2px_10px_rgba(44,177,188,0.15)]"
                          : "border-gray-100 bg-white hover:border-[#2cb1bc]/40 shadow-sm"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${item.colorClass}`}>
                        {item.icon}
                      </div>
                      <div className="text-left pr-6">
                        <p className="font-bold text-[#1e3a5f] text-base">{item.label}</p>
                        <p className="text-[13px] text-[#1e3a5f]/60 leading-tight mt-0.5">{item.description}</p>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {isSelected ? (
                          <CheckCircle2 className="w-6 h-6 text-[#2cb1bc] fill-[#2cb1bc] text-white" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-200" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Availability */}
          {step === "availability" && (
            <div className="flex flex-col items-center">
              <h2 className="text-[22px] font-bold text-[#1e3a5f] mb-1 text-center">When are you usually free?</h2>
              <p className="text-[13px] text-[#1e3a5f]/60 mb-6 text-center">Select all that apply so we can plan better experiences.</p>
              
              <div className="grid grid-cols-2 gap-3 w-full mb-6">
                {AVAILABILITY.map((item) => {
                  const isSelected = availability.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleAvailability(item.id)}
                      className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all min-h-[88px] ${
                        isSelected
                          ? "border-[#2cb1bc] bg-white shadow-[0_2px_10px_rgba(44,177,188,0.15)]"
                          : "border-gray-100 bg-white hover:border-[#2cb1bc]/40 shadow-sm"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.colorClass}`}>
                        {item.icon}
                      </div>
                      <div className="text-left pr-6">
                        <p className="font-bold text-[#1e3a5f] text-sm leading-tight">{item.label}</p>
                        {item.sub && <p className="text-[11px] text-[#1e3a5f]/50 mt-0.5">{item.sub}</p>}
                      </div>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-[#2cb1bc] fill-[#2cb1bc] text-white" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-200" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-4 w-full">
                <Leaf className="w-4 h-4 text-[#2cb1bc]" />
                <span className="text-xs text-[#1e3a5f]/60">You can always update this later in your profile.</span>
              </div>
            </div>
          )}

          {/* Step: Location */}
          {step === "location" && (
            <LocationPermission onComplete={() => handleComplete()} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom buttons */}
      <div className="flex gap-3 mb-6 w-full">
        {step !== "interests" && (
          <button
            onClick={() => {
              if (step === "energy") setStep("interests");
              else if (step === "availability") setStep("energy");
              else if (step === "location") setStep("availability");
            }}
            className="flex-1 border border-[#2cb1bc] text-[#2cb1bc] bg-white hover:bg-[#eaf4f4] rounded-xl py-4 font-semibold text-base flex justify-center items-center gap-2 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <button
          className="flex-[2] bg-gradient-to-r from-[#2cb1bc] to-[#209ba5] hover:opacity-90 text-white rounded-xl py-4 font-semibold text-base flex justify-center items-center gap-2 transition-all shadow-md shadow-[#2cb1bc]/20 disabled:opacity-50"
          disabled={!canNext || loading}
          onClick={() => {
            if (step === "interests") setStep("energy");
            else if (step === "energy") setStep("availability");
            else if (step === "availability") setStep("location");
            else handleComplete();
          }}
        >
          {loading ? "Saving..." : step === "location" ? "Finish" : "Next"}
          {!loading && step !== "location" && <ArrowRight className="w-5 h-5" />}
          {!loading && step === "location" && <CheckCircle2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[#1e3a5f]/60 text-xs font-medium pb-2">
        <ShieldCheck className="w-4 h-4 text-[#28a8b5]" />
        <span>We keep your data safe and private.</span>
      </div>
    </div>
  );
}

