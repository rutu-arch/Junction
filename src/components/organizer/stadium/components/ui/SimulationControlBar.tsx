import React from "react";
import { useOccupancy } from "../../data/occupancy";
import type { ScenarioType } from "../../data/simulation/types";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  Activity,
} from "lucide-react";

export const SimulationControlBar: React.FC = () => {
  const {
    snapshot,
    scenario,
    setScenario,
    speedMultiplier,
    setSpeed,
    isPaused,
    togglePause,
    resetSimulation,
  } = useOccupancy();

  const scenarios: { key: ScenarioType; label: string; desc: string }[] = [
    { key: "NORTH_BUILDUP", label: "NORTH BUILDUP (DEMO)", desc: "Gate 01 bottleneck -> Recommendation -> Concourse Diversion Relief" },
    { key: "SURGE", label: "ARRIVAL SURGE", desc: "Uniform high-density arrival surge across all turnstiles" },
    { key: "NORMAL", label: "NORMAL OPS", desc: "Balanced steady-state matchday operations" },
  ];

  return (
    <div className="sim-control-bar pointer-events-auto">
      {/* Simulation Clock & Status */}
      <div className="sim-clock-group">
        <Clock size={12} className="text-cyan" />
        <span className="sim-clock-label">SIM TIME</span>
        <span className="sim-clock-val">{snapshot.clock.formattedTime}</span>
        <span className="sim-clock-speed-badge">{speedMultiplier}x</span>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="sim-scenario-group">
        <Activity size={12} className="text-cyan-muted" />
        <span className="sim-scenario-label">SCENARIO:</span>
        <div className="sim-scenario-tabs">
          {scenarios.map((sc) => (
            <button
              key={sc.key}
              className={`sim-tab-btn ${scenario === sc.key ? "active" : ""}`}
              onClick={() => setScenario(sc.key)}
              title={sc.desc}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Play / Pause / Reset & Speed Controls */}
      <div className="sim-playback-group">
        <button
          className={`sim-playback-btn ${isPaused ? "paused" : "playing"}`}
          onClick={togglePause}
          title={isPaused ? "Resume Simulation" : "Pause Simulation"}
        >
          {isPaused ? <Play size={12} /> : <Pause size={12} />}
          <span>{isPaused ? "PLAY" : "PAUSE"}</span>
        </button>

        <button
          className="sim-playback-btn"
          onClick={resetSimulation}
          title="Reset Simulation Clock & State"
        >
          <RotateCcw size={12} />
          <span>RESET</span>
        </button>

        <div className="sim-speed-selector">
          <FastForward size={11} className="text-cyan-muted" />
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              className={`sim-spd-btn ${speedMultiplier === spd ? "active" : ""}`}
              onClick={() => setSpeed(spd)}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
