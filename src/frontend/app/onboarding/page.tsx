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
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b px-4 py-3">
        <h1 className="text-lg font-semibold text-center">Profile Setup</h1>
        <p className="text-xs text-muted-foreground text-center">3 questions to get started</p>
      </header>
      <div className="flex-1 py-6">
        <OnboardingForm />
      </div>
    </div>
  );
}
