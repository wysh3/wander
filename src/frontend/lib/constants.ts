export const ACTIVITY_CATEGORIES = [
  { value: "physical", label: "Physical", icon: "dumbbell" },
  { value: "social_good", label: "Social Good", icon: "heart" },
  { value: "skill", label: "Skill", icon: "lightbulb" },
  { value: "mental", label: "Mental", icon: "brain" },
  { value: "chaotic", label: "Chaotic", icon: "zap" },
  { value: "explore", label: "Explore", icon: "compass" },
  { value: "slow", label: "Slow", icon: "coffee" },
] as const;

export interface BangaloreArea {
  name: string;
  lat: number;
  lng: number;
}

export const BANGALORE_AREAS: BangaloreArea[] = [
  { name: "Indiranagar",     lat: 12.9719, lng: 77.6412 },
  { name: "Koramangala",     lat: 12.9352, lng: 77.6245 },
  { name: "MG Road",         lat: 12.9756, lng: 77.6066 },
  { name: "Whitefield",      lat: 12.9698, lng: 77.7500 },
  { name: "JP Nagar",        lat: 12.9063, lng: 77.5857 },
  { name: "HSR Layout",      lat: 12.9116, lng: 77.6389 },
  { name: "Electronic City", lat: 12.8399, lng: 77.6770 },
  { name: "Yelahanka",       lat: 13.1007, lng: 77.5963 },
  { name: "Devanahalli",     lat: 13.2468, lng: 77.7109 },
  { name: "Nandi Hills",     lat: 13.3702, lng: 77.6835 },
  { name: "Cubbon Park",     lat: 12.9763, lng: 77.5929 },
  { name: "Lalbagh",         lat: 12.9507, lng: 77.5848 },
  { name: "Jayanagar",       lat: 12.9250, lng: 77.5938 },
  { name: "Basavanagudi",    lat: 12.9422, lng: 77.5733 },
  { name: "Malleshwaram",    lat: 12.9969, lng: 77.5696 },
  { name: "Rajajinagar",     lat: 12.9900, lng: 77.5528 },
  { name: "Yeshwanthpur",    lat: 13.0227, lng: 77.5463 },
  { name: "Hebbal",          lat: 13.0358, lng: 77.5970 },
  { name: "Banashankari",    lat: 12.9220, lng: 77.5460 },
  { name: "BTM Layout",      lat: 12.9166, lng: 77.6101 },
  { name: "Marathahalli",    lat: 12.9591, lng: 77.6974 },
  { name: "Bellandur",       lat: 12.9260, lng: 77.6762 },
  { name: "Sarjapur Road",   lat: 12.9100, lng: 77.6940 },
  { name: "Kengeri",         lat: 12.9085, lng: 77.4829 },
  { name: "Vijayanagar",     lat: 12.9716, lng: 77.5338 },
];

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
