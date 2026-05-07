"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number | null;
  timestamp: number;
}

interface UseGeolocationOptions {
  watchEnabled?: boolean;
  highAccuracy?: boolean;
  timeout?: number;
  maxAge?: number;
  minUpdateIntervalMs?: number;
}

interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  permissionState: PermissionState | null;
  requestPermission: () => void;
  startWatching: () => void;
  stopWatching: () => void;
  refresh: () => void;
}

/**
 * Browser Geolocation API hook for Wander.
 *
 * - Requests one-shot position or continuous watch
 * - Respects user permission state
 * - Throttles updates to minUpdateIntervalMs
 * - Provides permission state for UI feedback
 */
export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationReturn {
  const {
    watchEnabled = true,
    highAccuracy = false,
    timeout = 30000,
    maxAge = 60000,
    minUpdateIntervalMs = 10000,
  } = options;

  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] =
    useState<PermissionState | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const mountedRef = useRef(true);

  // Check initial permission state
  useEffect(() => {
    mountedRef.current = true;

    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => {
          if (mountedRef.current) {
            setPermissionState(status.state);
            status.addEventListener("change", () => {
              if (mountedRef.current) setPermissionState(status.state);
            });
          }
        })
        .catch(() => {
          // Permissions API not supported, we'll handle errors at request time
        });
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleSuccess = useCallback(
    (pos: GeolocationPosition) => {
      if (!mountedRef.current) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < minUpdateIntervalMs) return;
      lastUpdateRef.current = now;

      setPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      });
      setError(null);
    },
    [minUpdateIntervalMs]
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    if (!mountedRef.current) return;

    switch (err.code) {
      case err.PERMISSION_DENIED:
        setError("Location access denied. Enable location in your browser settings.");
        setPermissionState("denied");
        break;
      case err.POSITION_UNAVAILABLE:
        setError("Location unavailable. Check GPS or try a different location.");
        break;
      case err.TIMEOUT:
        setError("Location request timed out. Please try again.");
        break;
      default:
        setError("Unable to get your location.");
    }
  }, []);

  const startWatching = useCallback(() => {
    if (!mountedRef.current) return;

    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported in this browser.");
      return;
    }

    setLoading(true);
    setError(null);

    // Get one-shot position first
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSuccess(pos);
        setLoading(false);
        setPermissionState("granted");
      },
      (err) => {
        handleError(err);
        setLoading(false);
      },
      { enableHighAccuracy: highAccuracy, timeout, maximumAge: maxAge }
    );

    // Then start watching if enabled
    if (watchEnabled) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy: highAccuracy, timeout, maximumAge: maxAge }
      );
    }
  }, [watchEnabled, highAccuracy, timeout, maxAge, handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    setError(null);
    setLoading(true);

    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSuccess(pos);
        setLoading(false);
      },
      (err) => {
        handleError(err);
        setLoading(false);
      },
      { enableHighAccuracy: highAccuracy, timeout, maximumAge: maxAge }
    );
  }, [highAccuracy, timeout, maxAge, handleSuccess, handleError]);

  const requestPermission = useCallback(() => {
    if (permissionState === "denied") {
      setError("Location is blocked. Please update your browser settings.");
      return;
    }
    startWatching();
  }, [permissionState, startWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    position,
    error,
    loading,
    permissionState,
    requestPermission,
    startWatching,
    stopWatching,
    refresh,
  };
}
