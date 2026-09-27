import type { CandidatePersonPoint, StandPopulationConfig } from "./types";
import { STAND_POPULATION_CONFIGS } from "./standPopulation";
import { STADIUM_STANDS } from "../stadium/stands";
import type { SpatialCalibration } from "../stadium/types";

/**
 * Deterministic pseudo-random number generator (Mulberry32) for reproducible distributions.
 */
function createSeededRNG(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts a string standId to a numeric seed.
 */
function getSeedFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 12345;
}

// In-memory cache for precomputed candidate positions
const CANDIDATE_CACHE: Record<string, CandidatePersonPoint[]> = {};

/**
 * Generates deterministic candidate 3D seating positions for a specific stand.
 */
export function generateStandCandidates(
  standId: string,
  calibrationOverride?: SpatialCalibration
): CandidatePersonPoint[] {
  const cacheKey = `${standId}_${calibrationOverride ? JSON.stringify(calibrationOverride) : "default"}`;
  if (CANDIDATE_CACHE[cacheKey]) {
    return CANDIDATE_CACHE[cacheKey];
  }

  const stand = STADIUM_STANDS.find((s) => s.id === standId);
  const popConfig: StandPopulationConfig | undefined = STAND_POPULATION_CONFIGS[standId];

  if (!stand || !popConfig) {
    return [];
  }

  const spatial = calibrationOverride || stand.spatial;
  const { arcStartDeg, arcEndDeg } = spatial;

  // Convert arc angles to radians
  const toRad = (deg: number) => ((deg % 360) * Math.PI) / 180;
  let startRad = toRad(arcStartDeg);
  let endRad = toRad(arcEndDeg);
  if (endRad <= startRad) endRad += Math.PI * 2;
  const arcSpan = endRad - startRad;

  const rng = createSeededRNG(getSeedFromString(standId));
  const rawPoints: CandidatePersonPoint[] = [];

  // Generate candidates across each defined seating tier band
  popConfig.tierBands.forEach((tier, tierIdx) => {
    const tierCapacity = Math.round(popConfig.totalVisualCapacity * tier.capacityWeight);
    const rows = tier.rows;
    const cols = Math.max(8, Math.round(tierCapacity / rows));

    const radialStep = (tier.outerRadius - tier.innerRadius) / Math.max(1, rows - 1);
    const tiltRad = (tier.tiltDeg * Math.PI) / 180;

    for (let r = 0; r < rows; r++) {
      const baseRadius = tier.innerRadius + r * radialStep;
      // Elevation rises with tier tilt and row distance
      const rowRise = Math.sin(tiltRad) * (r * radialStep);
      const rowElevation = tier.elevationY + rowRise;

      for (let c = 0; c < cols; c++) {
        // Deterministic angular step with controlled organic jitter
        const angleFraction = (c + 0.5) / cols;
        const angleJitter = (rng() - 0.5) * (arcSpan / cols) * 0.45;
        const angle = startRad + angleFraction * arcSpan + angleJitter;

        // Controlled radial jitter (stays strictly within row boundaries)
        const radiusJitter = (rng() - 0.5) * radialStep * 0.4;
        const radius = baseRadius + radiusJitter;

        // Spherical to Cartesian coordinates (0 deg = North / +Z, 90 deg = East / +X)
        const sinA = Math.sin(angle);
        const cosA = Math.cos(angle);
        const x = radius * sinA;
        const z = radius * cosA;
        const y = rowElevation + (rng() - 0.5) * 0.05 + 0.12; // Person ground anchor

        // Angle facing inward towards pitch center (0, 0, 0)
        // atan2(dx, dz) where dx = -x, dz = -z
        const rotationY = Math.atan2(-x, -z);

        // Deterministic rank for organic filling (mix tier preference with seeded shuffle)
        // Lower tiers get slight priority, but higher tiers also fill progressively
        const tierBias = tierIdx * 0.15;
        const rank = rng() + tierBias;

        rawPoints.push({
          position: [x, y, z],
          rotationY,
          tierIndex: tierIdx,
          standId,
          rank,
        });
      }
    }
  });

  // Sort candidate points by rank so that filling is smooth, progressive, and monotonic
  rawPoints.sort((a, b) => a.rank - b.rank);

  CANDIDATE_CACHE[cacheKey] = rawPoints;
  return rawPoints;
}

/**
 * Computes active visible crowd count for a stand given its real occupancy percentage.
 */
export function getActiveVisualCount(
  occupancyPercent: number,
  totalCandidates: number
): number {
  if (occupancyPercent <= 0) return 0;
  const clampedPercent = Math.min(100, Math.max(0, occupancyPercent));
  return Math.min(totalCandidates, Math.round((clampedPercent / 100) * totalCandidates));
}
