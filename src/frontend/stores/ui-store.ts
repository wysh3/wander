import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  activeFilter: string | null;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveFilter: (filter: string | null) => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  activeFilter: null,
  theme: "light",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setTheme: (theme) => set({ theme }),
}));
