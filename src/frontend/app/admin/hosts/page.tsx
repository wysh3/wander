"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminHosts, toggleHostActive } from "@/lib/admin-api";
import { Star, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminHostsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-hosts"],
    queryFn: fetchAdminHosts,
  });

  const toggleMut = useMutation({
    mutationFn: toggleHostActive,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-hosts"] }); toast.success("Toggled"); },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Host Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage Wander Hosts and their performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)
        ) : (
          data?.items?.map((host: any) => (
            <div key={host.id} className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-sm ${!host.active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-sm">
                    {host.user_name?.[0] || "H"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{host.user_name || "Unnamed"}</p>
                    <p className="text-xs text-gray-400">Host ID: {host.id.slice(0, 8)}</p>
                  </div>
                </div>
                <button onClick={() => toggleMut.mutate(host.id)}>
                  {host.active ? (
                    <ToggleRight className="w-6 h-6 text-teal-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-300" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{host.total_experiences_hosted}</p>
                  <p className="text-xs text-gray-500">Events Hosted</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-2xl font-bold text-gray-900">{host.rating_avg || "—"}</span>
                  </div>
                  <p className="text-xs text-gray-500">Avg Rating</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                {host.background_verified && (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">Verified</span>
                )}
                {host.active && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs">Active</span>
                )}
                {host.specialties?.map((s: string) => (
                  <span key={s} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs capitalize">{s}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {data?.items?.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-400">
          <p>No hosts found</p>
        </div>
      )}
    </div>
  );
}
