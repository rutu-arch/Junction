import React from "react";
import { StandCrowdMesh } from "./StandCrowdMesh";
import { WANKHEDE_LOGICAL_MODEL } from "../../data/stadium/stadiumModel";
import type { SpatialCalibration } from "../../data/stadium/types";
import { useOccupancy } from "../../data/occupancy";

interface CrowdManagerProps {
  enabled?: boolean;
  selectedZoneId?: string | null;
  calibrations?: Record<string, SpatialCalibration>;
}

export const CrowdManager: React.FC<CrowdManagerProps> = ({
  enabled = true,
  selectedZoneId,
  calibrations = {},
}) => {
  const { records } = useOccupancy();

  if (!enabled) return null;

  const { stands } = WANKHEDE_LOGICAL_MODEL;

  return (
    <group name="stadium-crowd-layer">
      {stands.map((stand) => {
        const spatial = calibrations[stand.id] || stand.spatial;
        const occupancy = records[stand.id];
        const isSelected = selectedZoneId === stand.id;

        return (
          <StandCrowdMesh
            key={`crowd-${stand.id}`}
            standId={stand.id}
            spatial={spatial}
            occupancy={occupancy}
            isSelected={isSelected}
          />
        );
      })}
    </group>
  );
};
