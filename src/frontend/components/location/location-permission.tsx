"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { MapPin, Navigation, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useLocationStore } from "@/stores/location-store";

interface LocationPermissionProps {
  onComplete: () => void;
}

export function LocationPermission({ onComplete }: LocationPermissionProps) {
  const { position, error, loading, permissionState, requestPermission } =
    useGeolocation({ watchEnabled: false });
  const { setLocation, setPermissionGranted } = useLocationStore();

  // Track whether we've already handled the position acquisition
  const handledRef = useRef(false);

  // When position is acquired, save it and proceed immediately (only once)
  useEffect(() => {
    if (position && position.lat && !handledRef.current) {
      handledRef.current = true;
      setLocation(position.lat, position.lng);
      setPermissionGranted(true);
      onComplete();
    }
  }, [position, onComplete, setLocation, setPermissionGranted]);

  const handleEnable = () => {
    requestPermission();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center max-w-sm mx-auto py-8 space-y-6"
    >
      {/* Icon */}
      <div className="relative">
        <motion.div
          animate={
            loading
              ? { scale: [1, 1.1, 1] }
              : position
                ? { scale: [1, 1.3, 1] }
                : {}
          }
          transition={{ duration: 1, repeat: loading ? Infinity : 0 }}
          className={`p-6 rounded-full ${
            position
              ? "bg-green-100"
              : loading
                ? "bg-wander-teal/10"
                : "bg-muted"
          }`}
        >
          <MapPin
            className={`h-10 w-10 ${
              position
                ? "text-green-600"
                : loading
                  ? "text-wander-teal animate-pulse"
                  : "text-muted-foreground"
            }`}
          />
        </motion.div>
      </div>

      {/* Content */}
      {position ? (
        <>
          <h2 className="text-xl font-bold text-green-700">Location Found!</h2>
          <p className="text-sm text-muted-foreground">
            We've got your location. You're all set for hyperlocal matching.
          </p>
          <div className="bg-green-50 rounded-xl p-3 text-xs text-green-700 flex items-center gap-2">
            <Shield className="h-4 w-4 flex-shrink-0" />
            <span>Your location never leaves your device unless you're actively matching.</span>
          </div>
        </>
      ) : error ? (
        <>
          <h2 className="text-xl font-bold text-amber-600">
            {permissionState === "denied"
              ? "Location Blocked"
              : "Couldn't Get Location"}
          </h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          {permissionState === "denied" && (
            <p className="text-xs text-muted-foreground">
              You can enable location later in Settings, but nearby matching won't work without it.
            </p>
          )}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onComplete}
            >
              Skip for Now
            </Button>
            {permissionState !== "denied" && (
              <Button className="flex-1" onClick={handleEnable}>
                Try Again
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold">Enable Location?</h2>
          <p className="text-sm text-muted-foreground">
            Wander uses your location to match you with people nearby. It's
            what makes the experience hyperlocal and real.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-1 gap-3 w-full">
            {[
              {
                icon: Users,
                title: "Hyperlocal Groups",
                desc: "Only match with people who can actually reach the activity within 30 min.",
              },
              {
                icon: Navigation,
                title: "Real-Time Nearby",
                desc: "See how many wanderers are active around you right now.",
              },
              {
                icon: Shield,
                title: "Privacy First",
                desc: "Exact location is never shared. Only approximate distance.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 text-left"
              >
                <Icon className="h-5 w-5 text-wander-teal flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onComplete}
            >
              Maybe Later
            </Button>
            <Button
              className="flex-1"
              onClick={handleEnable}
              disabled={loading}
            >
              {loading ? "Detecting..." : "Enable Location"}
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground">
            You can change this anytime in Settings.
          </p>
        </>
      )}
    </motion.div>
  );
}
