class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number,
    public details: Record<string, unknown>
  ) {
    super(message);
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = API_BASE_URL.endsWith("/api/v1") ? API_BASE_URL : `${API_BASE_URL}/api/v1`;

async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("wander-auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.accessToken ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const token = await getAuthToken();
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      body.error?.code ?? "UNKNOWN",
      body.error?.message ?? "Something went wrong",
      res.status,
      body.error?.details ?? {}
    );
  }

  return res.json();
}

export { ApiError };
