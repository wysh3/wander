"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, MessageCircle, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface GroupItem {
  id: string;
  activity_title: string;
  status: string;
  match_score: number;
  members: { name: string | null }[];
  created_at: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<GroupItem[]>("/groups")
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="text-center py-20">
        <Users className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <h2 className="text-lg font-semibold mt-4">No groups yet</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Join an activity and run matching to create your first group.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Your Groups</h1>
        <p className="text-sm text-muted-foreground">{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
      </div>
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => router.push(`/groups/${group.id}`)}
          className="w-full text-left p-4 rounded-xl border hover:border-wander-teal transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{group.activity_title}</p>
              <p className="text-sm text-muted-foreground">
                {group.members.length} member{group.members.length !== 1 ? "s" : ""} · {group.status}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </button>
      ))}
    </div>
  );
}
