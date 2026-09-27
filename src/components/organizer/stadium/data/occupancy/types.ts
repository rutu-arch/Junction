/**
 * Occupancy Domain Model Types
 *
 * Designed to be consumed identically whether fed by:
 * 1. Simulation Provider (Phase 2B-1)
 * 2. Real-time CCTV / YOLO Computer Vision Provider (Future Phase)
 * 3. Manual Operator Override Provider
 */

export type OccupancyStatus = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type OccupancySource = "simulation" | "cctv" | "manual";

export interface OccupancyRecord {
  zoneId: string;
  capacity: number;
  peopleCount: number;
  occupancyPercent: number; // e.g. 74.2 (%)
  status: OccupancyStatus;
  timestamp: number; // Unix epoch ms
  source: OccupancySource;
  confidence?: "confirmed" | "approximate" | "assumed";
}

export interface ZoneCapacityConfig {
  zoneId: string;
  capacity: number;
  source: "wayfinding" | "ticketing-demo" | "inferred";
  confidence: "confirmed" | "approximate" | "assumed";
  notes?: string;
}

export interface OccupancyThresholds {
  lowMax: number;     // default: 49.9%
  normalMax: number;  // default: 74.9%
  highMax: number;    // default: 89.9%
  criticalMin: number; // default: 90.0%+
}

export interface IOccupancyProvider {
  readonly name: string;
  readonly source: OccupancySource;
  getOccupancy(zoneId: string): OccupancyRecord | undefined;
  getAllOccupancy(): Record<string, OccupancyRecord>;
  subscribe(listener: (records: Record<string, OccupancyRecord>) => void): () => void;
  start(): void;
  stop(): void;
  isRunning(): boolean;
}
