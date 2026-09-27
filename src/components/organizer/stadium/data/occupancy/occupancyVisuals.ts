import type { OccupancyStatus } from "./types";

export interface ZoneVisualConfig {
  fillColor: string;
  fillOpacity: number;
  edgeColor: string;
  edgeOpacity: number;
  pulseSpeed: number; // 0 for static, >0 for sinusoidal breath
  pulseAmplitude: number;
  statusBadgeColor: string;
  statusBg: string;
}

/**
 * Centralized Visual Parameter Mapping for Occupancy Statuses.
 * Refined for high contrast on holographic cyan Wankhede GLB.
 * - LOW: subtle cyan/blue
 * - NORMAL: crisp holographic cyan/teal
 * - HIGH: distinct warm amber/gold
 * - CRITICAL: unmistakable vibrant red/coral
 */
export const OCCUPANCY_STATUS_VISUALS: Record<OccupancyStatus, ZoneVisualConfig> = {
  LOW: {
    fillColor: "#005f8f",
    fillOpacity: 0.07,
    edgeColor: "#00b4d8",
    edgeOpacity: 0.35,
    pulseSpeed: 0,
    pulseAmplitude: 0,
    statusBadgeColor: "#38f9d7",
    statusBg: "rgba(56, 249, 215, 0.12)",
  },
  NORMAL: {
    fillColor: "#0077b6",
    fillOpacity: 0.13,
    edgeColor: "#00f0ff",
    edgeOpacity: 0.55,
    pulseSpeed: 0.6,
    pulseAmplitude: 0.03,
    statusBadgeColor: "#00f0ff",
    statusBg: "rgba(0, 240, 255, 0.15)",
  },
  HIGH: {
    fillColor: "#e68a00",
    fillOpacity: 0.22,
    edgeColor: "#ffc400",
    edgeOpacity: 0.85,
    pulseSpeed: 1.4,
    pulseAmplitude: 0.08,
    statusBadgeColor: "#ffc400",
    statusBg: "rgba(255, 196, 0, 0.22)",
  },
  CRITICAL: {
    fillColor: "#e6194b",
    fillOpacity: 0.32,
    edgeColor: "#ff365f",
    edgeOpacity: 1.0,
    pulseSpeed: 2.4,
    pulseAmplitude: 0.14,
    statusBadgeColor: "#ff365f",
    statusBg: "rgba(255, 54, 95, 0.28)",
  },
};

/**
 * Returns the visual configuration for a zone, taking into account its occupancy status,
 * selection state, and hover state without losing the core occupancy warning color.
 */
export function getZoneVisualConfig(
  status: OccupancyStatus = "NORMAL",
  isSelected: boolean = false,
  isHovered: boolean = false
): ZoneVisualConfig {
  const base = OCCUPANCY_STATUS_VISUALS[status] || OCCUPANCY_STATUS_VISUALS.NORMAL;

  if (isSelected) {
    // Retain the status color identity while giving high-contrast selection emphasis
    let selEdgeColor = "#ffffff";
    if (status === "CRITICAL") selEdgeColor = "#ff7a95";
    else if (status === "HIGH") selEdgeColor = "#ffe57f";
    else selEdgeColor = "#00ffaa";

    return {
      ...base,
      fillColor: base.fillColor,
      fillOpacity: Math.min(base.fillOpacity + 0.10, 0.42),
      edgeColor: selEdgeColor,
      edgeOpacity: 1.0,
      pulseSpeed: Math.max(base.pulseSpeed, 1.2),
      pulseAmplitude: Math.max(base.pulseAmplitude, 0.08),
      statusBadgeColor: selEdgeColor,
    };
  }

  if (isHovered) {
    return {
      ...base,
      fillOpacity: Math.min(base.fillOpacity + 0.06, 0.38),
      edgeOpacity: Math.min(base.edgeOpacity + 0.15, 1.0),
    };
  }

  return base;
}
