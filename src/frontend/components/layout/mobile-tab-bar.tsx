"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Users, BarChart3, ShieldAlert, Globe, HeartHandshake, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/activities", label: "Discover", icon: Compass },
  { href: "/communities", label: "Communities", icon: Globe },
  { href: "/friends", label: "Friends", icon: HeartHandshake },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/report", label: "Report", icon: BarChart3 },
  { href: "/sos", label: "SOS", icon: ShieldAlert, isRed: true },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-gray-100 bg-white md:hidden px-2 rounded-t-[32px] shadow-[0_-4px_20px_rgba(30,58,95,0.05)] pb-[env(safe-area-inset-bottom,0px)]"
      style={{ minHeight: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.href);
        
        if (tab.isRed) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center bg-[#e73b3b] text-white w-14 h-14 rounded-full shadow-md shadow-red-500/20 -mt-2 transition-transform hover:scale-105 active:scale-95"
            >
              <tab.icon className="h-6 w-6" />
              <span className="text-[10px] font-bold mt-0.5">{tab.label}</span>
            </Link>
          );
        }
        
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-14 h-14 transition-colors",
              isActive ? "text-[#2cb1bc]" : "text-[#1e3a5f]/40 hover:text-[#1e3a5f]/80"
            )}
          >
            <tab.icon className={cn("h-6 w-6", isActive ? "fill-current" : "")} />
            <span className="text-[10px] font-bold">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

