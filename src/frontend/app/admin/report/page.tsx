"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPlatformReport } from "@/lib/admin-api";
import {
  Clock, UserCheck, MapPin, TrendingDown, Star, Download
} from "lucide-react";

export default function AdminReportPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-report"],
    queryFn: fetchPlatformReport,
  });

  if (isLoading) return <Skeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wander Report — Platform Edition</h1>
          <p className="text-sm text-gray-500 mt-1">Real-world impact metrics for judges and investors</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* Impact Summary */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl border border-teal-100 p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Wander Impact Summary</h2>
        <p className="text-gray-700 leading-relaxed">{data?.impact_summary}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Clock} label="Real-World Hours This Month" value={`${data?.total_real_hours_this_month || 0}h`} color="bg-teal-100 text-teal-600" />
        <MetricCard icon={UserCheck} label="Strangers Became Groups" value={data?.total_strangers_became_groups || 0} color="bg-blue-100 text-blue-600" />
        <MetricCard icon={MapPin} label="Neighborhoods Activated" value={data?.neighborhoods_activated?.length || 0} color="bg-violet-100 text-violet-600" />
        <MetricCard icon={TrendingDown} label="Screen Time Saved (avg)" value={data?.platform_screen_time_delta_hours ? `${data.platform_screen_time_delta_hours}h/user` : "N/A"} color="bg-green-100 text-green-600" />
      </div>

      {/* Neighborhood Heatmap */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-wander-teal" /> Neighborhoods Activated This Month
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {data?.neighborhoods_activated?.map((n: any) => (
            <div key={n.area} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="font-medium text-sm text-gray-900">{n.area}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">{n.events} events</span>
                {n.lat && <span className="text-[10px] text-gray-300">{n.lat.toFixed(3)}, {n.lng.toFixed(3)}</span>}
              </div>
            </div>
          ))}
          {data?.neighborhoods_activated?.length === 0 && (
            <p className="text-sm text-gray-400 col-span-full text-center py-4">No neighborhoods data yet</p>
          )}
        </div>
      </div>

      {/* Top Activities */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" /> Top Activities This Month
        </h3>
        <div className="space-y-2">
          {data?.top_activities?.map((a: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{i + 1}</span>
                <span className="text-sm font-medium text-gray-800">{a.title}</span>
              </div>
              <span className="text-sm text-gray-500">{a.participants} participants</span>
            </div>
          ))}
          {data?.top_activities?.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No activity data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded" />
      <div className="h-24 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );
}
