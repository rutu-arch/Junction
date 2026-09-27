import React, { useState } from "react";
import {
  getStandById,
  getGateById,
} from "../../data/stadium/stadiumModel";
import type { SpatialCalibration } from "../../data/stadium/types";
import { useOccupancy } from "../../data/occupancy";
import { STAND_POPULATION_CONFIGS } from "../../data/population/standPopulation";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  Lock,
  Compass,
  Users,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Sliders,
  ChevronDown,
  Copy,
} from "lucide-react";

interface ZoneInspectorProps {
  selectedZoneId?: string | null;
  zone?: { id: string; name: string } | null;
  onClose: () => void;
  calibrations?: Record<string, SpatialCalibration>;
  onUpdateCalibration?: (id: string, spatial: SpatialCalibration) => void;
  onSelectZone?: (id: string) => void;
  isDevMode?: boolean;
  onToggleDevMode?: () => void;
}

export const ZoneInspector: React.FC<ZoneInspectorProps> = ({
  selectedZoneId,
  zone,
  onClose,
  calibrations = {},
  onUpdateCalibration,
  onSelectZone,
  isDevMode = false,
}) => {
  const [showDevControls, setShowDevControls] = useState<boolean>(isDevMode);

  const activeZoneId = selectedZoneId || zone?.id;
  if (!activeZoneId) return null;

  const stand = getStandById(activeZoneId);
  const gate = getGateById(activeZoneId);

  const entity = stand || gate || (zone ? {
    id: zone.id,
    name: zone.name,
    confidence: "confirmed" as const,
    source: "official" as const,
  } : null);

  if (!entity) return null;

  const isStand = Boolean(stand);

  const {
    getZoneOccupancy,
    gateStates,
    zoneStates,
    activeRecommendations,
  } = useOccupancy();

  const occupancy = getZoneOccupancy(activeZoneId);
  const simZone = isStand && stand ? zoneStates[stand.id] : undefined;
  const simGate = !isStand && gate ? gateStates[gate.id] : undefined;

  const relevantRec = activeRecommendations.find((r) =>
    r.affectedZones.includes(activeZoneId) || r.affectedGates.includes(activeZoneId)
  );

  const currentSpatial: SpatialCalibration | undefined = isStand && stand
    ? calibrations[stand.id] || stand.spatial
    : undefined;

  const handleSliderChange = (field: keyof SpatialCalibration, val: number) => {
    if (!currentSpatial || !onUpdateCalibration) return;
    const updated = {
      ...currentSpatial,
      [field]: val,
    };
    onUpdateCalibration(activeZoneId, updated);
  };

  const handleCopyJson = () => {
    if (!currentSpatial) return;
    navigator.clipboard.writeText(JSON.stringify(currentSpatial, null, 2));
  };

  return (
    <aside className="zone-inspector-drawer">
      {/* Header */}
      <div className="inspector-header">
        <div className="inspector-title-wrap">
          <div className="inspector-badge-row">
            <span className="entity-type-tag">
              {isStand ? (stand?.type === "pavilion" ? "PAVILION ZONE" : "STADIUM STAND") : "ACCESS GATE"}
            </span>
            <span className={`conf-pill conf-${entity.confidence}`}>
              {entity.confidence === "confirmed" && <CheckCircle2 size={11} />}
              {entity.confidence === "approximate" && <AlertTriangle size={11} />}
              {entity.confidence === "assumed" && <HelpCircle size={11} />}
              {entity.confidence.toUpperCase()}
            </span>
          </div>
          <h2 className="inspector-name">{entity.name}</h2>
          <span className="inspector-id">ID: {entity.id}</span>
        </div>
        <button className="inspector-close-btn" onClick={onClose} title="Close Inspector">
          <X size={15} />
        </button>
      </div>

      <div className="inspector-body">
        {/* Dynamic Stand Occupancy State */}
        {occupancy && (
          <div className="inspector-card occupancy-data-card">
            <div className="card-label-row">
              <div className="card-label">
                <Users size={12} />
                DYNAMIC OCCUPANCY STATE
              </div>
              <span className={`occ-status-tag status-${occupancy.status.toLowerCase()}`}>
                {occupancy.status}
              </span>
            </div>
            <div className="card-row">
              <span className="k">PEOPLE COUNT</span>
              <span className="v">{occupancy.peopleCount.toLocaleString()} / {occupancy.capacity.toLocaleString()}</span>
            </div>
            {isStand && stand && STAND_POPULATION_CONFIGS[stand.id] && (
              <div className="card-row">
                <span className="k">3D VISUAL CROWD</span>
                <span className="v">
                  {Math.round((occupancy.occupancyPercent / 100) * STAND_POPULATION_CONFIGS[stand.id].totalVisualCapacity).toLocaleString()} / {STAND_POPULATION_CONFIGS[stand.id].totalVisualCapacity.toLocaleString()} entities
                </span>
              </div>
            )}
            <div className="card-row">
              <span className="k">UTILIZATION</span>
              <span className="v">{occupancy.occupancyPercent.toFixed(1)}%</span>
            </div>
            <div className="card-row">
              <span className="k">ENGINE SOURCE</span>
              <span className="v uppercase">{occupancy.source}</span>
            </div>
          </div>
        )}

        {/* Dynamic Flow & Pressure State (from SimulationEngine) */}
        {simZone && (
          <div className="inspector-card flow-telemetry-card">
            <div className="card-label-row">
              <div className="card-label">
                <Activity size={12} />
                OPERATIONAL FLOW TELEMETRY
              </div>
              <span className={`occ-status-tag status-${simZone.status.toLowerCase()}`}>
                {simZone.pressurePercent.toFixed(0)}% PRESSURE
              </span>
            </div>

            <div className="card-row">
              <span className="k">INFLOW RATE</span>
              <span className="v text-cyan flex-center">
                <ArrowDownRight size={12} /> {simZone.inflowRate} / min
              </span>
            </div>

            <div className="card-row">
              <span className="k">OUTFLOW RATE</span>
              <span className="v text-muted flex-center">
                <ArrowUpRight size={12} /> {simZone.outflowRate} / min
              </span>
            </div>

            <div className="card-row">
              <span className="k">PRESSURE TREND</span>
              <span className="v flex-center">
                {simZone.trend === "RISING" && <><TrendingUp size={12} className="text-coral" /> RISING</>}
                {simZone.trend === "FALLING" && <><TrendingDown size={12} className="text-emerald" /> FALLING</>}
                {simZone.trend === "STABLE" && <><Minus size={12} className="text-cyan" /> STABLE</>}
              </span>
            </div>
          </div>
        )}

        {/* Connected Gates Status for Stand */}
        {isStand && simZone && onSelectZone && (
          <div className="inspector-card connected-gates-card">
            <div className="card-label">CONNECTED ENTRY GATES</div>
            <div className="connected-gates-list">
              {simZone.connectedGateIds.map((gId) => {
                const gState = gateStates[gId];
                return (
                  <div
                    key={gId}
                    className="connected-gate-item"
                    onClick={() => onSelectZone(gId)}
                    title={`Inspect ${gState?.name || gId}`}
                  >
                    <div className="gate-item-left">
                      <span className="gate-item-code">{gState?.gateCode || gId}</span>
                      <span className="gate-item-name">{gState?.name.split("(")[0]}</span>
                    </div>
                    <div className="gate-item-right">
                      <span className={`gate-pressure-tag status-${gState?.status.toLowerCase() || "normal"}`}>
                        {gState?.pressurePercent.toFixed(0)}%
                      </span>
                      <span className="gate-queue-val">Q: {gState?.queueLength}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Recommendation for Zone */}
        {relevantRec && (
          <div className={`inspector-card rec-card-highlight severity-${relevantRec.severity.toLowerCase()}`}>
            <div className="card-label-row">
              <div className="card-label">
                <Sparkles size={12} />
                ACTIVE INTELLIGENCE
              </div>
              <span className="rec-status-tag">{relevantRec.status}</span>
            </div>
            <h4 className="rec-card-title">{relevantRec.title}</h4>
            <p className="rec-card-desc">{relevantRec.suggestedAction}</p>
          </div>
        )}

        {/* Gate Specific Telemetry if a gate is selected */}
        {simGate && (
          <div className="inspector-card flow-telemetry-card">
            <div className="card-label-row">
              <div className="card-label">
                <Activity size={12} />
                GATE FLOW & QUEUE METRICS
              </div>
              <span className={`occ-status-tag status-${simGate.status.toLowerCase()}`}>
                {simGate.status}
              </span>
            </div>

            <div className="card-row">
              <span className="k">CURRENT QUEUE</span>
              <span className={`v font-bold ${simGate.queueLength > 80 ? "text-coral" : "text-cyan"}`}>
                {simGate.queueLength} attendees
              </span>
            </div>

            <div className="card-row">
              <span className="k">ARRIVAL INFLOW</span>
              <span className="v text-cyan">{simGate.inflowRate} / min</span>
            </div>

            <div className="card-row">
              <span className="k">THROUGHPUT RATE</span>
              <span className="v text-main">{simGate.throughputRate} / min</span>
            </div>

            <div className="card-row">
              <span className="k">OPERATIONAL PRESSURE</span>
              <span className="v font-bold">{simGate.pressurePercent.toFixed(1)}%</span>
            </div>

            <div className="card-row">
              <span className="k">QUEUE TREND</span>
              <span className="v flex-center">
                {simGate.trend === "RISING" && <><TrendingUp size={12} className="text-coral" /> RISING</>}
                {simGate.trend === "FALLING" && <><TrendingDown size={12} className="text-emerald" /> FALLING</>}
                {simGate.trend === "STABLE" && <><Minus size={12} className="text-cyan" /> STABLE</>}
              </span>
            </div>
          </div>
        )}

        {/* Provenance & Source Information */}
        <div className="inspector-card provenance-card">
          <div className="card-label">PROVENANCE & INTEGRITY</div>
          <div className="card-row">
            <span className="k">SOURCE MODEL</span>
            <span className="v uppercase">{entity.source}</span>
          </div>
          <div className="card-row">
            <span className="k">CONFIDENCE LEVEL</span>
            <span className="v uppercase">{entity.confidence}</span>
          </div>
          {isStand && stand?.aliases && (
            <div className="card-row">
              <span className="k">OFFICIAL ALIASES</span>
              <span className="v">{stand.aliases.join(", ")}</span>
            </div>
          )}
          {isStand && stand?.approxCapacity && (
            <div className="card-row">
              <span className="k">NOMINAL CAPACITY</span>
              <span className="v">{stand.approxCapacity.toLocaleString()} seats</span>
            </div>
          )}
          <div className="provenance-disclaimer">
            {entity.confidence === "confirmed" && "Verified against original Wankhede architectural CAD drawings. Primary operational zone."}
            {entity.confidence === "approximate" && "Demarcation approximated from architectural plan drawings. Primary operational zone."}
            {entity.confidence === "assumed" && "Inferred circulation node based on stadium drawings and entrance corridors."}
          </div>
        </div>

        {/* Spatial Status: Locked & Calibrated (Read-Only) */}
        {currentSpatial && (
          <div className="inspector-card">
            <div className="card-label-row">
              <div className="card-label">
                <Compass size={12} />
                SPATIAL REPRESENTATION
              </div>
              <span className="spatial-status-pill">
                <Lock size={10} />
                CALIBRATED
              </span>
            </div>

            <div className="spatial-readout-grid">
              <div className="readout-item">
                <span className="readout-k">ARC RANGE</span>
                <span className="readout-v">{currentSpatial.arcStartDeg}° → {currentSpatial.arcEndDeg}°</span>
              </div>
              <div className="readout-item">
                <span className="readout-k">RADIAL BOUNDS</span>
                <span className="readout-v">{currentSpatial.innerRadius.toFixed(1)}m – {currentSpatial.outerRadius.toFixed(1)}m</span>
              </div>
              <div className="readout-item">
                <span className="readout-k">ELEVATION</span>
                <span className="readout-v">+{currentSpatial.elevationY.toFixed(1)}m MSL</span>
              </div>
              <div className="readout-item">
                <span className="readout-k">HEIGHT / TILT</span>
                <span className="readout-v">{currentSpatial.height.toFixed(1)}m / {currentSpatial.tiltDeg || 20}°</span>
              </div>
            </div>
          </div>
        )}

        {/* Developer Spatial Fine-Tuning Calibration (Hidden by default) */}
        {isStand && currentSpatial && (
          <div className="inspector-card dev-calibration-section">
            <button
              className="dev-accordion-header"
              onClick={() => setShowDevControls((v) => !v)}
            >
              <div className="card-label">
                <Sliders size={12} />
                DEVELOPER CALIBRATION
              </div>
              <ChevronDown
                size={14}
                style={{
                  transform: showDevControls ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {showDevControls && (
              <div className="dev-calib-body">
                <div className="dev-note">
                  Developer tool for fine-tuning stand coordinates. Exports to stands.ts.
                </div>

                <div className="calib-controls">
                  <div className="calib-field">
                    <div className="calib-field-label">
                      <span>Inner Radius</span>
                      <span>{currentSpatial.innerRadius.toFixed(1)}m</span>
                    </div>
                    <input
                      type="range"
                      min="2.0"
                      max="12.0"
                      step="0.1"
                      value={currentSpatial.innerRadius}
                      onChange={(e) => handleSliderChange("innerRadius", parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="calib-field">
                    <div className="calib-field-label">
                      <span>Outer Radius</span>
                      <span>{currentSpatial.outerRadius.toFixed(1)}m</span>
                    </div>
                    <input
                      type="range"
                      min="5.0"
                      max="18.0"
                      step="0.1"
                      value={currentSpatial.outerRadius}
                      onChange={(e) => handleSliderChange("outerRadius", parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="calib-field">
                    <div className="calib-field-label">
                      <span>Arc Start</span>
                      <span>{currentSpatial.arcStartDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={currentSpatial.arcStartDeg}
                      onChange={(e) => handleSliderChange("arcStartDeg", parseInt(e.target.value))}
                    />
                  </div>

                  <div className="calib-field">
                    <div className="calib-field-label">
                      <span>Arc End</span>
                      <span>{currentSpatial.arcEndDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={currentSpatial.arcEndDeg}
                      onChange={(e) => handleSliderChange("arcEndDeg", parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="dev-actions">
                  <button className="copy-json-btn" onClick={handleCopyJson}>
                    <Copy size={11} />
                    COPY CALIBRATION JSON
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default ZoneInspector;
