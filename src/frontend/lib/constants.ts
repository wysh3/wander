export const ACTIVITY_CATEGORIES = [
  { value: "physical", label: "Physical", icon: "dumbbell" },
  { value: "social_good", label: "Social Good", icon: "heart" },
  { value: "skill", label: "Skill", icon: "lightbulb" },
  { value: "mental", label: "Mental", icon: "brain" },
  { value: "chaotic", label: "Chaotic", icon: "zap" },
  { value: "explore", label: "Explore", icon: "compass" },
  { value: "slow", label: "Slow", icon: "coffee" },
] as const;

export const BANGALORE_AREAS = [
  "Indiranagar",
  "Koramangala",
  "MG Road",
  "Whitefield",
  "JP Nagar",
  "HSR Layout",
  "Electronic City",
  "Yelahanka",
  "Devanahalli",
  "Nandi Hills",
  "Cubbon Park",
] as const;

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
