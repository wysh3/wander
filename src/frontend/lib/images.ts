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
  "Pottery + Chai at Lahe Lahe": "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=80",
  "Cubbon Park Cleanup Drive": "/images/cubbon_park.png",
  "Board Game Night": "https://images.unsplash.com/photo-1632501641765-e568d28b0015?auto=format&fit=crop&w=1200&q=80",
  "Sunday Morning Yoga": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
  "Koramangala Food Walk": "https://images.unsplash.com/photo-1543826173-70651703c5a4?auto=format&fit=crop&w=1200&q=80",
  "Midnight Chaos Bowling": "https://images.unsplash.com/photo-1506520779770-f4cc5e2e8e9e?auto=format&fit=crop&w=1200&q=80",
  "Slow Reading Club": "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=1200&q=80",
  "Lalbagh Heritage Walk": "/images/lalbagh.png",
  "Evening Cycling — Outer Ring": "/images/evening_cycling.png",
  "Wall Art + Mural Painting": "https://images.unsplash.com/photo-1499892477393-f675706cbe6e?auto=format&fit=crop&w=1200&q=80",
  "Photography Walk — Chickpet": "https://images.unsplash.com/photo-1517409088656-7ed8d5760814?auto=format&fit=crop&w=1200&q=80",
  "Dumbbell + Brunch": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80",
  "Mindfulness + Meditation": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
  "Saree + Filter Coffee Walk": "https://images.unsplash.com/photo-1515005660851-40ea468da2e5?auto=format&fit=crop&w=1200&q=80",
  "Trek to Savandurga": "https://images.unsplash.com/photo-1522069169874-c58ec4b76be1?auto=format&fit=crop&w=1200&q=80",
  "Board Games Meetup": "https://images.unsplash.com/photo-1610890716175-3ad0460c4105?auto=format&fit=crop&w=1200&q=80",
  "Ulsoor Lake Cleanup": "https://images.unsplash.com/photo-1563812837330-81f148003f0b?auto=format&fit=crop&w=1200&q=80",
};

export function getActivityImage(title: string | null, category: string | null): string {
  if (title && exactActivityImages[title]) {
    return exactActivityImages[title];
  }
  if (category && categoryImages[category]) {
    return categoryImages[category];
  }
  return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80"; // fallback
}
