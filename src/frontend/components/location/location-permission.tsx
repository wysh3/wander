"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Shield, Users, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocationStore } from "@/stores/location-store";
import { BANGALORE_AREAS } from "@/lib/constants";

interface LocationPermissionProps {
  onComplete: () => void;
}

export function LocationPermission({ onComplete }: LocationPermissionProps) {
  const { setLocation, setPermissionGranted, areaName } = useLocationStore();
  const [query, setQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState<typeof BANGALORE_AREAS[number] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () =>
      query
        ? BANGALORE_AREAS.filter((a) =>
            a.name.toLowerCase().includes(query.toLowerCase())
          )
        : BANGALORE_AREAS,
    [query]
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (area: typeof BANGALORE_AREAS[number]) => {
    setSelectedArea(area);
    setQuery(area.name);
    setIsOpen(false);
  };

  const handleContinue = () => {
    if (!selectedArea) return;
    setLocation(selectedArea.lat, selectedArea.lng, selectedArea.name);
    setPermissionGranted(true);
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center max-w-sm mx-auto py-8 space-y-6"
    >
      {/* Icon */}
      <div className="relative">
        <div className="p-6 rounded-full bg-wander-teal/10">
          <MapPin className="h-10 w-10 text-wander-teal" />
        </div>
      </div>

      <h2 className="text-xl font-bold">Where are you based?</h2>
      <p className="text-sm text-muted-foreground">
        Pick your neighborhood so we can match you with people and activities nearby.
      </p>

      {/* Search input */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedArea(null);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search your area..."
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-wander-teal/30 focus:border-wander-teal"
        />
      </div>

      {/* Dropdown */}
      <div className="relative w-full" ref={dropdownRef}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-0 left-0 right-0 z-20 max-h-48 overflow-y-auto rounded-xl border border-border bg-background shadow-lg"
            >
              {filtered.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No areas found
                </div>
              ) : (
                filtered.map((area) => (
                  <button
                    key={area.name}
                    onClick={() => handleSelect(area)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-muted transition-colors ${
                      selectedArea?.name === area.name ? "bg-muted font-medium" : ""
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{area.name}</span>
                    {selectedArea?.name === area.name && (
                      <Check className="h-4 w-4 text-wander-teal ml-auto" />
                    )}
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected confirmation */}
      {selectedArea && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="w-full bg-green-50 rounded-xl p-3 text-xs text-green-700 flex items-center gap-2"
        >
          <Shield className="h-4 w-4 shrink-0" />
          <span>
            {selectedArea.name} selected. Your exact location is never shared — only approximate distance.
          </span>
        </motion.div>
      )}

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
            <Icon className="h-5 w-5 text-wander-teal shrink-0 mt-0.5" />
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
          Skip for Now
        </Button>
        <Button
          className="flex-1"
          onClick={handleContinue}
          disabled={!selectedArea}
        >
          Continue
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        You can change this anytime in Settings.
      </p>
    </motion.div>
  );
}
