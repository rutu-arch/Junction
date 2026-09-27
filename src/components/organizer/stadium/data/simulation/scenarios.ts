import type { ScenarioType } from "./types";

export interface ScenarioDefinition {
  type: ScenarioType;
  name: string;
  description: string;
  targetDurationSeconds: number;
  // Dynamic arrival generator per gate given elapsed scenario seconds and active operator actions
  getGateArrivalRate: (gateId: string, elapsedSec: number, activeActions: string[]) => number;
  getOutflowRate: (zoneId: string, elapsedSec: number) => number;
}

export const SCENARIO_DEFINITIONS: Record<ScenarioType, ScenarioDefinition> = {
  NORMAL: {
    type: "NORMAL",
    name: "Normal Matchday Operations",
    description: "Stable, balanced stadium arrival conditions across all turnstiles with moderate queues and normal pressure.",
    targetDurationSeconds: 300,
    getGateArrivalRate: (gateId: string, elapsedSec: number) => {
      // Deterministic slight harmonic fluctuation around nominal throughput
      const wave = Math.sin(elapsedSec * 0.05 + (gateId.charCodeAt(0) % 5)) * 4;
      switch (gateId) {
        case "gate-1": return Math.max(15, 28 + wave);
        case "gate-2": return Math.max(12, 22 + wave * 0.8);
        case "gate-3": return Math.max(15, 29 + wave);
        case "gate-4": return Math.max(10, 18 + wave * 0.6);
        case "gate-5": return Math.max(10, 19 + wave * 0.6);
        case "gate-6": return Math.max(15, 27 + wave);
        case "gate-7": return Math.max(12, 21 + wave * 0.8);
        case "vipentry": return Math.max(8, 14 + wave * 0.4);
        case "playersentry": return Math.max(4, 8 + wave * 0.2);
        default: return 20;
      }
    },
    getOutflowRate: (_zoneId: string, _elapsedSec: number) => 5,
  },

  SURGE: {
    type: "SURGE",
    name: "General Arrival Surge",
    description: "City-wide crowd rush 30 minutes prior to toss. All gates experience increased arrivals and expanding queues.",
    targetDurationSeconds: 300,
    getGateArrivalRate: (gateId: string, elapsedSec: number) => {
      const surgeFactor = Math.min(1.8, 1.0 + (elapsedSec / 120) * 0.8);
      const wave = Math.sin(elapsedSec * 0.08) * 3;
      switch (gateId) {
        case "gate-1": return 32 * surgeFactor + wave;
        case "gate-2": return 26 * surgeFactor + wave;
        case "gate-3": return 34 * surgeFactor + wave;
        case "gate-4": return 22 * surgeFactor + wave;
        case "gate-5": return 23 * surgeFactor + wave;
        case "gate-6": return 32 * surgeFactor + wave;
        case "gate-7": return 26 * surgeFactor + wave;
        case "vipentry": return 16 * surgeFactor;
        case "playersentry": return 10 * surgeFactor;
        default: return 25 * surgeFactor;
      }
    },
    getOutflowRate: (_zoneId: string, _elapsedSec: number) => 3,
  },

  NORTH_BUILDUP: {
    type: "NORTH_BUILDUP",
    name: "North Stand Bottleneck & Relief (Primary Demo)",
    description: "Uneven arrival bottleneck at Gate 01 driving North Stand pressure to CRITICAL, triggering actionable concourse re-routing to Gate 02.",
    targetDurationSeconds: 300,
    getGateArrivalRate: (gateId: string, elapsedSec: number, activeActions: string[]) => {
      const isRedistributed = activeActions.includes("REDIRECT_GATE_1_TO_2");

      if (gateId === "gate-1") {
        if (isRedistributed) {
          // Relief phase: arrivals drop dramatically due to steward/screen diversion
          return 18 + Math.sin(elapsedSec * 0.05) * 2;
        }
        if (elapsedSec < 15) {
          return 28; // Initial baseline
        }
        // Rapid surge into Gate 01 (reaching 52 arrivals/min vs 38 throughput)
        const surgeProgress = Math.min(1.0, (elapsedSec - 15) / 45);
        return 28 + surgeProgress * 24 + Math.sin(elapsedSec * 0.1) * 2;
      }

      if (gateId === "gate-2") {
        if (isRedistributed) {
          // Absorbs redirected inflow from Gate 1
          return 42 + Math.sin(elapsedSec * 0.05) * 3;
        }
        if (elapsedSec < 15) return 18;
        // Stays abnormally low during initial bottleneck
        return 14 + Math.sin(elapsedSec * 0.06) * 2;
      }

      if (gateId === "gate-7") {
        if (isRedistributed) return 30;
        return 22 + Math.sin(elapsedSec * 0.04) * 2;
      }

      // Other gates operate normally
      switch (gateId) {
        case "gate-3": return 28 + Math.sin(elapsedSec * 0.05) * 3;
        case "gate-4": return 18 + Math.sin(elapsedSec * 0.05) * 2;
        case "gate-5": return 19 + Math.sin(elapsedSec * 0.05) * 2;
        case "gate-6": return 26 + Math.sin(elapsedSec * 0.05) * 3;
        case "vipentry": return 14;
        case "playersentry": return 8;
        default: return 20;
      }
    },
    getOutflowRate: (_zoneId: string, _elapsedSec: number) => 4,
  },
};
