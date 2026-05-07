"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchAdminUsers, userAction } from "@/lib/admin-api";
import { Search, Shield, Ban, Flag, RefreshCw, UserCheck, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: () => fetchAdminUsers({ ...(search ? { search } : {}), ...(roleFilter ? { role: roleFilter } : {}) }),
  });

  const actionMut = useMutation({
    mutationFn: ({ id, action }: any) => userAction(id, action),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Action applied"); },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage users, promotions, and bans</p>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="host">Host</option>
          <option value="admin">Admin</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">User</th>
                <th className="text-left p-3 font-medium text-gray-600">Phone</th>
                <th className="text-left p-3 font-medium text-gray-600">Joined</th>
                <th className="text-left p-3 font-medium text-gray-600">Verification</th>
                <th className="text-left p-3 font-medium text-gray-600">Events</th>
                <th className="text-left p-3 font-medium text-gray-600">Role</th>
                <th className="text-left p-3 font-medium text-gray-600">Flags</th>
                <th className="text-right p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b animate-pulse">
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-8" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-12" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-8" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 rounded w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                data?.items?.map((u: any) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                          {u.name?.[0] || "?"}
                        </div>
                        <span className="font-medium">{u.name || "Unnamed"}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-400 font-mono text-xs">{u.phone}</td>
                    <td className="p-3 text-gray-500 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.verification_status === "verified" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {u.verification_status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{u.events_attended}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${u.role === "admin" ? "bg-red-100 text-red-700" : u.role === "host" ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-600"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.flagged && <Flag className="w-4 h-4 text-red-400" />}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => actionMut.mutate({ id: u.id, action: "promote_host" })} className="p-1.5 rounded hover:bg-teal-50" title="Promote to Host">
                          <Shield className="w-4 h-4 text-teal-500" />
                        </button>
                        <button onClick={() => actionMut.mutate({ id: u.id, action: "flag" })} className="p-1.5 rounded hover:bg-yellow-50" title="Flag for Review">
                          <Flag className="w-4 h-4 text-yellow-500" />
                        </button>
                        <button onClick={() => actionMut.mutate({ id: u.id, action: "ban" })} className="p-1.5 rounded hover:bg-red-50" title="Ban User">
                          <Ban className="w-4 h-4 text-red-500" />
                        </button>
                        <button onClick={() => actionMut.mutate({ id: u.id, action: "trigger_reverify" })} className="p-1.5 rounded hover:bg-blue-50" title="Re-verify">
                          <RefreshCw className="w-4 h-4 text-blue-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
