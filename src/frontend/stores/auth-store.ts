import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  verification_status: string;
  onboarding_completed: boolean;
  role: string;
}

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
  setUser: (user: UserProfile) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) =>
        set({ accessToken: token, user, isAuthenticated: true }),
      logout: () =>
        set({ accessToken: null, user: null, isAuthenticated: false }),
      setUser: (user) => set({ user }),
    }),
    {
      name: "wander-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
