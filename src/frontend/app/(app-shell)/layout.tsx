"use client";

import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { SafeAreaTop } from "@/components/layout/safe-area-top";
import { SafeAreaBottom } from "@/components/layout/safe-area-bottom";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/signup");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      <SafeAreaTop />
      <DesktopSidebar />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="container py-6">{children}</div>
      </main>
      <MobileTabBar />
      <SafeAreaBottom />
    </div>
  );
}
