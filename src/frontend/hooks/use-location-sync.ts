"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGeolocation } from "./use-geolocation";
import { useLocationStore } from "@/stores/location-store";
import { useAuthStore } from "@/stores/auth-store";
import { apiFetch } from "@/lib/api-client";

interface UseLocationSyncOptions {
  syncIntervalMs?: number;
  enabled?: boolean;
}

/**
 * Syncs browser geolocation with the Wander backend.
 *
 * - Watches browser GPS position
 * - Sends location updates to POST /location/update
 * - Updates Zustand location store
 * - Handles permission lifecycle
 */
export function useLocationSync(options: UseLocationSyncOptions = {}) {
  const { syncIntervalMs = 30000, enabled = true } = options;

  const { isAuthenticated } = useAuthStore();
  const {
    setLocation,
    setNearbyCount,
    setPermissionGranted,
    setTrackingEnabled,
    preferredRadiusKm,
    lat: storedLat,
    lng: storedLng,
  } = useLocationStore();

  const {
    position,
    error,
    loading,
    permissionState,
    requestPermission,
    startWatching,
    stopWatching,
    refresh,
  } = useGeolocation({
    watchEnabled: enabled,
    highAccuracy: true,
    minUpdateIntervalMs: syncIntervalMs,
  });

  const syncTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncLatRef = useRef<number | null>(null);
  const lastSyncLngRef = useRef<number | null>(null);

  // Track permission changes
  useEffect(() => {
    if (permissionState === "granted") {
      setPermissionGranted(true);
      if (enabled && !loading) {
        startWatching();
      }
    } else if (permissionState === "denied") {
      setPermissionGranted(false);
      setTrackingEnabled(false);
    }
  }, [permissionState, enabled, loading]);

  // Track the last synced coordinates to avoid redundant store updates
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Sync location to store whenever the browser reports a new position
  useEffect(() => {
    if (!position || !position.lat || !position.lng) return;

    const prev = lastCoordsRef.current;
    // Only call setLocation if coordinates actually changed (≈10m threshold)
    if (
      !prev ||
      Math.abs(position.lat - prev.lat) > 0.0001 ||
      Math.abs(position.lng - prev.lng) > 0.0001
    ) {
      lastCoordsRef.current = { lat: position.lat, lng: position.lng };
      setLocation(position.lat, position.lng);
    }
  }, [position, setLocation]);

  // Sync to backend on interval
  const syncToBackend = useCallback(async () => {
    if (!isAuthenticated) return;

    const currentLat = storedLat;
    const currentLng = storedLng;

    if (!currentLat || !currentLng) return;

    // Skip if position hasn't changed significantly (>10m)
    if (
      lastSyncLatRef.current !== null &&
      lastSyncLngRef.current !== null
    ) {
      const latDiff = Math.abs(currentLat - lastSyncLatRef.current);
      const lngDiff = Math.abs(currentLng - lastSyncLngRef.current);
      // ~0.0001 degrees ≈ 11m
      if (latDiff < 0.0001 && lngDiff < 0.0001) return;
    }

    try {
      const data = await apiFetch<{
        ok: boolean;
        nearby_count: number;
        timestamp: string;
      }>("/location/update", {
        method: "POST",
        body: JSON.stringify({
          lat: currentLat,
          lng: currentLng,
          preferred_radius_km: preferredRadiusKm,
        }),
      });

      if (data.ok) {
        lastSyncLatRef.current = currentLat;
        lastSyncLngRef.current = currentLng;
        setNearbyCount(data.nearby_count);
      }
    } catch (err) {
      // Silently fail — location sync is best-effort
      console.debug("Location sync failed:", err);
    }
  }, [isAuthenticated, storedLat, storedLng, preferredRadiusKm]);

  // Start/stop periodic sync
  useEffect(() => {
    if (enabled && isAuthenticated && permissionState === "granted") {
      // Initial sync
      syncToBackend();

      // Periodic sync
      syncTimeoutRef.current = setInterval(syncToBackend, syncIntervalMs);
      setTrackingEnabled(true);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      setTrackingEnabled(false);
    };
  }, [enabled, isAuthenticated, permissionState, syncIntervalMs]);

  return {
    position,
    error,
    loading,
    permissionState,
    requestPermission,
    startWatching,
    stopWatching,
    refresh,
    nearbyCount: useLocationStore((s) => s.nearbyCount),
  };
}
