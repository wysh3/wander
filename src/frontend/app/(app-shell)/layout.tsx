"use client";

import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { useAuthStore } from "@/stores/auth-store";
import { useLocationSync } from "@/hooks/use-location-sync";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Start location tracking once authenticated
  useLocationSync({ enabled: isAuthenticated });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/signup");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-[#fcfcfc] font-sans">
      {/* Safe Area Top for Mobile */}
      <div className="safe-top bg-[#fcfcfc] md:hidden w-full fixed top-0 z-50"></div>
      
      <DesktopSidebar />
      <main className="flex-1 md:ml-[256px] pb-28 md:pb-0 min-h-screen overflow-x-hidden pt-[env(safe-area-inset-top,0px)] md:pt-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-10">{children}</div>
      </main>
      <MobileTabBar />
    </div>
  );
}


