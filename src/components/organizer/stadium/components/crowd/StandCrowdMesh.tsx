import React, { useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { generateStandCandidates, getActiveVisualCount } from "../../data/population/distribution";
import type { SpatialCalibration } from "../../data/stadium/types";
import type { OccupancyRecord } from "../../data/occupancy/types";
import { createHologramPersonGeometry } from "./HologramPersonGeometry";

interface StandCrowdMeshProps {
  standId: string;
  spatial: SpatialCalibration;
  occupancy?: OccupancyRecord;
  isSelected?: boolean;
}

export const StandCrowdMesh: React.FC<StandCrowdMeshProps> = ({
  standId,
  spatial,
  occupancy,
  isSelected = false,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // 1. Shared lightweight low-poly humanoid geometry
  const geometry = useMemo(() => {
    return createHologramPersonGeometry();
  }, []);

  // 2. Deterministic candidate positions across calibrated tier bands
  const candidates = useMemo(() => {
    return generateStandCandidates(standId, spatial);
  }, [standId, spatial]);

  // 3. Populate instance matrices once when candidates or spatial change
  useEffect(() => {
    if (!meshRef.current || candidates.length === 0) return;

    const dummy = new THREE.Object3D();
    const count = candidates.length;

    for (let i = 0; i < count; i++) {
      const pt = candidates[i];
      dummy.position.set(pt.position[0], pt.position[1], pt.position[2]);
      dummy.rotation.set(0, pt.rotationY, 0);
      // Slight natural height variation (0.92x to 1.08x) based on deterministic index
      const scale = 0.95 + ((i * 17) % 13) * 0.01;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [candidates]);

  // 4. Dynamically drive active instance count from OccupancyRecord
  const activeCount = useMemo(() => {
    const percent = occupancy ? occupancy.occupancyPercent : 0;
    return getActiveVisualCount(percent, candidates.length);
  }, [occupancy?.occupancyPercent, candidates.length]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.count = activeCount;
    }
  }, [activeCount]);

  if (candidates.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, candidates.length]}
      frustumCulled={false}
    >
      <meshBasicMaterial
        color={isSelected ? "#e0f7fa" : "#80deea"}
        transparent
        opacity={isSelected ? 0.95 : 0.82}
        depthWrite={false}
        depthTest={true}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};
