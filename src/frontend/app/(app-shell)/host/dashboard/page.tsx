"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Users, Star, Calendar, Activity, ChevronRight, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getActivityImage } from "@/lib/images";

export default function HostDashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["host", "dashboard"],
    queryFn: () => apiFetch("/host/dashboard"),
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowCreateModal(false);
      toast.success("Event created successfully! (Mocked)");
    }, 1000);
  };

  if (isLoading) return <div className="h-[60vh] bg-gray-100 animate-pulse rounded-[32px] mt-4" />;

  const stats = data?.stats || { total_experiences_hosted: 0, rating_avg: 0 };

  return (
    <div className="space-y-8 max-w-md mx-auto pt-2 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#1e3a5f] leading-tight">Host Dashboard</h1>
          <p className="text-[15px] font-medium text-[#1e3a5f]/60 mt-1">Your hosted experiences</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center w-12 h-12 bg-[#2cb1bc] text-white rounded-full shadow-lg hover:bg-[#23959e] hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-[#eaf4f4] rounded-full flex items-center justify-center mb-4">
            <Activity className="h-6 w-6 text-[#2cb1bc]" />
          </div>
          <p className="text-[32px] font-bold text-[#1e3a5f] leading-none mb-1">{stats.total_experiences_hosted}</p>
          <p className="text-[12px] font-bold text-[#1e3a5f]/50 uppercase tracking-wide">Experiences Hosted</p>
        </div>
        
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0"></div>
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 relative z-10">
            <Star className="h-6 w-6 text-amber-500 fill-current" />
          </div>
          <p className="text-[32px] font-bold text-[#1e3a5f] leading-none mb-1 relative z-10">{stats.rating_avg?.toFixed(1) || "N/A"}</p>
          <p className="text-[12px] font-bold text-[#1e3a5f]/50 uppercase tracking-wide relative z-10">Average Rating</p>
        </div>
      </div>

      {/* Upcoming Groups */}
      <div>
        <h2 className="text-[20px] font-bold text-[#1e3a5f] mb-4">Upcoming Groups</h2>
        
        <div className="space-y-3">
          {(!data?.upcoming_groups || data.upcoming_groups.length === 0) ? (
            <div className="bg-gray-50 rounded-[24px] p-8 text-center border border-gray-100 border-dashed">
              <Calendar className="w-10 h-10 text-[#1e3a5f]/20 mx-auto mb-3" />
              <p className="text-[15px] font-medium text-[#1e3a5f]/60">No upcoming groups yet.</p>
              <p className="text-[13px] text-[#1e3a5f]/40 mt-1">When users are matched, they will appear here.</p>
            </div>
          ) : (
            data.upcoming_groups.map((g: any) => (
              <div key={g.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-[#2cb1bc]/30 transition-all flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 bg-cover bg-center shadow-sm"
                    style={{ backgroundImage: `url('${getActivityImage(g.activity_title, null)}')` }}
                  />
                  <div>
                    <h4 className="font-bold text-[16px] text-[#1e3a5f]">{g.activity_title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded text-indigo-600 bg-indigo-50 border border-indigo-100">
                        {g.status}
                      </span>
                      <span className="text-[12px] font-medium text-[#1e3a5f]/50">3 Members</span>
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#eaf4f4] transition-colors">
                  <ChevronRight className="w-4 h-4 text-[#1e3a5f]/40 group-hover:text-[#2cb1bc]" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mock Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl relative transform transition-all">
            <div className="p-6 pb-0 flex justify-between items-center">
              <h2 className="text-[20px] font-bold text-[#1e3a5f]">Create Event</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5 text-[#1e3a5f]/60" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#1e3a5f]/50 uppercase tracking-wide mb-1">Event Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sunday Morning Sketching"
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-[15px] font-medium text-[#1e3a5f] focus:ring-2 focus:ring-[#2cb1bc]/20"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#1e3a5f]/50 uppercase tracking-wide mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-[15px] font-medium text-[#1e3a5f] focus:ring-2 focus:ring-[#2cb1bc]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#1e3a5f]/50 uppercase tracking-wide mb-1">Max Guests</label>
                  <input 
                    type="number" 
                    min="2"
                    max="10"
                    defaultValue="6"
                    required
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-[15px] font-medium text-[#1e3a5f] focus:ring-2 focus:ring-[#2cb1bc]/20"
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#2cb1bc] hover:bg-[#23959e] text-white rounded-xl py-4 font-bold text-[16px] transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Event Request"
                  )}
                </button>
                <p className="text-center text-[12px] font-medium text-[#1e3a5f]/40 mt-3">
                  This will be submitted for Wander approval.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

