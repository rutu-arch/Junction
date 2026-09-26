import { Restaurant, ScenarioId } from "@/types";

export const MOCK_RESTAURANTS_BASE: Restaurant[] = [
  {
    id: "R1", name: "Trishna", cuisine: "Coastal Seafood & Mangalorean", zone: "ZONE_A",
    location: { latitude: 18.9282, longitude: 72.8318 },
    capacity: 80, currentOccupancy: 76, availableTables: 2,
    waitTime: 55, predictedWaitTime: 75, distanceFromVenue: 8,
    pressure: 91, pressureLevel: "CRITICAL",
    source: "SIMULATED", hasIncentive: false, recommended: false,
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    rating: 4.6, address: "Kala Ghoda, Fort, Mumbai",
  },
  {
    id: "R2", name: "Bade Miya", cuisine: "Street Grill & Kebabs", zone: "ZONE_A",
    location: { latitude: 18.9238, longitude: 72.8324 },
    capacity: 60, currentOccupancy: 54, availableTables: 3,
    waitTime: 42, predictedWaitTime: 60, distanceFromVenue: 10,
    pressure: 84, pressureLevel: "HIGH",
    source: "SIMULATED", hasIncentive: false, recommended: false,
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    rating: 4.2, address: "Tulloch Road, Colaba, Mumbai",
  },
  {
    id: "R3", name: "Britannia & Co.", cuisine: "Parsi & Irani Heritage Café", zone: "ZONE_B",
    location: { latitude: 18.9372, longitude: 72.8396 },
    capacity: 120, currentOccupancy: 88, availableTables: 8,
    waitTime: 15, predictedWaitTime: 28, distanceFromVenue: 14,
    pressure: 68, pressureLevel: "WATCH",
    source: "SIMULATED", hasIncentive: false, recommended: true,
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, address: "Ballard Estate, Fort, Mumbai",
  },
  {
    id: "R4", name: "Café Madras", cuisine: "Authentic South Indian & Filter Coffee", zone: "ZONE_C",
    location: { latitude: 19.0278, longitude: 72.8556 },
    capacity: 90, currentOccupancy: 42, availableTables: 18,
    waitTime: 5, predictedWaitTime: 12, distanceFromVenue: 24,
    pressure: 46, pressureLevel: "NORMAL",
    source: "SIMULATED", hasIncentive: true, incentiveLabel: "10% OFF for event guests",
    recommended: true,
    imageUrl: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=800&q=80",
    rating: 4.9, address: "King's Circle, Matunga East, Mumbai",
  },
  {
    id: "R5", name: "Shalimar Restaurant", cuisine: "Mughlai & Kebabs", zone: "ZONE_C",
    location: { latitude: 18.9565, longitude: 72.8335 },
    capacity: 150, currentOccupancy: 58, availableTables: 25,
    waitTime: 8, predictedWaitTime: 15, distanceFromVenue: 22,
    pressure: 42, pressureLevel: "NORMAL",
    source: "SIMULATED", hasIncentive: true, incentiveLabel: "IPL Special Thali",
    recommended: false,
    imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80",
    rating: 4.5, address: "Bhendi Bazaar, Mumbai",
  },
];

export function getRestaurants(scenario?: ScenarioId): Restaurant[] {
  if (!scenario || scenario === "NORMAL") return MOCK_RESTAURANTS_BASE;

  return MOCK_RESTAURANTS_BASE.map(r => {
    let waitMultiplier = 1.0;
    if (scenario === "POST_EVENT_SURGE") {
      waitMultiplier = r.zone === "ZONE_A" ? 1.4 : r.zone === "ZONE_B" ? 1.2 : 1.0;
    } else if (scenario === "HEAVY_RAIN") {
      waitMultiplier = r.zone === "ZONE_A" ? 1.2 : 0.9;
    }
    const waitTime = Math.round(r.waitTime * waitMultiplier);
    const predictedWaitTime = Math.round(r.predictedWaitTime * waitMultiplier);
    const pressure = Math.min(99, Math.round(r.pressure * (waitMultiplier > 1 ? 1.1 : 1.0)));
    return {
      ...r,
      waitTime,
      predictedWaitTime,
      pressure,
    };
  });
}
