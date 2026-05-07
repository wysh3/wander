"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Users, BarChart3, ShieldAlert, Globe, HeartHandshake, Sparkles, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/activities", label: "Discover", icon: Compass },
  { href: "/communities", label: "Communities", icon: Globe },
  { href: "/friends", label: "Friend Match", icon: HeartHandshake },
  { href: "/groups", label: "My Groups", icon: Users },
  { href: "/matching", label: "Matching Engine", icon: Sparkles },
  { href: "/report", label: "Report", icon: BarChart3 },
  { href: "/sos", label: "Emergency", icon: ShieldAlert },
  { href: "/host/dashboard", label: "Host", icon: User },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-[256px] md:flex-col md:border-r border-gray-100 md:bg-white md:h-screen fixed left-0 top-0 bottom-0 z-40 overflow-y-auto">
      {/* Logo */}
      <div className="flex flex-col h-24 justify-center px-8 border-b border-gray-50 mb-4 pt-6">
        <Link href="/" className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#28a8b5]">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm.3 9.7l-.3.3-.3-.3C10.2 10.3 9 9.2 9 7.8 9 6.6 9.9 5.7 11.1 5.7c.7 0 1.4.3 1.8.8.4-.5 1.1-.8 1.8-.8 1.2 0 2.1.9 2.1 2.1 0 1.4-1.2 2.5-2.7 3.9z" />
          </svg>
          <span className="text-2xl font-bold text-[#1e3a5f] tracking-tight">wander</span>
        </Link>
        <span className="text-[11px] font-bold text-[#2cb1bc] ml-10 -mt-1 tracking-wide">Go outside.</span>
      </div>
      
      {/* Nav Items */}
      <nav className="flex-1 space-y-2 px-4 py-2">
        {navItems.map((item) => {
          // Special case: if pathname is not matching but it's the matching engine active state in mockup 9
          const isActive = pathname.includes(item.href) || (item.href === '/matching' && pathname.includes('/matching'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all",
                isActive
                  ? "bg-[#eaf4f4] text-[#2cb1bc]"
                  : "text-[#1e3a5f]/70 hover:bg-gray-50 hover:text-[#1e3a5f]"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-[#2cb1bc]" : "text-[#1e3a5f]/50")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 pb-6 space-y-4">
        {/* User Profile */}
        <Link href="/profile" className="flex items-center justify-between p-2 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#1e3a5f]/40 group-hover:text-[#2cb1bc] transition-colors">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1e3a5f]">User</p>
              <p className="text-xs text-[#1e3a5f]/60 font-medium">View profile</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#1e3a5f]/20 group-hover:text-[#2cb1bc] transition-all" />
        </Link>

        {/* Bottom Graphic */}
        <div className="bg-[#f4f7f8] rounded-2xl p-5 pt-6 pb-12 relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <p className="text-[13px] font-bold text-[#1e3a5f]/80">Step out.</p>
            <p className="text-[13px] font-bold text-[#1e3a5f]/80">Feel alive.</p>
            <p className="text-[13px] font-bold text-[#1e3a5f]/80">Make real<br/>connections.</p>
          </div>
          <div className="absolute bottom-0 right-0 left-0 opacity-40">
            <svg width="100%" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M160 60V20L170 35L180 15L190 35L200 20V60H160Z" fill="#2cb1bc"/>
              <path d="M120 60V30L135 45L150 25L165 45L180 30V60H120Z" fill="#2cb1bc"/>
              <path d="M80 60V10L100 30L120 5L140 30L160 10V60H80Z" fill="#1e3a5f"/>
              <path d="M0 60V20L20 40L40 10L60 40L80 20V60H0Z" fill="#2cb1bc"/>
            </svg>
          </div>
        </div>
      </div>
    </aside>
  );
}

