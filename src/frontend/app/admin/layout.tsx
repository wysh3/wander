"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarPlus, Users, UserCheck, ShieldAlert,
  Settings, Bell, FileText, ChevronLeft, LogOut, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect, useState } from "react";

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: CalendarPlus },
  { href: "/admin/events/generate", label: "Generate", icon: Sparkles },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/hosts", label: "Hosts", icon: UserCheck },
  { href: "/admin/moderation", label: "Moderation", icon: ShieldAlert },
  { href: "/admin/config", label: "Config", icon: Settings },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/report", label: "Platform Report", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.verification_status === "verified" || true; // TODO: check role in token

  useEffect(() => {
    if (!user) {
      router.push("/signup");
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 bg-[#1e3a5f] text-white flex flex-col transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {!collapsed && (
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-wander-teal flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm">Admin Panel</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-white/10"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {adminNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-wander-teal/20 text-wander-teal"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/activities"
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white text-sm mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {!collapsed && <span>Back to App</span>}
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-white/40 hover:text-red-400 text-sm w-full"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("flex-1 transition-all duration-200", collapsed ? "ml-16" : "ml-64")}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-16 flex items-center px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold">
              ADMIN MODE
            </span>
            <div className="w-8 h-8 rounded-full bg-wander-teal flex items-center justify-center text-white text-sm font-bold">
              {user.name?.[0] || "A"}
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
