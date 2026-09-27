import type { OccupancyRecord } from "./types";
import { ZONE_CAPACITIES } from "./capacities";
import { getOccupancyStatus } from "./status";
import { STADIUM_STANDS } from "../stadium/stands";

export interface SimulationConfig {
  updateIntervalMs: number;
  baseDriftSpeed: number;
}

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  updateIntervalMs: 2000,
  baseDriftSpeed: 0.05,
};

// Deterministic baseline occupancy percentage targets per stand
const STAND_BASE_TARGETS: Record<string, { basePercent: number; amplitude: number; phase: number }> = {
  north:   { basePercent: 78.0, amplitude: 6.5, phase: 0.0 },   // High density (Sachin Tendulkar Stand)
  sunilg:  { basePercent: 65.0, amplitude: 5.0, phase: 1.2 },   // Normal density (Sunil Gavaskar Stand)
  divecha: { basePercent: 52.0, amplitude: 6.0, phase: 2.4 },   // Normal/Low boundary
  mca:     { basePercent: 91.5, amplitude: 4.5, phase: 3.8 },   // Critical/High (VIP Pavilion)
  garware: { basePercent: 58.0, amplitude: 5.5, phase: 4.9 },   // Normal density
  vijaym:  { basePercent: 74.0, amplitude: 7.0, phase: 5.7 },   // High/Normal boundary
};

/**
 * Deterministic Simulation State Container.
 * Computes smooth time-based occupancy trajectories across the 6 primary stadium stands/pavilions.
 */
export class OccupancySimulator {
  private config: SimulationConfig;
  private stepCount: number = 0;
  private startTime: number;

  constructor(config: SimulationConfig = DEFAULT_SIMULATION_CONFIG) {
    this.config = config;
    this.startTime = Date.now();
  }

  /**
   * Generates a deterministic OccupancyRecord for every stand/pavilion at time `t`.
   */
  public generateSnapshot(currentTimeMs: number = Date.now()): Record<string, OccupancyRecord> {
    const elapsedSeconds = (currentTimeMs - this.startTime) / 1000;
    const records: Record<string, OccupancyRecord> = {};

    for (const stand of STADIUM_STANDS) {
      const target = STAND_BASE_TARGETS[stand.id] || { basePercent: 60.0, amplitude: 5.0, phase: 0.0 };
      
      // Multi-harmonic deterministic sinusoidal drift
      const wave1 = Math.sin(elapsedSeconds * this.config.baseDriftSpeed + target.phase);
      const wave2 = Math.sin(elapsedSeconds * this.config.baseDriftSpeed * 1.8 + target.phase * 1.3) * 0.4;
      
      const computedPercent = Math.max(10, Math.min(100, target.basePercent + (wave1 + wave2) * target.amplitude));
      const roundedPercent = Number(computedPercent.toFixed(1));

      const capacity = ZONE_CAPACITIES[stand.id]?.capacity || stand.approxCapacity || 5000;
      const peopleCount = Math.round((roundedPercent / 100) * capacity);
      const status = getOccupancyStatus(roundedPercent);

      records[stand.id] = {
        zoneId: stand.id,
        capacity,
        peopleCount,
        occupancyPercent: roundedPercent,
        status,
        timestamp: currentTimeMs,
        source: "simulation",
        confidence: "approximate",
      };
    }

    this.stepCount++;
    return records;
  }

  public getStepCount(): number {
    return this.stepCount;
  }

  public reset(): void {
    this.stepCount = 0;
    this.startTime = Date.now();
  }
}
