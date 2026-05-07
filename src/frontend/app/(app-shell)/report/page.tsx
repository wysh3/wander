"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { WanderReport } from "@/components/report/wander-report";
import { useAuthStore } from "@/stores/auth-store";

export default function ReportPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["report", user?.id],
    queryFn: () => apiFetch(`/report/${user?.id}`),
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="h-96 bg-muted animate-pulse rounded-xl" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Wander Report</h1>
      {data && <WanderReport data={data} />}
    </div>
  );
}
