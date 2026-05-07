"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Calendar, MapPin, ArrowLeft, Info, MessageCircle, Star, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: group, isLoading } = useQuery<any>({
    queryKey: ["groups", "detail", id],
    queryFn: () => apiFetch(`/groups/${id}`),
  });

  if (isLoading) return <div className="h-80 bg-gray-100 animate-pulse rounded-[32px] mt-4" />;
  if (!group) return <div className="p-8 text-center text-gray-500">Group not found</div>;

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#2cb1bc] font-semibold text-sm hover:opacity-80">
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </button>
        <button className="text-[#1e3a5f]/40 hover:text-[#1e3a5f]">
          <Info className="w-5 h-5" />
        </button>
      </div>

      <div className="px-1 space-y-8 mb-12">
        {/* Title & Details */}
        <div>
          <h1 className="text-[28px] font-bold text-[#1e3a5f] leading-tight mb-4">{group.activity_title || "Your Group"}</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-2.5 text-[#1e3a5f]/70 text-sm font-medium">
              <Calendar className="w-4 h-4 text-[#2cb1bc]" />
              <span>
                {group.activity_scheduled_at
                  ? format(new Date(group.activity_scheduled_at), "E, d MMM • h:mm a")
                  : "TBD"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-[#1e3a5f]/70 text-sm font-medium">
              <MapPin className="w-4 h-4 text-[#2cb1bc]" />
              <span>{group.activity_area || "Bengaluru"}</span>
            </div>
          </div>
        </div>

        {/* Match Score & Shield */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-white rounded-2xl p-4 border border-green-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#34c759]">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#34c759]">{group.match_score?.toFixed(0) || 90}% Match Score</h3>
              <p className="text-[12px] font-medium text-[#1e3a5f]/50">Based on your shared interests.</p>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 border border-blue-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#1e3a5f]">Phone-Free Group</h3>
              <p className="text-[12px] font-medium text-[#1e3a5f]/50">Zero distractions allowed.</p>
            </div>
          </div>
        </div>

        {/* Wander Host */}
        <div>
          <h2 className="text-[18px] font-bold text-[#1e3a5f] mb-4">Wander Host</h2>
          {group.host_name ? (
            <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-white text-xl font-bold">
                <img src={`https://i.pravatar.cc/150?u=host-${group.host_name}`} alt={group.host_name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="text-[16px] font-bold text-[#1e3a5f]">{group.host_name}</h4>
                <p className="text-[13px] font-medium text-[#1e3a5f]/60">Verified Host • 14 activities led</p>
              </div>
              <div className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border border-amber-200">
                Host
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#1e3a5f]/50 italic bg-gray-50 p-4 rounded-xl border border-gray-100">Pending host assignment.</p>
          )}
        </div>

        {/* Group Members */}
        <div>
          <h2 className="text-[18px] font-bold text-[#1e3a5f] mb-4 flex items-center justify-between">
            Group Members
            <span className="text-[13px] font-medium text-[#1e3a5f]/50 bg-gray-100 px-2.5 py-1 rounded-full">{group.members?.length || 0} People</span>
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {group.members?.map((m: any, idx: number) => {
              const isLast = idx === group.members.length - 1;
              return (
                <div key={m.id} className={`p-4 flex items-center gap-4 ${!isLast ? 'border-b border-gray-50' : ''} hover:bg-gray-50 transition-colors`}>
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${m.id}`} alt={m.name || ""} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[15px] font-bold text-[#1e3a5f]">{m.name}</h4>
                  </div>
                  {m.role === 'host' && (
                    <div className="bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-amber-100">
                      Host
                    </div>
                  )}
                  {m.role !== 'host' && idx === 1 && (
                    <div className="bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-purple-100">
                      Newbie
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        className="w-full bg-[#2cb1bc] hover:bg-[#209ba5] text-white rounded-2xl py-4 font-bold text-[15px] flex justify-center items-center gap-3 transition-colors shadow-md shadow-[#2cb1bc]/20 mb-8"
        onClick={() => router.push(`/groups/${id}/chat`)}
      >
        <MessageCircle className="w-5 h-5" />
        Open Group Chat
      </button>
    </div>
  );
}

