"use client";

import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";

export function useToast() {
  const wrapWithToast = async <T>(
    fn: () => Promise<T>,
    options?: { loading?: string; success?: string }
  ): Promise<T | undefined> => {
    const toastId = toast.loading(options?.loading || "Loading...");
    try {
      const result = await fn();
      toast.success(options?.success || "Done", { id: toastId });
      return result;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong";
      toast.error(message, { id: toastId });
      return undefined;
    }
  };

  return { wrapWithToast };
}
