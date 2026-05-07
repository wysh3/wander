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

  if (isLoading) return <div className="h-[60vh] bg-gray-100 animate-pulse rounded-[32px]" />;

  return (
    <div className="h-full">
      {data && <WanderReport data={data} />}
    </div>
  );
}

