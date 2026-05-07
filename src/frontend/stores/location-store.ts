import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocationState {
  lat: number | null;
  lng: number | null;
  preferredRadiusKm: number;
  lastActiveAt: string | null;
  nearbyCount: number;
  permissionGranted: boolean;
  trackingEnabled: boolean;

  setLocation: (lat: number, lng: number) => void;
  setPreferredRadius: (km: number) => void;
  setNearbyCount: (count: number) => void;
  setPermissionGranted: (granted: boolean) => void;
  setTrackingEnabled: (enabled: boolean) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      lat: null,
      lng: null,
      preferredRadiusKm: 20,
      lastActiveAt: null,
      nearbyCount: 0,
      permissionGranted: false,
      trackingEnabled: false,

      setLocation: (lat, lng) =>
        set({
          lat,
          lng,
          lastActiveAt: new Date().toISOString(),
        }),

      setPreferredRadius: (km) => set({ preferredRadiusKm: km }),

      setNearbyCount: (count) => set({ nearbyCount: count }),

      setPermissionGranted: (granted) => set({ permissionGranted: granted }),

      setTrackingEnabled: (enabled) => set({ trackingEnabled: enabled }),

      clearLocation: () =>
        set({
          lat: null,
          lng: null,
          lastActiveAt: null,
          nearbyCount: 0,
        }),
    }),
    {
      name: "wander-location",
      partialize: (state) => ({
        lat: state.lat,
        lng: state.lng,
        preferredRadiusKm: state.preferredRadiusKm,
        lastActiveAt: state.lastActiveAt,
        permissionGranted: state.permissionGranted,
        trackingEnabled: state.trackingEnabled,
      }),
    }
  )
);
