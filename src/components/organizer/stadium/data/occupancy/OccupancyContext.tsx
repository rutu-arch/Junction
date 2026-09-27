import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import type { OccupancyRecord, IOccupancyProvider, OccupancyStatus } from "./types";
import { SimulationOccupancyProvider } from "./provider";
import { SimulationEngine } from "../simulation/SimulationEngine";
import type {
  SimulationSnapshot,
  ScenarioType,
  Situation,
  Recommendation,
  GateSimulationState,
  ZoneSimulationState,
} from "../simulation/types";

interface OccupancyContextValue {
  records: Record<string, OccupancyRecord>;
  getZoneOccupancy: (zoneId: string) => OccupancyRecord | undefined;
  isSimulating: boolean;
  toggleSimulation: () => void;
  lastUpdated: number;
  providerName: string;
  providerSource: string;
  stadiumTotals: {
    totalPeople: number;
    totalCapacity: number;
    overallPercent: number;
    overallStatus: OccupancyStatus;
    overallPressure: number;
    totalQueueLength: number;
  };

  // Rich Simulation & Operations Intelligence
  snapshot: SimulationSnapshot;
  scenario: ScenarioType;
  setScenario: (s: ScenarioType) => void;
  speedMultiplier: number;
  setSpeed: (speed: number) => void;
  isPaused: boolean;
  togglePause: () => void;
  resetSimulation: () => void;
  applyOperatorAction: (actionKey: string) => void;
  acknowledgeRecommendation: (recId: string) => void;
  activeSituations: Situation[];
  activeRecommendations: Recommendation[];
  gateStates: Record<string, GateSimulationState>;
  zoneStates: Record<string, ZoneSimulationState>;
}

const OccupancyContext = createContext<OccupancyContextValue | null>(null);

// Shared singleton simulation engine instance
const sharedEngine = new SimulationEngine("NORTH_BUILDUP");
const defaultProvider: SimulationOccupancyProvider = new SimulationOccupancyProvider(sharedEngine);

interface OccupancyProviderProps {
  children: React.ReactNode;
  provider?: IOccupancyProvider;
}

export const OccupancyDataProvider: React.FC<OccupancyProviderProps> = ({
  children,
  provider = defaultProvider,
}) => {
  const [records, setRecords] = useState<Record<string, OccupancyRecord>>(() => provider.getAllOccupancy());
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() => sharedEngine.getSnapshot());
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  useEffect(() => {
    provider.start();
    setIsSimulating(provider.isRunning());

    const unsubProvider = provider.subscribe((newRecords) => {
      setRecords(newRecords);
      setLastUpdated(Date.now());
    });

    const unsubEngine = sharedEngine.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });

    return () => {
      unsubProvider();
      unsubEngine();
      provider.stop();
    };
  }, [provider]);

  const toggleSimulation = useCallback(() => {
    sharedEngine.togglePause();
    setIsSimulating(!sharedEngine.getSnapshot().clock.isPaused);
  }, []);

  const getZoneOccupancy = useCallback(
    (zoneId: string) => records[zoneId],
    [records]
  );

  const setScenario = useCallback((s: ScenarioType) => {
    sharedEngine.setScenario(s);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    sharedEngine.setSpeed(speed);
  }, []);

  const togglePause = useCallback(() => {
    sharedEngine.togglePause();
    setIsSimulating(!sharedEngine.getSnapshot().clock.isPaused);
  }, []);

  const resetSimulation = useCallback(() => {
    sharedEngine.reset();
  }, []);

  const applyOperatorAction = useCallback((actionKey: string) => {
    sharedEngine.applyOperatorAction(actionKey);
  }, []);

  const acknowledgeRecommendation = useCallback((recId: string) => {
    sharedEngine.acknowledgeRecommendation(recId);
  }, []);

  const value = useMemo<OccupancyContextValue>(
    () => ({
      records,
      getZoneOccupancy,
      isSimulating,
      toggleSimulation,
      lastUpdated,
      providerName: provider.name,
      providerSource: provider.source,
      stadiumTotals: snapshot.stadiumTotals,
      snapshot,
      scenario: snapshot.scenario,
      setScenario,
      speedMultiplier: snapshot.clock.speedMultiplier,
      setSpeed,
      isPaused: snapshot.clock.isPaused,
      togglePause,
      resetSimulation,
      applyOperatorAction,
      acknowledgeRecommendation,
      activeSituations: snapshot.situations,
      activeRecommendations: snapshot.recommendations,
      gateStates: snapshot.gates,
      zoneStates: snapshot.zones,
    }),
    [
      records,
      getZoneOccupancy,
      isSimulating,
      toggleSimulation,
      lastUpdated,
      provider,
      snapshot,
      setScenario,
      setSpeed,
      togglePause,
      resetSimulation,
      applyOperatorAction,
      acknowledgeRecommendation,
    ]
  );

  return <OccupancyContext.Provider value={value}>{children}</OccupancyContext.Provider>;
};

export function useOccupancy(): OccupancyContextValue {
  const context = useContext(OccupancyContext);
  if (!context) {
    throw new Error("useOccupancy must be used within an OccupancyDataProvider");
  }
  return context;
}
