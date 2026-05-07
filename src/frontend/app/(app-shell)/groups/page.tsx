"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ChevronRight, Calendar, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { format } from "date-fns";
import { getActivityImage } from "@/lib/images";

interface GroupItem {
  id: string;
  activity_title: string;
  activity_scheduled_at: string | null;
  activity_area: string | null;
  activity_category: string | null;
  status: string;
  match_score: number;
  members: { id: string; name: string | null }[];
  created_at: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    apiFetch<GroupItem[]>("/groups")
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-[#2cb1bc] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="text-center py-32 max-w-md mx-auto">
        <div className="w-20 h-20 bg-[#eaf4f4] rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="h-8 w-8 text-[#2cb1bc]" />
        </div>
        <h2 className="text-xl font-bold text-[#1e3a5f] mb-2">No groups yet</h2>
        <p className="text-[15px] text-[#1e3a5f]/60 leading-relaxed">
          Join an activity and run matching to create your first group.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold text-[#1e3a5f]">Groups</h1>
        <p className="text-[14px] text-[#1e3a5f]/60 mt-1 font-medium">Connections you've made.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-100 pb-px">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`pb-3 px-1 text-[15px] font-bold transition-colors border-b-2 ${
            activeTab === "upcoming" ? "text-[#2cb1bc] border-[#2cb1bc]" : "text-[#1e3a5f]/40 border-transparent hover:text-[#1e3a5f]/80"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`pb-3 px-1 text-[15px] font-bold transition-colors border-b-2 ${
            activeTab === "past" ? "text-[#2cb1bc] border-[#2cb1bc]" : "text-[#1e3a5f]/40 border-transparent hover:text-[#1e3a5f]/80"
          }`}
        >
          Past
        </button>
      </div>

      {/* Group List */}
      <div className="space-y-4 pt-2">
        {groups.map((group, i) => {
          const bgImage = getActivityImage(group.activity_title, group.activity_category);

          return (
            <button
              key={group.id}
              onClick={() => router.push(`/groups/${group.id}`)}
              className="w-full text-left bg-white rounded-2xl border border-gray-100 p-3 shadow-sm hover:shadow-md hover:border-[#2cb1bc]/30 transition-all flex gap-5 items-center relative overflow-hidden group"
            >
              <div 
                className="w-[120px] h-[120px] rounded-xl shrink-0 bg-gray-100 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url('${bgImage}')` }}
              />
              
              <div className="flex-1 py-1">
                {/* Status Badge */}
                <div className="absolute top-4 right-4 border border-[#34c759] text-[#34c759] bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
                  {activeTab === "upcoming" ? "Upcoming" : "Completed"}
                </div>

                <h4 className="font-bold text-[17px] text-[#1e3a5f] pr-20">{group.activity_title || "Activity Group"}</h4>
                
                <div className="flex items-center gap-4 mt-2 mb-4">
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#1e3a5f]/60">
                    <Calendar className="w-[14px] h-[14px] text-[#2cb1bc]" />
                    <span>{group.activity_scheduled_at ? format(new Date(group.activity_scheduled_at), "E, d MMM • h:mm a") : "TBD"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#1e3a5f]/60">
                    <MapPin className="w-[14px] h-[14px] text-[#2cb1bc]" />
                    <span>{group.activity_area || "Bengaluru"}</span>
                  </div>
                </div>

                {/* Members & Arrow */}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1.5">
                    {group.members?.slice(0, 4).map((m: any) => {
                      return (
                        <div key={m.id} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm -ml-1 first:ml-0">
                          <img src={`https://i.pravatar.cc/150?u=${m.id}`} alt={m.name || ""} className="w-full h-full object-cover" />
                        </div>
                      );
                    })}
                    {group.members?.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-[#1e3a5f]/50 border-2 border-white shadow-sm -ml-1">
                        +{group.members.length - 4}
                      </div>
                    )}
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#eaf4f4] transition-colors">
                    <ChevronRight className="w-4 h-4 text-[#1e3a5f]/40 group-hover:text-[#2cb1bc]" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

