import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/auth-store";

describe("auth-store", () => {
  beforeEach(() => {
    localStorage.clear();
    const store = useAuthStore.getState();
    store.logout();
  });

  it("starts unauthenticated with no user", () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("setAuth stores token and user", () => {
    const store = useAuthStore.getState();
    store.setAuth("jwt-token", {
      id: "user-1",
      phone: "+919999000001",
      name: "Test User",
      verification_status: "verified",
      onboarding_completed: true,
    });

    const updated = useAuthStore.getState();
    expect(updated.isAuthenticated).toBe(true);
    expect(updated.accessToken).toBe("jwt-token");
    expect(updated.user?.name).toBe("Test User");
    expect(updated.user?.id).toBe("user-1");
  });

  it("logout clears auth state", () => {
    const store = useAuthStore.getState();
    store.setAuth("token", {
      id: "u1",
      phone: "+919999000001",
      name: "X",
      verification_status: "unverified",
      onboarding_completed: false,
    });

    const authed = useAuthStore.getState();
    expect(authed.isAuthenticated).toBe(true);

    authed.logout();
    const cleared = useAuthStore.getState();
    expect(cleared.isAuthenticated).toBe(false);
    expect(cleared.accessToken).toBeNull();
    expect(cleared.user).toBeNull();
  });

  it("setUser updates user without changing token", () => {
    const store = useAuthStore.getState();
    store.setAuth("my-token", {
      id: "u1",
      phone: "+919999000001",
      name: "Old",
      verification_status: "unverified",
      onboarding_completed: false,
    });
    store.setUser({
      id: "u1",
      phone: "+919999000001",
      name: "New Name",
      verification_status: "verified",
      onboarding_completed: true,
    });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("my-token");
    expect(state.user?.name).toBe("New Name");
    expect(state.user?.verification_status).toBe("verified");
  });

  it("persists to localStorage", () => {
    const store = useAuthStore.getState();
    store.setAuth("persist-token", {
      id: "p1",
      phone: "+919999000001",
      name: "Persist",
      verification_status: "verified",
      onboarding_completed: true,
    });

    const raw = localStorage.getItem("wander-auth");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.accessToken).toBe("persist-token");
  });
});
