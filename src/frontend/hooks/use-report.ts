import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

interface ReportPayload {
  reported_user_id?: string;
  reported_activity_id?: string;
  reported_group_id?: string;
  reason: string;
  details?: string;
}

export function useReport() {
  return useMutation({
    mutationFn: (payload: ReportPayload) =>
      apiFetch("/user-reports/", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success("Report submitted successfully. Our team will review it shortly.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit report. Please try again.");
    }
  });
}