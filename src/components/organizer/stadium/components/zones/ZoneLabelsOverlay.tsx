import React, { memo } from "react";
import type { ZoneLabelData } from "./StadiumZone";
import type { GateLabelData } from "./GateMarker";

interface ZoneLabelsOverlayProps {
  zones: ZoneLabelData[];
  gates: GateLabelData[];
  onSelectZone?: (id: string) => void;
  /** Container dimensions — the overlay must match the canvas size exactly */
  width: number;
  height: number;
}

/**
 * DOM overlay rendered as an absolute-positioned sibling to the R3F Canvas.
 * Receives pre-projected 2D screen positions from ZoneManager (computed inside
 * the canvas via useFrame) and renders standard HTML labels without any React
 * portal / Html component — avoiding the React 19 concurrent rendering race.
 */
export const ZoneLabelsOverlay: React.FC<ZoneLabelsOverlayProps> = memo(({
  zones,
  gates,
  onSelectZone,
  width,
  height,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width,
        height,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 5,
      }}
    >
      {/* Zone stand / pavilion labels */}
      {zones.map((z) => {
        if (!z.pos) return null;
        const status = z.occupancy?.status?.toLowerCase() || "normal";
        const isSelected = z.visualState === "selected";
        const isHovered = z.visualState === "hovered";

        return (
          <div
            key={z.id}
            onClick={() => onSelectZone?.(z.id)}
            style={{
              position: "absolute",
              left: z.pos.x,
              top: z.pos.y,
              transform: "translate(-50%, -50%)",
              pointerEvents: "auto",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div
              className={`zone-label-badge status-${status} ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""}`}
            >
              <div className="zone-label-header">
                <span className="zone-name">{z.shortLabel}</span>
                {z.occupancy && (
                  <span className={`occ-pill occ-${z.occupancy.status.toLowerCase()}`}>
                    {z.occupancy.occupancyPercent.toFixed(0)}%
                  </span>
                )}
                <span className={`confidence-tag conf-${z.confidence}`}>
                  {z.confidence.toUpperCase()}
                </span>
              </div>

              {isSelected && (
                <div className="zone-label-detail">
                  <span className="zone-fullname">{z.name}</span>
                  {z.occupancy && (
                    <span className="zone-occ-detail">
                      {z.occupancy.peopleCount.toLocaleString()} / {z.occupancy.capacity.toLocaleString()} ({z.occupancy.status})
                    </span>
                  )}
                  <span className="zone-source">SRC: {z.source.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Gate labels */}
      {gates.map((g) => {
        if (!g.pos) return null;
        const pressure = g.simState ? g.simState.pressurePercent : 30;
        const status = g.simState ? g.simState.status : "NORMAL";
        const queue = g.simState ? g.simState.queueLength : 0;
        const trend = g.simState ? g.simState.trend : "STABLE";
        const isVip = g.type === "vip" || g.type === "players";

        return (
          <div
            key={g.id}
            onClick={() => onSelectZone?.(g.id)}
            style={{
              position: "absolute",
              left: g.pos.x,
              top: g.pos.y,
              transform: "translate(-50%, -100%)",
              pointerEvents: "auto",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div
              className={`gate-badge ${isVip ? "gate-vip" : ""} gate-status-${status.toLowerCase()} ${g.isSelected ? "selected" : ""}`}
            >
              <div className="gate-badge-header">
                <span className="gate-code">{g.gateCode}</span>
                {g.simState && (
                  <span className={`gate-pressure-pill pill-${status.toLowerCase()}`}>
                    {pressure.toFixed(0)}%
                  </span>
                )}
              </div>
              {g.simState && (queue > 20 || g.isSelected) && (
                <div className="gate-queue-row">
                  <span className="gate-queue-num">Q: {queue}</span>
                  <span className="gate-queue-trend">
                    {trend === "RISING" ? "↑" : trend === "FALLING" ? "↓" : "•"}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
