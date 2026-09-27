import type {
  SimulationSnapshot,
  SimulationClockState,
  ScenarioType,
  GateSimulationState,
  ZoneSimulationState,
  TrendDirection,
} from "./types";
import { STADIUM_STANDS } from "../stadium/stands";
import { STADIUM_GATES } from "../stadium/gates";
import { ZONE_CAPACITIES } from "../occupancy/capacities";
import { getOccupancyStatus } from "../occupancy/status";
import { GATE_TOPOLOGY, getConnectedGatesForZone } from "./gateTopology";
import { SCENARIO_DEFINITIONS } from "./scenarios";
import { analyzeStadiumOperations } from "./situationAnalyzer";

/**
 * Calculates temporal trend from a bounded rolling history.
 */
function calculateTrend(history: number[], threshold: number = 1.2): TrendDirection {
  if (history.length < 3) return "STABLE";
  const recent = history.slice(-3);
  const oldest = history.slice(0, 3);
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const avgOld = oldest.reduce((a, b) => a + b, 0) / oldest.length;
  const delta = avgRecent - avgOld;

  if (delta > threshold) return "RISING";
  if (delta < -threshold) return "FALLING";
  return "STABLE";
}

/**
 * Deterministic Stadium Operations Simulation Engine.
 */
export class SimulationEngine {
  private scenario: ScenarioType = "NORTH_BUILDUP";
  private simTimeSeconds: number = 14 * 3600; // 14:00:00 start
  private elapsedScenarioSeconds: number = 0;
  private speedMultiplier: number = 1;
  private isPaused: boolean = false;
  private tickCount: number = 0;

  private activeOperatorActions: Set<string> = new Set();
  private acknowledgedRecIds: Set<string> = new Set();

  private gates: Record<string, GateSimulationState> = {};
  private zones: Record<string, ZoneSimulationState> = {};

  private listeners: Set<(snapshot: SimulationSnapshot) => void> = new Set();

  constructor(initialScenario: ScenarioType = "NORTH_BUILDUP") {
    this.scenario = initialScenario;
    this.initializeState();
  }

  /**
   * Initializes baseline deterministic gate and zone state.
   */
  private initializeState(): void {
    // 1. Initialize Gates
    this.gates = {};
    for (const gate of STADIUM_GATES) {
      const topo = GATE_TOPOLOGY[gate.id];
      const nominalThroughput = topo ? topo.nominalThroughput : 30;
      const initialQueue = gate.type === "vip" ? 8 : gate.type === "players" ? 2 : 28;

      this.gates[gate.id] = {
        id: gate.id,
        name: gate.name,
        gateCode: gate.gateCode,
        type: gate.type,
        connectedZoneIds: topo ? topo.connectedZones.map((z) => z.zoneId) : ["north"],
        nominalCapacity: 150,
        inflowRate: 25,
        throughputRate: nominalThroughput,
        queueLength: initialQueue,
        pressurePercent: 35,
        status: "NORMAL",
        trend: "STABLE",
        recentQueueHistory: [initialQueue, initialQueue],
        recentPressureHistory: [35, 35],
      };
    }

    // 2. Initialize Stand Zones
    this.zones = {};
    for (const stand of STADIUM_STANDS) {
      const capacity = ZONE_CAPACITIES[stand.id]?.capacity || stand.approxCapacity || 5000;
      let initialOccupancyPct = 68.0;
      if (stand.id === "north") initialOccupancyPct = 74.0;
      else if (stand.id === "mca") initialOccupancyPct = 88.0;
      else if (stand.id === "divecha") initialOccupancyPct = 52.0;

      const peopleCount = Math.round((initialOccupancyPct / 100) * capacity);
      const connectedGates = getConnectedGatesForZone(stand.id);

      this.zones[stand.id] = {
        id: stand.id,
        name: stand.name,
        shortLabel: stand.shortLabel,
        capacity,
        peopleCount,
        occupancyPercent: initialOccupancyPct,
        inflowRate: 28,
        outflowRate: 4,
        pressurePercent: initialOccupancyPct,
        status: getOccupancyStatus(initialOccupancyPct),
        trend: "STABLE",
        connectedGateIds: connectedGates,
        recentOccupancyHistory: [initialOccupancyPct, initialOccupancyPct],
        recentPressureHistory: [initialOccupancyPct, initialOccupancyPct],
      };
    }
  }

  /**
   * Advances the simulation by `dtSeconds` simulated seconds.
   */
  public tick(dtSeconds: number = 1.0): SimulationSnapshot {
    if (this.isPaused) {
      return this.getSnapshot();
    }

    const effectiveDt = dtSeconds * this.speedMultiplier;
    this.simTimeSeconds += effectiveDt;
    this.elapsedScenarioSeconds += effectiveDt;
    this.tickCount++;

    const scenarioDef = SCENARIO_DEFINITIONS[this.scenario];
    const activeActionsList = Array.from(this.activeOperatorActions);

    // Track newly entered people per zone during this tick
    const zoneEntrantsThisTick: Record<string, number> = {};
    for (const stand of STADIUM_STANDS) {
      zoneEntrantsThisTick[stand.id] = 0;
    }

    // =========================================================================
    // 1. Update Gate Arrivals, Queues, and Throughput
    // =========================================================================
    for (const gate of STADIUM_GATES) {
      const gState = this.gates[gate.id];
      if (!gState) continue;

      const topo = GATE_TOPOLOGY[gate.id];
      const arrivalRate = scenarioDef.getGateArrivalRate(gate.id, this.elapsedScenarioSeconds, activeActionsList);
      gState.inflowRate = Number(arrivalRate.toFixed(1));

      // Effective turnstile processing throughput (people per minute converted to dt step)
      const nominalThroughput = topo ? topo.nominalThroughput : 30;
      gState.throughputRate = nominalThroughput;

      // Queue flow balance: Queue(t+1) = Queue(t) + Arrivals - Processed
      const arrivalsThisTick = (arrivalRate / 60) * effectiveDt;
      const maxProcessedThisTick = (nominalThroughput / 60) * effectiveDt;

      const actualProcessedThisTick = Math.min(gState.queueLength + arrivalsThisTick, maxProcessedThisTick);
      const newQueue = Math.max(0, gState.queueLength + arrivalsThisTick - actualProcessedThisTick);

      gState.queueLength = Math.round(newQueue);

      // Gate Pressure Calculation (Queue load + Arrival throughput ratio)
      const queuePressure = Math.min(100, (gState.queueLength / 120) * 85);
      const flowRatioPressure = Math.min(100, (arrivalRate / nominalThroughput) * 50);
      const combinedGatePressure = Number(Math.min(100, queuePressure * 0.65 + flowRatioPressure * 0.35).toFixed(1));

      gState.pressurePercent = combinedGatePressure;
      gState.status = getOccupancyStatus(combinedGatePressure);

      // Maintain rolling history
      gState.recentQueueHistory.push(gState.queueLength);
      if (gState.recentQueueHistory.length > 12) gState.recentQueueHistory.shift();

      gState.recentPressureHistory.push(combinedGatePressure);
      if (gState.recentPressureHistory.length > 12) gState.recentPressureHistory.shift();

      gState.trend = calculateTrend(gState.recentPressureHistory, 1.0);

      // Distribute processed entrants to connected zones based on topology split
      if (topo) {
        for (const split of topo.connectedZones) {
          if (zoneEntrantsThisTick[split.zoneId] !== undefined) {
            zoneEntrantsThisTick[split.zoneId] += actualProcessedThisTick * split.flowWeight;
          }
        }
      }
    }

    // =========================================================================
    // 2. Update Stand Zone Occupancies, Inflow, Outflow, and Pressure
    // =========================================================================
    for (const stand of STADIUM_STANDS) {
      const zState = this.zones[stand.id];
      if (!zState) continue;

      const entrants = zoneEntrantsThisTick[stand.id] || 0;
      const inflowPerMin = (entrants / effectiveDt) * 60;
      zState.inflowRate = Number(inflowPerMin.toFixed(1));

      const outflowPerMin = scenarioDef.getOutflowRate(stand.id, this.elapsedScenarioSeconds);
      zState.outflowRate = outflowPerMin;
      const exitsThisTick = (outflowPerMin / 60) * effectiveDt;

      // Update Population Count
      const newPeople = Math.max(0, Math.min(zState.capacity, zState.peopleCount + entrants - exitsThisTick));
      zState.peopleCount = Math.round(newPeople);

      const occPercent = Number(((zState.peopleCount / zState.capacity) * 100).toFixed(1));
      zState.occupancyPercent = occPercent;
      zState.status = getOccupancyStatus(occPercent);

      // Zone Pressure incorporates occupancy saturation and rapid inflow
      const inflowPressure = Math.min(100, (inflowPerMin / 40) * 80);
      const zonePressure = Number(Math.min(100, occPercent * 0.75 + inflowPressure * 0.25).toFixed(1));
      zState.pressurePercent = zonePressure;

      // Maintain rolling history
      zState.recentOccupancyHistory.push(occPercent);
      if (zState.recentOccupancyHistory.length > 12) zState.recentOccupancyHistory.shift();

      zState.recentPressureHistory.push(zonePressure);
      if (zState.recentPressureHistory.length > 12) zState.recentPressureHistory.shift();

      zState.trend = calculateTrend(zState.recentOccupancyHistory, 0.8);
    }

    const snapshot = this.getSnapshot();
    this.notifyListeners(snapshot);
    return snapshot;
  }

  /**
   * Generates formatted snapshot including Situation Detection and Explainable Recommendations.
   */
  public getSnapshot(): SimulationSnapshot {
    const hours = Math.floor(this.simTimeSeconds / 3600) % 24;
    const mins = Math.floor((this.simTimeSeconds % 3600) / 60);
    const secs = Math.floor(this.simTimeSeconds % 60);
    const formattedTime = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

    const clock: SimulationClockState = {
      simTimeSeconds: this.simTimeSeconds,
      formattedTime,
      speedMultiplier: this.speedMultiplier,
      isPaused: this.isPaused,
      tickCount: this.tickCount,
    };

    // Run Situation Analyzer
    const activeActionsList = Array.from(this.activeOperatorActions);
    const { situations, recommendations } = analyzeStadiumOperations(
      this.zones,
      this.gates,
      activeActionsList,
      formattedTime
    );

    // Apply persistent acknowledgement states
    for (const rec of recommendations) {
      if (this.acknowledgedRecIds.has(rec.id) && rec.status === "ACTIVE") {
        rec.status = "ACKNOWLEDGED";
      }
    }

    // High-level aggregates
    let totalPeople = 0;
    let totalCapacity = 0;
    let totalQueueLength = 0;
    let pressureSum = 0;

    for (const z of Object.values(this.zones)) {
      totalPeople += z.peopleCount;
      totalCapacity += z.capacity;
      pressureSum += z.pressurePercent;
    }

    for (const g of Object.values(this.gates)) {
      totalQueueLength += g.queueLength;
    }

    const overallPercent = totalCapacity > 0 ? Number(((totalPeople / totalCapacity) * 100).toFixed(1)) : 0;
    const overallPressure = Object.keys(this.zones).length > 0 ? Number((pressureSum / Object.keys(this.zones).length).toFixed(1)) : 0;

    return {
      clock,
      scenario: this.scenario,
      scenarioName: SCENARIO_DEFINITIONS[this.scenario].name,
      zones: { ...this.zones },
      gates: { ...this.gates },
      situations,
      recommendations,
      activeOperatorActions: activeActionsList,
      stadiumTotals: {
        totalPeople,
        totalCapacity,
        overallPercent,
        overallStatus: getOccupancyStatus(overallPercent),
        overallPressure,
        totalQueueLength,
      },
    };
  }

  // =========================================================================
  // Operator Interaction & Simulation Controls
  // =========================================================================

  public setScenario(scenario: ScenarioType): void {
    this.scenario = scenario;
    this.elapsedScenarioSeconds = 0;
    this.activeOperatorActions.clear();
    this.acknowledgedRecIds.clear();
    this.initializeState();
    this.notifyListeners(this.getSnapshot());
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = Math.max(1, Math.min(10, multiplier));
    this.notifyListeners(this.getSnapshot());
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    this.notifyListeners(this.getSnapshot());
    return this.isPaused;
  }

  public applyOperatorAction(actionKey: string): void {
    this.activeOperatorActions.add(actionKey);
    this.notifyListeners(this.getSnapshot());
  }

  public acknowledgeRecommendation(recId: string): void {
    this.acknowledgedRecIds.add(recId);
    this.notifyListeners(this.getSnapshot());
  }

  public reset(): void {
    this.simTimeSeconds = 14 * 3600;
    this.elapsedScenarioSeconds = 0;
    this.tickCount = 0;
    this.activeOperatorActions.clear();
    this.acknowledgedRecIds.clear();
    this.initializeState();
    this.notifyListeners(this.getSnapshot());
  }

  public subscribe(listener: (snapshot: SimulationSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(snapshot: SimulationSnapshot): void {
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
