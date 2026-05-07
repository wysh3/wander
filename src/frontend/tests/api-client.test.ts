import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiFetch, ApiError } from "@/lib/api-client";

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe("apiFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("appends base URL to path", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
    });

    await apiFetch("/activities");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/activities"),
      expect.any(Object),
    );
  });

  it("attaches auth token from localStorage", async () => {
    localStorage.setItem("wander-auth", JSON.stringify({ state: { accessToken: "test-token" } }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
    });

    await apiFetch("/users/me");
    const callOptions = mockFetch.mock.calls[0][1];
    expect(callOptions.headers["Authorization"]).toBe("Bearer test-token");
  });

  it("throws ApiError on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: { code: "NOT_FOUND", message: "Not found" } }),
    });

    let caught: any;
    try {
      await apiFetch("/unknown");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect(caught.code).toBe("NOT_FOUND");
    expect(caught.status).toBe(404);
  });

  it("handles empty error bodies", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    await expect(apiFetch("/broken")).rejects.toThrow(ApiError);
  });

  it("merges caller headers over defaults", async () => {
    localStorage.setItem("wander-auth", JSON.stringify({ state: { accessToken: "token" } }));
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiFetch("/test", {
      headers: { "X-Custom": "override" },
    });

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.headers["X-Custom"]).toBe("override");
    expect(callArgs.headers["Content-Type"]).toBe("application/json");
  });
});

describe("ApiError", () => {
  it("constructs with all fields", () => {
    const err = new ApiError("TEST_CODE", "test message", 418, { key: "val" });
    expect(err.message).toBe("test message");
    expect(err.code).toBe("TEST_CODE");
    expect(err.status).toBe(418);
    expect(err.details).toEqual({ key: "val" });
    expect(err).toBeInstanceOf(Error);
  });
});
