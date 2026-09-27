/**
 * Population Distribution Domain Types for HoloJi
 *
 * Provides a clean architectural abstraction separating:
 * 1. Semantic/Calibrated Stadium Geometry (from Phase 2A)
 * 2. Visual Population Distribution Model (seating tiers, candidate points, density)
 * 3. Dynamic Occupancy State (from Phase 2B-1/2B-2)
 */

export interface SeatingTierBand {
  id: string;
  name: string; // e.g. "Level 1 (Lower Bowl)", "Level 2 (Club Tier)", "Level 3 (Upper Deck)"
  innerRadius: number;
  outerRadius: number;
  elevationY: number;
  height: number;
  tiltDeg: number;
  rows: number;
  capacityWeight: number; // e.g. 0.5 for lower tier, 0.3 for mid, 0.2 for upper
}

export interface StandPopulationConfig {
  standId: string;
  standName: string;
  shortLabel: string;
  totalVisualCapacity: number; // Target max visual instances rendered at 100% occupancy
  tierBands: SeatingTierBand[];
}

export interface CandidatePersonPoint {
  position: [number, number, number]; // [x, y, z] in Three.js world coordinates
  rotationY: number; // Angle facing inward towards pitch center
  tierIndex: number;
  standId: string;
  rank: number; // Deterministic activation priority (0 = first seated, max = last seated)
}
