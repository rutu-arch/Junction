"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/state/AppContext";
import { getPressureColor } from "@/components/ui/PressureIndicator";
import { MVP_NETWORK_EDGES } from "@/data/mockNetworkTopology";
import { Clock, Play, Pause, RotateCcw, Check, CloudRain, Droplets, Wind, Thermometer, ArrowRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import styles from "./simulation.module.css";


const RESOURCE_NAMES: Record<string, string> = {
  CHURCHGATE: "Churchgate Station",
  WANKHEDE_EXIT: "Wankhede Exit",
  TAXI_ZONE: "Taxi Zone",
  DADAR: "Dadar Station",
  CSMT: "CSMT Terminal",
  MARINE_LINES: "Marine Lines",
};

const RESOURCE_CAPACITIES: Record<string, number> = {
  WANKHEDE_EXIT: 4000,
  CHURCHGATE: 10000,
  TAXI_ZONE: 400,
  MARINE_LINES: 8000,
  CSMT: 14000,
  DADAR: 18000,
};

function SimulationContent() {
  const {
    activeScenario,
    recommendations,
    approveRecommendation,
    isRecommendationApproved,
    simulationState,
    playSimulation,
    pauseSimulation,
    resetSimulation,
    setSimulationSpeed,
    simParams,
    updateSimParams,
    redistributionApplied,
    weatherState,
    weatherTwinParams,
    setWeatherTwinParams,
    weatherImpact,
    weatherScenarioActive,
    runWeatherTwin,
    resetWeatherTwin,
    weatherAdjustedZones,
    zones,
  } = useApp();

  const searchParams = useSearchParams();
  const recId = searchParams.get("rec");
  const scenarioQuery = searchParams.get("scenario");
  const linkedRec = recommendations.find(r => r.id === recId);

  const [simMode, setSimMode] = React.useState<"STANDARD" | "WEATHER_TWIN">(
    scenarioQuery === "weather" || weatherScenarioActive ? "WEATHER_TWIN" : "STANDARD"
  );

  const setModeAndSync = (m: "STANDARD" | "WEATHER_TWIN") => {
    setSimMode(m);
    if (m === "WEATHER_TWIN" && !weatherScenarioActive) {
      runWeatherTwin();
    }
  };

  const isRunning = simulationState.status === "PLAYING";
  const isPaused = simulationState.status === "PAUSED";

  // Calculate live telemetry metrics
  const totalInTransit = Object.values(simulationState.edgeLoads).reduce((a, b) => a + b, 0);
  const totalAccumulated = Object.values(simulationState.nodeLoads).reduce((a, b) => a + b, 0);
  const activeCohorts = simulationState.humanCohorts.filter(c => c.status === "MOVING");

  const handleApproveIntervention = () => {
    if (recId) {
      approveRecommendation(recId);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        category="SIMULATE"
        title="Time-Stepped Destination Simulation"
        subtitle="Aggregate human cohort simulation advancing through South Mumbai geographic network with real-time flow conservation."
        actions={<span className="pill pill-simulated">SIMULATED DESTINATION MODEL</span>}
      />

      {/* 1. SCENARIO SUMMARY — WHAT AM I TESTING? WHAT HAPPENED? DID IT HELP? */}
      <div className={styles.scenarioSummaryCard}>
        <div className={styles.scenarioSummaryBlock}>
          <span className={styles.scenarioSummaryStepTag}>WHAT AM I TESTING?</span>
          <span className={styles.scenarioSummaryTitle}>
            {linkedRec ? linkedRec.title : `Scenario: ${activeScenario.replace(/_/g, " ")}`}
          </span>
          <span className={styles.scenarioSummarySub}>
            {linkedRec ? `Recommendation intervention alters downstream cohort distribution at runtime.` : `Full cohort simulation across South Mumbai destination network.`}
          </span>
          {linkedRec && (
            <span className="pill pill-yellow" style={{ width: "fit-content", fontSize: 10 }}>INTERVENTION LINKED</span>
          )}
        </div>

        <div className={styles.scenarioSummaryBlock}>
          <span className={styles.scenarioSummaryStepTag}>WHAT HAPPENED?</span>
          <span className={styles.scenarioSummaryTitle}>
            {simulationState.status === "IDLE" ? "Not Started" : `${Math.round(simulationState.minutesElapsed)} min Elapsed`}
          </span>
          <span className={styles.scenarioSummaryValue} style={{ color: simulationState.status === "PLAYING" ? "var(--green)" : "var(--ink)" }}>
            {simulationState.totalExitedVenue.toLocaleString()} exited venue
          </span>
          <span className={styles.scenarioSummarySub}>{activeCohorts.length} cohorts currently in transit</span>
        </div>

        <div className={styles.scenarioSummaryBlock}>
          <span className={styles.scenarioSummaryStepTag}>DID IT HELP?</span>
          <span className={styles.scenarioSummaryTitle}>
            {totalAccumulated > 6000 ? "High queue accumulation" : totalAccumulated > 0 ? "Moderate flow" : "Awaiting simulation"}
          </span>
          <span className={styles.scenarioSummaryValue} style={{ color: totalAccumulated > 6000 ? "var(--red)" : "var(--green)" }}>
            {totalAccumulated > 0 ? `${totalAccumulated.toLocaleString()} queued` : "—"}
          </span>
          <span className={styles.scenarioSummarySub}>
            {simulationState.status === "IDLE"
              ? "Press PLAY to begin the simulation"
              : `Flow conservation: ${totalInTransit.toLocaleString()} + ${totalAccumulated.toLocaleString()} + ${Math.round(simulationState.totalCleared).toLocaleString()} cleared`}
          </span>
        </div>
      </div>


      {/* LINKED RECOMMENDATION INTERVENTION BANNER */}
      {linkedRec && (
        <div style={{
          background: "var(--paper)",
          border: "1.5px solid var(--yellow-state)",
          borderRadius: "var(--radius-md)",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="pill pill-yellow">SIMULATING RECOMMENDATION</span>
              <strong style={{ fontSize: 14 }}>{linkedRec.id}: {linkedRec.title}</strong>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 4 }}>
              Recommendation intervention will alter downstream cohort distribution at runtime without rewriting history.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="btn btn-yellow btn-sm"
              onClick={handleApproveIntervention}
              disabled={isRecommendationApproved(linkedRec.id)}
            >
              {isRecommendationApproved(linkedRec.id) ? "APPROVED" : "APPROVE THIS INTERVENTION →"}
            </button>
            <Link href="/organizer/recommendations" className="btn btn-outline btn-sm">
              Back to Recs
            </Link>
          </div>
        </div>
      )}

      {/* SIMULATION COMMAND CONSOLE */}
      <div className={styles.simConsole}>
        <div className={styles.clockGroup}>
          <Clock size={18} className={styles.clockIcon} />
          <div className={styles.clockDetails}>
            <span className={styles.clockLabel}>SIMULATION CLOCK</span>
            <span className={styles.clockTime}>{simulationState.simulationTime}</span>
            <span className={styles.elapsedTag}>
              +{simulationState.minutesElapsed} min elapsed · Scenario: {activeScenario.replace(/_/g, " ")}
            </span>
          </div>
          <span className={`${styles.statusPill} ${isRunning ? styles.statusRunning : isPaused ? styles.statusPaused : styles.statusIdle
            }`}>
            {isRunning ? "RUNNING" : isPaused ? "PAUSED" : "IDLE"}
          </span>
        </div>

        <div className={styles.consoleActions}>
          <div className={styles.btnGroup}>
            {isRunning ? (
              <button className={styles.btnPause} onClick={pauseSimulation}>
                <Pause size={14} /> PAUSE
              </button>
            ) : (
              <button className={styles.btnPlay} onClick={playSimulation}>
                <Play size={14} /> PLAY SIMULATION
              </button>
            )}
            <button className={styles.btnReset} onClick={resetSimulation}>
              <RotateCcw size={14} /> RESET
            </button>
          </div>

          <div className={styles.speedGroup}>
            <span className={styles.speedLabel}>Speed:</span>
            {([1, 5, 10] as const).map(s => (
              <button
                key={s}
                className={`${styles.speedBtn} ${simulationState.speed === s ? styles.speedActive : ""}`}
                onClick={() => setSimulationSpeed(s)}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TELEMETRY STRIP */}
      <div className={styles.telemetryStrip}>
        <div className={styles.telemetryCard}>
          <span className={styles.telemetryLabel}>Total Exited Venue</span>
          <span className={styles.telemetryVal}>{simulationState.totalExitedVenue.toLocaleString()}</span>
          <span className={styles.telemetrySub}>people departed Wankhede</span>
        </div>
        <div className={styles.telemetryCard}>
          <span className={styles.telemetryLabel}>In-Transit on Edges</span>
          <span className={styles.telemetryVal} style={{ color: "var(--ink)" }}>
            {totalInTransit.toLocaleString()}
          </span>
          <span className={styles.telemetrySub}>across {activeCohorts.length} active cohorts</span>
        </div>
        <div className={styles.telemetryCard}>
          <span className={styles.telemetryLabel}>Accumulated at Nodes</span>
          <span className={styles.telemetryVal} style={{ color: totalAccumulated > 6000 ? "var(--red)" : "var(--ink)" }}>
            {totalAccumulated.toLocaleString()}
          </span>
          <span className={styles.telemetrySub}>waiting / queuing at hubs</span>
        </div>
        <div className={styles.telemetryCard}>
          <span className={styles.telemetryLabel}>Flow Conservation</span>
          <span className={styles.telemetryVal} style={{ color: "var(--green)", fontSize: 18 }}>
            ✓ 100% Conserved
          </span>
          <span className={styles.telemetrySub}>
            Transit ({totalInTransit.toLocaleString()}) + Queue ({totalAccumulated.toLocaleString()}) + Cleared ({Math.round(simulationState.totalCleared).toLocaleString()})
          </span>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className={styles.grid}>
        {/* LEFT COLUMN: SCENARIO CONTROLS */}
        <div className={styles.controls}>
          {/* Mode Switcher: Standard Parameters vs Weather Digital Twin */}
          <div className={styles.weatherModeSwitcher}>
            <button
              type="button"
              className={`${styles.weatherModeBtn} ${simMode === "STANDARD" ? styles.weatherModeBtnActive : ""}`}
              onClick={() => setModeAndSync("STANDARD")}
            >
              Standard Params
            </button>
            <button
              type="button"
              className={`${styles.weatherModeBtn} ${simMode === "WEATHER_TWIN" ? styles.weatherModeBtnActive : ""}`}
              onClick={() => setModeAndSync("WEATHER_TWIN")}
            >
              Weather Twin
            </button>
          </div>

          {simMode === "WEATHER_TWIN" ? (
            <>
              <h3 className={styles.controlsTitle}>Weather Digital Twin</h3>

              {/* Baseline Live Meteorological Context */}
              <div className={styles.weatherBaselineCard}>
                <div className={styles.weatherBaselineHeader}>
                  <span className={styles.weatherBaselineTitle}>Live Weather Baseline</span>
                  <span
                    className={`pill ${weatherState?.source === "LIVE" ? "pill-live" : "pill-watch"}`}
                    style={{ fontSize: 9 }}
                  >
                    {weatherState?.source === "LIVE" ? "LIVE METEOROLOGY" : "DEGRADED CACHE"}
                  </span>
                </div>
                <div className={styles.weatherMetricsRow}>
                  <div className={styles.weatherMetricItem}>
                    <span className={styles.weatherMetricVal}>{weatherState?.temperature ?? 29}°C</span>
                    <span className={styles.weatherMetricLbl}>Temp</span>
                  </div>
                  <div className={styles.weatherMetricItem}>
                    <span className={styles.weatherMetricVal}>{weatherState?.rainfall ?? 0} mm/h</span>
                    <span className={styles.weatherMetricLbl}>Rain</span>
                  </div>
                  <div className={styles.weatherMetricItem}>
                    <span className={styles.weatherMetricVal}>{weatherState?.humidity ?? 74}%</span>
                    <span className={styles.weatherMetricLbl}>Humidity</span>
                  </div>
                  <div className={styles.weatherMetricItem}>
                    <span className={styles.weatherMetricVal}>{weatherState?.windSpeed ?? 14} km/h</span>
                    <span className={styles.weatherMetricLbl}>Wind</span>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: "var(--ink-muted)", marginTop: 2 }}>
                  Condition: <strong>{weatherState?.condition ?? "Partly Cloudy"}</strong> · Wankhede Concourse
                </span>
              </div>

              {/* Weather Twin Adjustments */}
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>
                  Rainfall Intensity: {weatherTwinParams.rainfallIntensity} mm/h
                </label>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={2}
                  value={weatherTwinParams.rainfallIntensity}
                  onChange={e => setWeatherTwinParams({ rainfallIntensity: Number(e.target.value) })}
                  className={styles.slider}
                />
                <div className={styles.sliderRange}><span>0 mm (Dry)</span><span>60 mm (Cloudburst)</span></div>
                <div className={styles.segmented} style={{ marginTop: 6 }}>
                  {[
                    { label: "Dry", val: 0 },
                    { label: "Drizzle (8mm)", val: 8 },
                    { label: "Heavy (25mm)", val: 25 },
                    { label: "Torrential (50mm)", val: 50 },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      className={`${styles.segBtn} ${weatherTwinParams.rainfallIntensity === preset.val ? styles.segActive : ""}`}
                      onClick={() => setWeatherTwinParams({ rainfallIntensity: preset.val })}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>
                  Rainfall Duration: {weatherTwinParams.rainfallDuration} minutes
                </label>
                <div className={styles.segmented}>
                  {([15, 30, 45, 60, 90, 120] as const).map(d => (
                    <button
                      key={d}
                      className={`${styles.segBtn} ${weatherTwinParams.rainfallDuration === d ? styles.segActive : ""}`}
                      onClick={() => setWeatherTwinParams({ rainfallDuration: d })}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>
                  Temperature: {weatherTwinParams.temperature}°C
                </label>
                <input
                  type="range"
                  min={22}
                  max={38}
                  step={1}
                  value={weatherTwinParams.temperature}
                  onChange={e => setWeatherTwinParams({ temperature: Number(e.target.value) })}
                  className={styles.slider}
                />
                <div className={styles.sliderRange}><span>22°C</span><span>38°C</span></div>
              </div>

              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>Affected Operational Area</label>
                <div className={styles.segmented}>
                  {[
                    { label: "Wankhede Corridor", val: "WANKHEDE_CORRIDOR" as const },
                    { label: "South Mumbai All", val: "SOUTH_MUMBAI_ALL" as const },
                  ].map(area => (
                    <button
                      key={area.val}
                      className={`${styles.segBtn} ${weatherTwinParams.affectedArea === area.val ? styles.segActive : ""}`}
                      onClick={() => setWeatherTwinParams({ affectedArea: area.val })}
                    >
                      {area.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.weatherActionsRow}>
                <button
                  type="button"
                  className={styles.btnWeatherRun}
                  onClick={() => runWeatherTwin()}
                >
                  RUN WEATHER TWIN
                </button>
                <button
                  type="button"
                  className={styles.btnWeatherReset}
                  onClick={() => resetWeatherTwin()}
                >
                  RESET
                </button>
              </div>

              <div className={styles.paramNote}>
                <strong>Digital Twin Semantics:</strong> Weather What-If generates a separate hypothetical
                layer. Baseline operational state is strictly preserved and restored upon Reset.
              </div>
            </>
          ) : (
            <>
              <h3 className={styles.controlsTitle}>Simulation Parameters</h3>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>
              Attendance: {simParams.attendance.toLocaleString()}
            </label>
            <input
              type="range"
              min={20000}
              max={45000}
              step={1000}
              value={simParams.attendance}
              onChange={e => updateSimParams({ attendance: Number(e.target.value) })}
              className={styles.slider}
            />
            <div className={styles.sliderRange}><span>20,000</span><span>45,000</span></div>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Event Delay</label>
            <div className={styles.segmented}>
              {([0, 15, 30] as const).map(v => (
                <button
                  key={v}
                  className={`${styles.segBtn} ${simParams.eventDelay === v ? styles.segActive : ""}`}
                  onClick={() => updateSimParams({ eventDelay: v })}
                >
                  {v === 0 ? "None" : `+${v}m`}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Weather Condition</label>
            <div className={styles.segmented}>
              {(["NORMAL", "HEAVY_RAIN"] as const).map(v => (
                <button
                  key={v}
                  className={`${styles.segBtn} ${simParams.weather === v ? styles.segActive : ""}`}
                  onClick={() => updateSimParams({ weather: v })}
                >
                  {v === "NORMAL" ? "Normal" : "Heavy Rain"}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Additional Buses (Intervention)</label>
            <div className={styles.segmented}>
              {([0, 10, 20] as const).map(v => (
                <button
                  key={v}
                  className={`${styles.segBtn} ${simParams.additionalBuses === v ? styles.segActive : ""}`}
                  onClick={() => updateSimParams({ additionalBuses: v })}
                >
                  {v === 0 ? "None" : `+${v}`}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Visitor Redistribution</label>
            <div className={styles.segmented}>
              {([0, 20, 40] as const).map(v => (
                <button
                  key={v}
                  className={`${styles.segBtn} ${simParams.visitorRedistribution === v ? styles.segActive : ""}`}
                  onClick={() => updateSimParams({ visitorRedistribution: v })}
                >
                  {v === 0 ? "None" : `${v}%`}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Transport Disruption (WR)</label>
            <div className={styles.segmented}>
              {[false, true].map(v => (
                <button
                  key={String(v)}
                  className={`${styles.segBtn} ${simParams.transportDisruption === v ? styles.segActive : ""}`}
                  onClick={() => updateSimParams({ transportDisruption: v })}
                >
                  {v ? "ON" : "OFF"}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.paramNote}>
            <strong>Parameter Change Semantics:</strong> Base parameter changes (attendance, weather, disruption)
            cleanly reinitialize the simulation state. Runtime interventions affect downstream flows.
          </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE SIMULATION TELEMETRY & COMPARISON MATRIX */}
        <div className={styles.results}>
          {/* WEATHER DIGITAL TWIN COMPARISON MATRIX (When Weather Scenario Active) */}
          {weatherScenarioActive && weatherImpact && (
            <div className={styles.weatherMatrixCard}>
              <div className={styles.weatherMatrixHeader}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="pill pill-yellow" style={{ fontSize: 10 }}>WHAT-IF SCENARIO ACTIVE</span>
                    <span
                      className={`pill ${weatherImpact.severity === "SEVERE" ? "pill-critical" : "pill-high"}`}
                      style={{ fontSize: 10 }}
                    >
                      {weatherImpact.severity} SEVERITY
                    </span>
                  </div>
                  <h3 className={styles.weatherMatrixTitle} style={{ marginTop: 6 }}>
                    Baseline vs. Weather-Adjusted Digital Twin
                  </h3>
                  <p className={styles.weatherMatrixSummary}>{weatherImpact.summary}</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Link href="/organizer" className="btn btn-outline btn-sm">
                    View on Map →
                  </Link>
                  <Link href="/organizer/recommendations" className="btn btn-yellow btn-sm">
                    Review Actions →
                  </Link>
                </div>
              </div>

              {/* Propagation Flow */}
              <div className={styles.propagationBar}>
                <span style={{ color: "var(--ink-muted)", fontSize: 10 }}>IMPACT PROPAGATION:</span>
                {weatherImpact.propagationPath.map((step, idx) => (
                  <React.Fragment key={step}>
                    <span>{step}</span>
                    {idx < weatherImpact.propagationPath.length - 1 && (
                      <span className={styles.propagationArrow}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Zone Comparison Table */}
              <div style={{ overflowX: "auto" }}>
                <table className={styles.comparisonTable}>
                  <thead>
                    <tr>
                      <th>Operational Zone / Corridor</th>
                      <th>Baseline Pressure</th>
                      <th>Weather-Adjusted</th>
                      <th>Delta</th>
                      <th>Behavioral &amp; Physical Mechanism</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Explicitly surface Gate 1 and Gate 2 distinctly */}
                    {[
                      "ZONE_WANKHEDE_GATE_1",
                      "ZONE_WANKHEDE_GATE_2",
                      "ZONE_CHURCHGATE",
                      "ZONE_TAXI_STAGING",
                      "ZONE_MARINE_LINES",
                      "ZONE_DADAR",
                    ].map(zoneId => {
                      const deltaItem = weatherImpact.affectedZoneDeltas[zoneId];
                      const zoneDef = zones.find(z => z.id === zoneId);
                      if (!deltaItem && !zoneDef) return null;

                      const basePressure = deltaItem?.baselinePressure ?? zoneDef?.pressure ?? 50;
                      const adjPressure = deltaItem?.weatherAdjustedPressure ?? basePressure;
                      const deltaVal = deltaItem?.delta ?? 0;
                      const reason = deltaItem?.impactReason ?? "Egress flow adjusted for weather.";

                      return (
                        <tr key={zoneId}>
                          <td>
                            <strong>{deltaItem?.zoneName ?? zoneDef?.name ?? zoneId}</strong>
                            <div style={{ fontSize: 10, color: "var(--ink-muted)", fontFamily: "monospace" }}>
                              {zoneId}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700 }}>{basePressure}%</span>
                          </td>
                          <td>
                            <span
                              style={{
                                fontWeight: 800,
                                color: getPressureColor(adjPressure),
                              }}
                            >
                              {adjPressure}%
                            </span>
                          </td>
                          <td>
                            {deltaVal > 0 ? (
                              <span className={styles.deltaBadgePlus}>+{deltaVal}%</span>
                            ) : (
                              <span className={styles.deltaBadgeNeutral}>0%</span>
                            )}
                          </td>
                          <td style={{ fontSize: 11, color: "var(--ink-light)", maxWidth: 300 }}>
                            {reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 1. NODE ACCUMULATION */}
          <div>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Node Accumulation (Simulated People Waiting / Queuing)</span>
              <span className="pill pill-simulated">LIVE ACCUMULATION</span>
            </div>
            <div className={styles.nodeGrid} style={{ marginTop: 12 }}>
              {Object.keys(RESOURCE_NAMES).map(nodeId => {
                const load = simulationState.nodeLoads[nodeId] || 0;
                const capacity = RESOURCE_CAPACITIES[nodeId] || 1000;
                const pressure = Math.min(99, Math.max(20, Math.round((load / capacity) * 100)));
                const color = getPressureColor(pressure);

                return (
                  <div key={nodeId} className={styles.nodeCard}>
                    <div className={styles.nodeCardHeader}>
                      <span className={styles.nodeName}>{RESOURCE_NAMES[nodeId]}</span>
                      <span
                        className={styles.nodePressurePill}
                        style={{
                          background: color,
                          color: pressure >= 85 ? "#ffffff" : "#111111",
                        }}
                      >
                        {pressure}%
                      </span>
                    </div>
                    <div className={styles.nodeMetrics}>
                      <span className={styles.nodeLoadVal}>{load.toLocaleString()}</span>
                      <span className={styles.nodeCapVal}>/ {capacity.toLocaleString()} cap</span>
                    </div>
                    <div className={styles.pressureBar}>
                      <div
                        className={styles.pressureBarFill}
                        style={{ width: `${pressure}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. IN-TRANSIT EDGE LOADS */}
          <div>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Network Corridors (Edge Load — People in Transit)</span>
              <span className="text-meta">{totalInTransit.toLocaleString()} moving</span>
            </div>
            <div className={styles.edgeGrid} style={{ marginTop: 12 }}>
              {Object.values(MVP_NETWORK_EDGES).map(edge => {
                const load = simulationState.edgeLoads[edge.id] || 0;
                return (
                  <div key={edge.id} className={styles.edgeCard}>
                    <span className={styles.edgeName}>{edge.name}</span>
                    <div className={styles.edgeLoadBadge}>
                      <span className={styles.edgeLoadNumber}>{load.toLocaleString()}</span>
                      <span className={styles.edgeLoadLabel}>in transit</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. ACTIVE HUMAN COHORTS */}
          <div>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Active Human Cohorts ({activeCohorts.length})</span>
              <span className="text-meta">Aggregate Movement Stream</span>
            </div>
            {activeCohorts.length === 0 ? (
              <div className={styles.idleState}>
                <span style={{ fontSize: 28 }}>▶</span>
                <span className={styles.idleStateTitle}>
                  {simulationState.status === "IDLE" ? "Simulation Ready — Press PLAY to Deploy Cohorts" : "Simulation Paused"}
                </span>
                <span className={styles.idleStateSub}>
                  {simulationState.status === "IDLE"
                    ? `33,000 attendees will be released from Wankhede exit gates and tracked through South Mumbai infrastructure nodes. All cohort physics are pre-configured for scenario: ${activeScenario.replace(/_/g, " ")}.`
                    : "Resume or reset the simulation to continue cohort tracking."}
                </span>
              </div>
            ) : (
              <div style={{ overflowX: "auto", marginTop: 10 }}>
                <table className={styles.cohortTable}>
                  <thead>
                    <tr>
                      <th>Cohort ID</th>
                      <th>Destination Hub</th>
                      <th>Cohort Volume</th>
                      <th>Speed</th>
                      <th>Corridor Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCohorts.slice(0, 8).map(cohort => (
                      <tr key={cohort.id}>
                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{cohort.id.slice(0, 18)}</td>
                        <td>
                          <strong>{RESOURCE_NAMES[cohort.destinationId] || cohort.destinationId}</strong>
                        </td>
                        <td>
                          <strong>{cohort.volume.toLocaleString()}</strong> people
                        </td>
                        <td>{cohort.speedMps} m/s</td>
                        <td>
                          <div className={styles.progressBarWrap}>
                            <div
                              className={styles.progressBarFill}
                              style={{ width: `${Math.round(cohort.progress * 100)}%` }}
                            />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700 }}>
                            {Math.round(cohort.progress * 100)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SimulationPage() {
  return (
    <Suspense fallback={<div style={{ padding: 28 }}>Loading simulation console...</div>}>
      <SimulationContent />
    </Suspense>
  );
}
