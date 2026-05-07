"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { useAuthStore } from "@/stores/auth-store";

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/signup");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-start pt-20 px-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'linear-gradient(to bottom, rgba(234, 244, 244, 0.8), rgba(204, 227, 227, 0.4)), url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop")' }}
    >
      {/* Logo and Header */}
      <div className="flex flex-col items-center mb-6 z-10">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-[#28a8b5] mb-2 drop-shadow-sm">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm.3 9.7l-.3.3-.3-.3C10.2 10.3 9 9.2 9 7.8 9 6.6 9.9 5.7 11.1 5.7c.7 0 1.4.3 1.8.8.4-.5 1.1-.8 1.8-.8 1.2 0 2.1.9 2.1 2.1 0 1.4-1.2 2.5-2.7 3.9z" />
        </svg>
        <h1 className="text-[40px] font-bold text-[#1e3a5f] tracking-tight leading-none mb-2">wander</h1>
        <p className="text-[#28a8b5] font-semibold text-base mb-3">Go outside.</p>
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-[32px] p-8 shadow-xl shadow-[#1e3a5f]/10 z-10 border border-white/50 backdrop-blur-sm relative mb-8">
        <OnboardingForm />
      </div>
    </div>
  );
}

