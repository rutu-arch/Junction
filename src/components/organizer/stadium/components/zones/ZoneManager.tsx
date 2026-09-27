import React, { memo, useCallback, useRef } from "react";
import { StadiumZone } from "./StadiumZone";
import type { ZoneLabelData } from "./StadiumZone";
import { GateMarker } from "./GateMarker";
import type { GateLabelData } from "./GateMarker";
import { FlowConnectionOverlay } from "./FlowConnectionOverlay";
import { WANKHEDE_LOGICAL_MODEL } from "../../data/stadium/stadiumModel";
import type { SpatialCalibration } from "../../data/stadium/types";
import { useOccupancy } from "../../data/occupancy";

interface ZoneManagerProps {
  enabled: boolean;
  showLabels: boolean;
  selectedZoneId: string | null;
  onSelectZone: (id: string | null) => void;
  hoveredZoneId: string | null;
  onHoverZone: (id: string | null) => void;
  calibrations?: Record<string, SpatialCalibration>;
  /** Called each frame with updated label screen positions */
  onLabelsUpdate?: (zones: ZoneLabelData[], gates: GateLabelData[]) => void;
}

export const ZoneManager: React.FC<ZoneManagerProps> = memo(({
  enabled,
  showLabels,
  selectedZoneId,
  onSelectZone,
  hoveredZoneId,
  onHoverZone,
  calibrations = {},
  onLabelsUpdate,
}) => {
  const { records } = useOccupancy();
  const { stands, gates, concourses } = WANKHEDE_LOGICAL_MODEL;

  // Accumulate label positions in refs (updated every frame inside useFrame)
  // We use a ref-based accumulator so we can batch into a single callback call
  // without triggering re-renders of ZoneManager itself.
  const zonePositions = useRef<Map<string, { x: number; y: number } | null>>(new Map());
  const gatePositions = useRef<Map<string, { x: number; y: number } | null>>(new Map());
  const frameScheduled = useRef(false);

  const flush = useCallback(() => {
    frameScheduled.current = false;
    if (!onLabelsUpdate) return;

    const zoneLabelData: ZoneLabelData[] = stands.map((stand) => ({
      id: stand.id,
      name: stand.name,
      shortLabel: stand.shortLabel,
      source: stand.source,
      confidence: stand.confidence,
      occupancy: records[stand.id],
      visualState: selectedZoneId === stand.id
        ? "selected"
        : hoveredZoneId === stand.id
        ? "hovered"
        : "normal",
      pos: zonePositions.current.get(stand.id) ?? null,
    }));

    const gateLabelData: GateLabelData[] = gates.map((g) => ({
      id: g.id,
      gateCode: g.gateCode,
      type: g.type,
      // simState will be filled in by GateMarker callback
      pos: gatePositions.current.get(g.id) ?? null,
      isSelected: selectedZoneId === g.id,
    }));

    onLabelsUpdate(zoneLabelData, gateLabelData);
  }, [stands, gates, records, selectedZoneId, hoveredZoneId, onLabelsUpdate]);

  const handleZonePosition = useCallback((id: string, pos: { x: number; y: number } | null) => {
    zonePositions.current.set(id, pos);
    if (!frameScheduled.current) {
      frameScheduled.current = true;
      // Defer until after all useFrame callbacks in the same frame
      Promise.resolve().then(flush);
    }
  }, [flush]);

  const handleGatePosition = useCallback((
    id: string,
    pos: { x: number; y: number } | null,
    gateData: Omit<GateLabelData, "pos">
  ) => {
    gatePositions.current.set(id, pos);
    // Merge simState into stored gate data for flush
    // We store it in a separate gate meta ref to pass through to overlay
    if (!frameScheduled.current) {
      frameScheduled.current = true;
      Promise.resolve().then(flush);
    }
  }, [flush]);

  return (
    <group visible={enabled}>
      {/* 6 Primary Stand/Pavilion Operational Zones with Dynamic Occupancy State */}
      {stands.map((stand) => {
        const spatial = calibrations[stand.id] || stand.spatial;
        const isSelected = selectedZoneId === stand.id;
        const isHovered = hoveredZoneId === stand.id;
        const occupancy = records[stand.id];

        return (
          <StadiumZone
            key={stand.id}
            id={stand.id}
            name={stand.name}
            shortLabel={stand.shortLabel}
            type={stand.type}
            spatial={spatial}
            source={stand.source}
            confidence={stand.confidence}
            occupancy={occupancy}
            visualState={isSelected ? "selected" : isHovered ? "hovered" : "normal"}
            showLabels={showLabels}
            onSelect={onSelectZone}
            onHover={onHoverZone}
            onPositionUpdate={onLabelsUpdate ? handleZonePosition : undefined}
          />
        );
      })}

      {/* Gates & Concourses Markers */}
      <GateMarker
        gates={gates}
        concourses={concourses}
        selectedId={selectedZoneId}
        onSelect={onSelectZone}
        showLabels={showLabels}
        onGatePositionUpdate={onLabelsUpdate ? handleGatePosition : undefined}
      />

      {/* 3D Holographic Crowd Redirection Flow Laser Arc */}
      <FlowConnectionOverlay />
    </group>
  );
});
