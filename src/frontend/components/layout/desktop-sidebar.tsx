"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Users, BarChart3, Siren, UserCog, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/activities", label: "Discover", icon: Compass },
  { href: "/communities", label: "Communities", icon: Globe },
  { href: "/groups", label: "My Groups", icon: Users },
  { href: "/report", label: "Wander Report", icon: BarChart3 },
  { href: "/sos", label: "Emergency", icon: Siren },
  { href: "/host/dashboard", label: "Host", icon: UserCog },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-card md:h-screen">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="text-wander-teal">Wander</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
