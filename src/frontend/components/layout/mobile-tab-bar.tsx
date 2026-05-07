"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Users, BarChart3, Siren, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/activities", label: "Discover", icon: Compass },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/report", label: "Report", icon: BarChart3 },
  { href: "/sos", label: "SOS", icon: Siren },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background safe-bottom md:hidden">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center gap-0.5 text-xs font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
