export const categoryImages: Record<string, string> = {
  physical: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=1200&q=80",
  social_good: "https://images.unsplash.com/photo-1593113580465-b1a134888be6?auto=format&fit=crop&w=1200&q=80",
  skill: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=1200&q=80",
  mental: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
  chaotic: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
  explore: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
  slow: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1200&q=80",
};

export const exactActivityImages: Record<string, string> = {
  "Nandi Hills Sunrise Trek": "/images/nandi_hills.png",
  "Pottery + Chai at Lahe Lahe": "/images/pottery_chai.png",
  "Cubbon Park Cleanup Drive": "/images/cubbon_park.png",
  "Board Game Night": "/images/board_games.png",
  "Sunday Morning Yoga": "/images/yoga_hebbal.png",
  "Koramangala Food Walk": "/images/food_walk.png",
  "Midnight Chaos Bowling": "/images/bowling.png",
  "Slow Reading Club": "/images/reading_club.png",
  "Lalbagh Heritage Walk": "/images/lalbagh.png",
  "Evening Cycling — Outer Ring": "/images/evening_cycling.png",
  "Dumbbell + Brunch": "/images/dumbbell_brunch.png",
  "Mindfulness + Meditation": "/images/meditation.png",
  "Trek to Savandurga": "https://images.unsplash.com/photo-1522069169874-c58ec4b76be1?auto=format&fit=crop&w=1200&q=80",
  "Board Games Meetup": "/images/board_games.png",
  "Ulsoor Lake Cleanup": "https://images.unsplash.com/photo-1563812837330-81f148003f0b?auto=format&fit=crop&w=1200&q=80",
  "TCS World 10k Marathon Training": "/images/marathon_training.png",
  "Hackverse-2k26 Code-athon": "/images/hackverse.png",
  "Robin Hood Army Food Drive": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
  "Devanahalli Fort Heritage Walk": "/images/devanahalli_fort.png",
  "Morning Chai at Devanahalli Local": "/images/morning_chai.png",
  "Sunrise Walk — Devanahalli Farms": "/images/sunrise_walk.png",
  "Birdwatching at Yelahanka Lake": "/images/birdwatching.png",
  "Cycling to Nandi Hills Base": "/images/cycling_nandi.png",
  "Tech Meetup — Electronic City": "/images/tech_meetup.png",
  "Electronic City Lake Walk": "/images/lake_walk.png",
};

export function getActivityImage(title: string | null, category: string | null, coverPhotoUrl?: string | null): string {
  if (coverPhotoUrl) return coverPhotoUrl;

  if (title && exactActivityImages[title]) {
    return exactActivityImages[title];
  }
  
  // Try partial matching if exact match fails
  if (title) {
    const entry = Object.entries(exactActivityImages).find(([key]) => title.includes(key) || key.includes(title));
    if (entry) return entry[1];
  }

  if (category && categoryImages[category]) {
    return categoryImages[category];
  }
  return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80"; // fallback
}
