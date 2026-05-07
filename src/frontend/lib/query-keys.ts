export const queryKeys = {
  activities: {
    all: ["activities"] as const,
    list: (filters: Record<string, string | null | undefined>) =>
      ["activities", "list", filters] as const,
    detail: (id: string) => ["activities", "detail", id] as const,
  },
  users: {
    profile: ["users", "profile"] as const,
    onboarding: ["users", "onboarding"] as const,
  },
  groups: {
    detail: (id: string) => ["groups", "detail", id] as const,
    chat: (id: string) => ["groups", "chat", id] as const,
  },
  matching: {
    status: (activityId: string) => ["matching", "status", activityId] as const,
    result: (activityId: string) => ["matching", "result", activityId] as const,
  },
  report: {
    data: (userId: string) => ["report", "data", userId] as const,
  },
  host: {
    dashboard: ["host", "dashboard"] as const,
  },
} as const;
