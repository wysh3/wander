"use client";

import { Lock } from "lucide-react";

interface MemberCardProps {
  id: string;
  name: string | null;
  interests?: string[] | null;
  homeArea?: string | null;
  role?: string;
  showRole?: boolean;
  showInterests?: boolean;
  showLocation?: boolean;
  className?: string;
}

/**
 * Reusable card for displaying a group/community member.
 * Handles privacy-masked data from the API:
 * - Names ending with " X." (initial) show a lock badge
 * - Empty interests array shows "Interests hidden"
 * - Null home_area shows "Location private"
 */
export function MemberCard({
  id,
  name,
  interests,
  homeArea,
  role,
  showRole = true,
  showInterests = false,
  showLocation = false,
  className = "",
}: MemberCardProps) {
  const isNameMasked =
    typeof name === "string" && /\s[A-Z]\.$/.test(name);

  return (
    <div
      className={`flex items-center gap-3 py-3 px-1 ${className}`}
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
        <img
          src={`https://i.pravatar.cc/150?u=${id}`}
          alt={name || ""}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-[#1e3a5f] truncate">
            {name || "User"}
          </span>
          {isNameMasked && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
              <Lock className="w-2.5 h-2.5" />
              Private
            </span>
          )}
          {showRole && role && role !== "member" && (
            <span
              className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border shrink-0 ${
                role === "host" || role === "founder"
                  ? "bg-amber-50 text-amber-600 border-amber-100"
                  : role === "admin"
                  ? "bg-blue-50 text-blue-600 border-blue-100"
                  : "bg-gray-50 text-gray-500 border-gray-100"
              }`}
            >
              {role}
            </span>
          )}
        </div>

        {/* Interests / Location hints for masked profiles */}
        {showInterests && (
          <p className="text-[11px] font-medium text-[#1e3a5f]/50 mt-0.5">
            {interests && interests.length > 0
              ? interests.slice(0, 3).join(", ")
              : "Interests hidden"}
          </p>
        )}
        {showLocation && (
          <p className="text-[11px] font-medium text-[#1e3a5f]/50 mt-0.5">
            {homeArea || "Location private"}
          </p>
        )}
      </div>
    </div>
  );
}
