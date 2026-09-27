import type { CameraPreset } from "../scene/CameraRig";
import type { RenderMode } from "../hologram/HologramMaterial";
import { useOccupancy } from "../../data/occupancy";
import {
  Layers,
  Radio,
  Eye,
  Crosshair,
  Compass,
  Sparkles,
  Maximize2,
  Box,
  MapPin,
  Users,
  AlertTriangle,
} from "lucide-react";

interface HUDOverlayProps {
  renderMode: RenderMode;
  setRenderMode: (m: RenderMode) => void;
  showEdges: boolean;
  setShowEdges: (v: boolean | ((prev: boolean) => boolean)) => void;
  scanActive: boolean;
  setScanActive: (v: boolean | ((prev: boolean) => boolean)) => void;
  bloomEnabled: boolean;
  setBloomEnabled: (v: boolean | ((prev: boolean) => boolean)) => void;
  showCrowd: boolean;
  setShowCrowd: (v: boolean | ((prev: boolean) => boolean)) => void;
  cameraPreset: CameraPreset;
  setCameraPreset: (p: CameraPreset) => void;
  scanAltitude: number;

  // Phase 2A/2B Zone Controls
  zonesEnabled: boolean;
  setZonesEnabled: (v: boolean | ((prev: boolean) => boolean)) => void;
  showZoneLabels: boolean;
  setShowZoneLabels: (v: boolean | ((prev: boolean) => boolean)) => void;
  selectedZoneId: string | null;
  onOpenCalibration: () => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  renderMode,
  setRenderMode,
  showEdges,
  setShowEdges,
  scanActive,
  setScanActive,
  bloomEnabled,
  setBloomEnabled,
  showCrowd,
  setShowCrowd,
  cameraPreset,
  setCameraPreset,
  scanAltitude,
  zonesEnabled,
  setZonesEnabled,
  showZoneLabels,
  setShowZoneLabels,
  selectedZoneId,
  onOpenCalibration,
}) => {
  const { stadiumTotals, snapshot, activeSituations } = useOccupancy();

  const activeAlertsCount = activeSituations.filter((s) => s.status !== "RESOLVED").length;

  return (
    <div className="hud-overlay pointer-events-none">
      {/* Corner Technical Borders */}
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />
      <div className="hud-corner hud-corner-bl" />
      <div className="hud-corner hud-corner-br" />

      {/* Top Left: Main Twin Identity & Aggregate Occupancy State */}
      <header className="hud-panel hud-top-left pointer-events-auto">
        <div className="hud-badge-row">
          <span className="hud-tag">HOLOJI // DIGITAL TWIN</span>
          <span className="hud-status-badge">
            <span className="status-dot" />
            SIM {snapshot.clock.formattedTime.substring(0, 5)}
          </span>
          <span className={`occ-hud-pill occ-hud-${stadiumTotals.overallStatus.toLowerCase()}`}>
            {stadiumTotals.overallPercent}% {stadiumTotals.overallStatus}
          </span>
          {activeAlertsCount > 0 && (
            <span className="occ-hud-pill occ-hud-critical">
              <AlertTriangle size={10} />
              {activeAlertsCount} ALERT{activeAlertsCount > 1 ? "S" : ""}
            </span>
          )}
        </div>
        <h1 className="hud-title">WANKHEDE STADIUM</h1>
        <div className="hud-subinfo">
          <span>MUMBAI, IN</span>
          <span className="hud-separator">•</span>
          <span>18.9389° N, 72.8258° E</span>
          <span className="hud-separator">•</span>
          <span>LIVE: {(stadiumTotals.totalPeople / 1000).toFixed(1)}K / 33.1K</span>
          <span className="hud-separator">•</span>
          <span className="text-cyan">QUEUES: {stadiumTotals.totalQueueLength}</span>
        </div>

        {/* Logical Stand Zone Controls */}
        <div className="hud-zone-subbar">
          <div className="zone-toggle-row">
            <button
              className={`hud-btn-zone ${zonesEnabled ? "active" : ""}`}
              onClick={() => setZonesEnabled((v) => !v)}
            >
              <MapPin size={12} />
              STAND ZONES (6): {zonesEnabled ? "VISIBLE" : "OFF"}
            </button>

            {zonesEnabled && (
              <>
                <button
                  className={`hud-btn-mini ${showZoneLabels ? "active" : ""}`}
                  onClick={() => setShowZoneLabels((v) => !v)}
                  title="Toggle 3D Floating Stand Badges"
                >
                  LABELS
                </button>

                {selectedZoneId && (
                  <button
                    className="hud-btn-mini highlight"
                    onClick={onOpenCalibration}
                    title="Inspect Selected Zone"
                  >
                    <Compass size={11} />
                    INSPECT
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Top Right: Hologram & Camera Controls */}
      <aside className="hud-panel hud-top-right pointer-events-auto">
        {/* Render Mode Switcher */}
        <div className="hud-control-group">
          <div className="hud-group-label">
            <Layers size={13} />
            <span>VISUAL MODE</span>
          </div>
          <div className="hud-btn-row">
            <button
              className={`hud-btn ${renderMode === "hologram" ? "active" : ""}`}
              onClick={() => setRenderMode("hologram")}
              title="Cyan holographic depth with Fresnel rim"
            >
              <Eye size={12} />
              HOLOGRAM
            </button>
            <button
              className={`hud-btn ${renderMode === "wireframe" ? "active" : ""}`}
              onClick={() => setRenderMode("wireframe")}
              title="High-contrast glowing wireframe"
            >
              <Box size={12} />
              X-RAY
            </button>
            <button
              className={`hud-btn ${renderMode === "tactical" ? "active" : ""}`}
              onClick={() => setRenderMode("tactical")}
              title="Stealth tactical dark composite"
            >
              <Maximize2 size={12} />
              TACTICAL
            </button>
          </div>
        </div>

        {/* Camera Views */}
        <div className="hud-control-group">
          <div className="hud-group-label">
            <Compass size={13} />
            <span>CAMERA ANGLE</span>
          </div>
          <div className="hud-btn-row">
            <button
              className={`hud-btn ${cameraPreset === "isometric" ? "active" : ""}`}
              onClick={() => setCameraPreset("isometric")}
            >
              ISO 3D
            </button>
            <button
              className={`hud-btn ${cameraPreset === "top" ? "active" : ""}`}
              onClick={() => setCameraPreset("top")}
            >
              PLAN
            </button>
            <button
              className={`hud-btn ${cameraPreset === "pitch" ? "active" : ""}`}
              onClick={() => setCameraPreset("pitch")}
            >
              PITCH
            </button>
            <button
              className={`hud-btn ${cameraPreset === "north" ? "active" : ""}`}
              onClick={() => setCameraPreset("north")}
            >
              NORTH
            </button>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="hud-control-group hud-toggle-group">
          <button
            className={`hud-pill-btn ${scanActive ? "active" : ""}`}
            onClick={() => setScanActive((v) => !v)}
          >
            <Radio size={12} />
            SCAN BEAM: {scanActive ? "ACTIVE" : "STANDBY"}
          </button>
          <button
            className={`hud-pill-btn ${showEdges ? "active" : ""}`}
            onClick={() => setShowEdges((v) => !v)}
          >
            <Crosshair size={12} />
            STRUCTURAL EDGES
          </button>
          <button
            className={`hud-pill-btn ${bloomEnabled ? "active" : ""}`}
            onClick={() => setBloomEnabled((v) => !v)}
          >
            <Sparkles size={12} />
            BLOOM GLOW
          </button>
          <button
            className={`hud-pill-btn ${showCrowd ? "active" : ""}`}
            onClick={() => setShowCrowd((v) => !v)}
            title="Toggle 3D Holographic Crowd Layer"
          >
            <Users size={12} />
            SHOW CROWD: {showCrowd ? "ON" : "OFF"}
          </button>
        </div>
      </aside>

      {/* Bottom Left: Stadium Structural Telemetry */}
      <footer className="hud-panel hud-bottom-left">
        <div className="hud-telemetry-grid">
          <div className="telemetry-item">
            <span className="telemetry-key">STRUCTURAL MODEL</span>
            <span className="telemetry-val">WANKHEDE_STADIUM.GLB</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-key">OVERALL DENSITY</span>
            <span className="telemetry-val">
              {stadiumTotals.overallPercent}% ({stadiumTotals.overallStatus})
            </span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-key">MEAN PRESSURE</span>
            <span className="telemetry-val text-cyan">
              {stadiumTotals.overallPressure.toFixed(0)}% LOAD
            </span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-key">TIER GEOMETRY</span>
            <span className="telemetry-val">4 LEVELS / 6 STANDS</span>
          </div>
        </div>
      </footer>

      {/* Bottom Right: Real-time Scan Coordinates & Navigation Hint */}
      <footer className="hud-panel hud-bottom-right">
        <div className="hud-live-scan">
          <div className="scan-altitude-indicator">
            <span className="scan-dot" />
            <span className="scan-label">SCAN LEVEL:</span>
            <span className="scan-num">{scanAltitude.toFixed(2)} m</span>
          </div>
          <div className="hud-nav-hint">
            <span>DRAG: ORBIT</span>
            <span className="dot-sep">•</span>
            <span>CLICK: SELECT STAND</span>
            <span className="dot-sep">•</span>
            <span>SCROLL: ZOOM</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
