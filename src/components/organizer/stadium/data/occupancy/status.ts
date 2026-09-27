import type { OccupancyStatus, OccupancyThresholds } from "./types";
import { DEFAULT_OCCUPANCY_THRESHOLDS } from "./thresholds";

/**
 * Pure function to calculate OccupancyStatus from percentage.
 * Handles edge cases: 0 people, boundary conditions, and overflow (>100%).
 */
export function getOccupancyStatus(
  occupancyPercent: number,
  thresholds: OccupancyThresholds = DEFAULT_OCCUPANCY_THRESHOLDS
): OccupancyStatus {
  if (isNaN(occupancyPercent) || occupancyPercent < 0) {
    return "LOW";
  }

  if (occupancyPercent >= thresholds.criticalMin) {
    return "CRITICAL";
  }

  if (occupancyPercent >= thresholds.normalMax + 0.1) {
    return "HIGH";
  }

  if (occupancyPercent >= thresholds.lowMax + 0.1) {
    return "NORMAL";
  }

  return "LOW";
}

/**
 * Computes an occupancy percentage from peopleCount and capacity.
 * Preserves raw values while ensuring safety against division by zero.
 */
export function calculateOccupancyPercent(peopleCount: number, capacity: number): number {
  if (capacity <= 0 || peopleCount <= 0) return 0;
  const rawPercent = (peopleCount / capacity) * 100;
  return Number(rawPercent.toFixed(1));
}
