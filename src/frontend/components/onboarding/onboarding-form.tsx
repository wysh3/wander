"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mountain, Palette, Users, Dumbbell, BookOpen, UtensilsCrossed,
  Zap, Wind, CircleDot, Calendar, Clock, Sun, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

type Step = "interests" | "energy" | "availability";

interface Interest {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const INTERESTS: Interest[] = [
  { id: "outdoors", label: "Outdoors", icon: <Mountain className="h-5 w-5" /> },
  { id: "creative", label: "Creative", icon: <Palette className="h-5 w-5" /> },
  { id: "social", label: "Social", icon: <Users className="h-5 w-5" /> },
  { id: "fitness", label: "Fitness", icon: <Dumbbell className="h-5 w-5" /> },
  { id: "learning", label: "Learning", icon: <BookOpen className="h-5 w-5" /> },
  { id: "food_drink", label: "Food & Drink", icon: <UtensilsCrossed className="h-5 w-5" /> },
];

const ENERGIES = [
  { id: "high", label: "High Energy", description: "Always moving, love action", icon: <Zap className="h-6 w-6" /> },
  { id: "balanced", label: "Balanced", description: "Up for anything in moderation", icon: <CircleDot className="h-6 w-6" /> },
  { id: "chill", label: "Chill", description: "Relaxed, go with the flow", icon: <Wind className="h-6 w-6" /> },
];

const AVAILABILITY = [
  { id: "weekends", label: "Weekends", icon: <Calendar className="h-4 w-4" /> },
  { id: "weekday_evenings", label: "Weekday Evenings", icon: <Sun className="h-4 w-4" /> },
  { id: "weekday_mornings", label: "Weekday Mornings", icon: <Sun className="h-4 w-4" /> },
  { id: "afternoons", label: "Afternoons", icon: <Clock className="h-4 w-4" /> },
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
      : availability.length > 0;

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto px-4">
      {/* Progress */}
      <div className="flex gap-1 py-4">
        {(["interests", "energy", "availability"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              (step === "interests" && i === 0) ||
              (step === "energy" && i <= 1) ||
              (step === "availability" && i <= 2)
                ? "bg-wander-teal"
                : "bg-muted"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 flex flex-col"
        >
          {/* Step: Interests */}
          {step === "interests" && (
            <>
              <h2 className="text-xl font-semibold mb-1">What do you enjoy?</h2>
              <p className="text-sm text-muted-foreground mb-6">Pick at least one</p>
              <div className="grid grid-cols-2 gap-3">
                {INTERESTS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleInterest(item.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      interests.includes(item.id)
                        ? "border-wander-teal bg-wander-teal/10 text-wander-teal"
                        : "border-muted hover:border-wander-teal/40"
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step: Energy */}
          {step === "energy" && (
            <>
              <h2 className="text-xl font-semibold mb-1">Your energy level?</h2>
              <p className="text-sm text-muted-foreground mb-6">Pick the one that fits best</p>
              <div className="space-y-3">
                {ENERGIES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setEnergy(item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      energy === item.id
                        ? "border-wander-teal bg-wander-teal/10 text-wander-teal"
                        : "border-muted hover:border-wander-teal/40"
                    }`}
                  >
                    <div className={`p-2 rounded-full ${energy === item.id ? "bg-wander-teal/20" : "bg-muted"}`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step: Availability */}
          {step === "availability" && (
            <>
              <h2 className="text-xl font-semibold mb-1">When are you free?</h2>
              <p className="text-sm text-muted-foreground mb-6">Pick all that work</p>
              <div className="space-y-3">
                {AVAILABILITY.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleAvailability(item.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      availability.includes(item.id)
                        ? "border-wander-teal bg-wander-teal/10 text-wander-teal"
                        : "border-muted hover:border-wander-teal/40"
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom buttons */}
      <div className="py-4 flex gap-3">
        {step !== "interests" && (
          <Button
            variant="outline"
            onClick={() =>
              setStep(step === "energy" ? "interests" : "energy")
            }
            className="flex-1"
          >
            Back
          </Button>
        )}
        <Button
          className="flex-1"
          disabled={!canNext || loading}
          onClick={() => {
            if (step === "interests") setStep("energy");
            else if (step === "energy") setStep("availability");
            else handleComplete();
          }}
        >
          {loading ? "Saving..." : step === "availability" ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
