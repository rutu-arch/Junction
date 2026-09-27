import type { OccupancyStatus } from "../occupancy/types";

export type TrendDirection = "RISING" | "STABLE" | "FALLING";

export type ScenarioType = "NORMAL" | "SURGE" | "NORTH_BUILDUP";

export type SeverityLevel = "INFO" | "WARNING" | "CRITICAL";

export type RecommendationStatus = "ACTIVE" | "ACKNOWLEDGED" | "APPLIED" | "RESOLVING" | "RESOLVED";

export interface SimulationClockState {
  simTimeSeconds: number; // Elapsed simulated seconds (e.g. starts at 14:00:00 = 50400s)
  formattedTime: string;  // e.g. "14:12"
  speedMultiplier: number; // 1, 2, 5, 10
  isPaused: boolean;
  tickCount: number;
}

export interface GateSimulationState {
  id: string;
  name: string;
  gateCode: string;
  type: "public" | "vip" | "players" | "media";
  connectedZoneIds: string[];
  nominalCapacity: number;
  inflowRate: number;      // arrivals / min
  throughputRate: number;  // processed / min
  queueLength: number;     // people currently in queue
  pressurePercent: number; // 0 - 100%
  status: OccupancyStatus;
  trend: TrendDirection;
  recentQueueHistory: number[];
  recentPressureHistory: number[];
}

export interface ZoneSimulationState {
  id: string;
  name: string;
  shortLabel: string;
  capacity: number;
  peopleCount: number;
  occupancyPercent: number; // 0 - 100%
  inflowRate: number;       // people entering / min
  outflowRate: number;      // people exiting / min
  pressurePercent: number;  // 0 - 100%
  status: OccupancyStatus;
  trend: TrendDirection;
  connectedGateIds: string[];
  recentOccupancyHistory: number[];
  recentPressureHistory: number[];
}

export interface Situation {
  id: string;
  code: string;
  title: string;
  severity: SeverityLevel;
  affectedZoneIds: string[];
  affectedGateIds: string[];
  description: string;
  detectedAtSimTime: string;
  status: "ACTIVE" | "RESOLVING" | "RESOLVED";
}

export interface Recommendation {
  id: string;
  situationId: string;
  severity: SeverityLevel;
  title: string;
  explanation: string;
  suggestedAction: string;
  actionKey: "REDIRECT_GATE_1_TO_2" | "BOOST_GATE_THROUGHPUT" | "STANDARD_MONITOR";
  affectedZones: string[];
  affectedGates: string[];
  reasons: string[];
  confidence: "confirmed" | "approximate" | "inferred";
  timestamp: string;
  status: RecommendationStatus;
  resolvedAtSimTime?: string;
}

export interface SimulationSnapshot {
  clock: SimulationClockState;
  scenario: ScenarioType;
  scenarioName: string;
  zones: Record<string, ZoneSimulationState>;
  gates: Record<string, GateSimulationState>;
  situations: Situation[];
  recommendations: Recommendation[];
  activeOperatorActions: string[];
  stadiumTotals: {
    totalPeople: number;
    totalCapacity: number;
    overallPercent: number;
    overallStatus: OccupancyStatus;
    overallPressure: number;
    totalQueueLength: number;
  };
}
