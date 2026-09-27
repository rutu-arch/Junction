import type { IOccupancyProvider, OccupancyRecord, OccupancySource } from "./types";
import { SimulationEngine } from "../simulation/SimulationEngine";
import type { SimulationSnapshot } from "../simulation/types";

/**
 * Simulation-backed Occupancy Provider.
 * Implements IOccupancyProvider to broadcast deterministic occupancy records
 * derived from the unified SimulationEngine.
 */
export class SimulationOccupancyProvider implements IOccupancyProvider {
  public readonly name: string = "Deterministic Stadium Operations Simulation";
  public readonly source: OccupancySource = "simulation";

  public readonly engine: SimulationEngine;
  private timer: number | null = null;
  private currentRecords: Record<string, OccupancyRecord> = {};
  private listeners: Set<(records: Record<string, OccupancyRecord>) => void> = new Set();
  private updateIntervalMs: number = 1000;

  constructor(engine?: SimulationEngine) {
    this.engine = engine || new SimulationEngine("NORTH_BUILDUP");
    this.syncRecordsFromSnapshot(this.engine.getSnapshot());

    // Subscribe to engine state
    this.engine.subscribe((snapshot) => {
      this.syncRecordsFromSnapshot(snapshot);
      this.notifyListeners();
    });
  }

  private syncRecordsFromSnapshot(snapshot: SimulationSnapshot): void {
    const records: Record<string, OccupancyRecord> = {};
    for (const [zoneId, zState] of Object.entries(snapshot.zones)) {
      records[zoneId] = {
        zoneId,
        capacity: zState.capacity,
        peopleCount: zState.peopleCount,
        occupancyPercent: zState.occupancyPercent,
        status: zState.status,
        timestamp: Date.now(),
        source: "simulation",
        confidence: "confirmed",
      };
    }
    this.currentRecords = records;
  }

  public getOccupancy(zoneId: string): OccupancyRecord | undefined {
    return this.currentRecords[zoneId];
  }

  public getAllOccupancy(): Record<string, OccupancyRecord> {
    return this.currentRecords;
  }

  public subscribe(listener: (records: Record<string, OccupancyRecord>) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentRecords);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public start(): void {
    if (this.timer !== null) return;

    this.timer = window.setInterval(() => {
      this.engine.tick(1.0);
    }, this.updateIntervalMs);
  }

  public stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public isRunning(): boolean {
    return this.timer !== null && !this.engine.getSnapshot().clock.isPaused;
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentRecords);
    }
  }
}

