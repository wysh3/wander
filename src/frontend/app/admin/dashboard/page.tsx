"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminStats } from "@/lib/admin-api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import {
  CalendarPlus, Users, UserCheck, ShieldAlert, Star, TrendingDown,
  Activity, Clock
} from "lucide-react";

const COLORS = ["#0d9488", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    refetchInterval: 30000,
  });

  if (isLoading) return <SkeletonLoader />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time platform overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarPlus} label="Events This Month" value={data.total_events_this_month} sub={`${data.total_events_all_time} all time`} color="bg-teal-100 text-teal-600" />
        <StatCard icon={Users} label="Total Users" value={data.total_users} color="bg-blue-100 text-blue-600" />
        <StatCard icon={UserCheck} label="Active Groups" value={data.active_groups_now} color="bg-violet-100 text-violet-600" />
        <StatCard icon={ShieldAlert} label="SOS (30d)" value={data.sos_triggers_30d} color="bg-red-100 text-red-600" />
        <StatCard icon={Star} label="Avg Group Rating" value={String(data.avg_group_rating)} sub="out of 5" color="bg-amber-100 text-amber-600" />
        <StatCard icon={TrendingDown} label="Screen Time Saved" value={data.avg_screen_time_delta ? `${data.avg_screen_time_delta}h` : "N/A"} sub="avg per user" color="bg-green-100 text-green-600" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events per week */}
        <ChartCard title="Events Created Per Week">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.events_per_week}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* User signups */}
        <ChartCard title="User Signups Over Time">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.signups_over_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category distribution */}
        <ChartCard title="Activity Category Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.category_distribution}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.category_distribution?.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Matching success rate */}
        <ChartCard title="Matching Success Rate">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.matching_success_rate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="groups" stroke="#0d9488" strokeWidth={2} name="Groups" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={2} name="Users" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* SOS Heatmap */}
      <ChartCard title="SOS Events by Hour of Day (Last 30 Days)">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.sos_heatmap}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} label={{ value: "Hour", position: "bottom", offset: -5 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
