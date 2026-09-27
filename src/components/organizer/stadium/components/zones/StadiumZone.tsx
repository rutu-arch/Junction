import React, { useMemo, useState, useRef, memo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { createSectorGeometry, getSectorLabelPosition } from "./SectorGeometry";
import type { SpatialCalibration, ZoneVisualState, ProvenanceSource, ConfidenceLevel } from "../../data/stadium/types";
import type { OccupancyRecord } from "../../data/occupancy/types";
import { getZoneVisualConfig } from "../../data/occupancy/occupancyVisuals";

interface StadiumZoneProps {
  id: string;
  name: string;
  shortLabel: string;
  type: "stand" | "pavilion";
  spatial: SpatialCalibration;
  visualState?: ZoneVisualState;
  source: ProvenanceSource;
  confidence: ConfidenceLevel;
  occupancy?: OccupancyRecord;
  showLabels?: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  /** Called every frame with the projected 2D screen position (x, y in px) or null when behind camera */
  onPositionUpdate?: (id: string, pos: { x: number; y: number } | null) => void;
}

const _worldPos = new THREE.Vector3();
const _ndc = new THREE.Vector3();

export const StadiumZone: React.FC<StadiumZoneProps> = memo(({
  id,
  name,
  shortLabel,
  spatial,
  visualState = "normal",
  source,
  confidence,
  occupancy,
  showLabels = true,
  onSelect,
  onHover,
  onPositionUpdate,
}) => {
  const [localHover, setLocalHover] = useState(false);
  const fillMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const edgeMatRef = useRef<THREE.LineBasicMaterial>(null);
  const { camera, gl } = useThree();

  const { meshGeometry, edgeGeometry } = useMemo(() => {
    return createSectorGeometry(spatial);
  }, [spatial]);

  const labelPos3D = useMemo(() => {
    const p = getSectorLabelPosition(spatial);
    return new THREE.Vector3(p[0], p[1], p[2]);
  }, [spatial]);

  const isSelected = visualState === "selected";
  const isHovered = localHover || visualState === "hovered";

  const visualConfig = useMemo(() => {
    return getZoneVisualConfig(occupancy?.status, isSelected, isHovered);
  }, [occupancy?.status, isSelected, isHovered]);

  // Smooth sinusoidal breathing pulse for active/critical/high density zones
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (visualConfig.pulseSpeed > 0) {
      const pulse = Math.sin(t * visualConfig.pulseSpeed) * visualConfig.pulseAmplitude;
      if (fillMatRef.current) {
        fillMatRef.current.opacity = Math.max(0.04, visualConfig.fillOpacity + pulse * 0.5);
      }
      if (edgeMatRef.current) {
        edgeMatRef.current.opacity = Math.max(0.2, visualConfig.edgeOpacity + pulse);
      }
    } else {
      if (fillMatRef.current) fillMatRef.current.opacity = visualConfig.fillOpacity;
      if (edgeMatRef.current) edgeMatRef.current.opacity = visualConfig.edgeOpacity;
    }

    // Project 3D label position → 2D screen coords
    if (onPositionUpdate && showLabels) {
      _worldPos.copy(labelPos3D);
      _ndc.copy(_worldPos).project(camera);

      // Check if behind camera
      if (_ndc.z > 1) {
        onPositionUpdate(id, null);
        return;
      }

      const canvas = gl.domElement;
      const x = (_ndc.x * 0.5 + 0.5) * canvas.clientWidth;
      const y = (-_ndc.y * 0.5 + 0.5) * canvas.clientHeight;
      onPositionUpdate(id, { x, y });
    } else if (onPositionUpdate && !showLabels) {
      onPositionUpdate(id, null);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onSelect) onSelect(id);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setLocalHover(true);
    if (onHover) onHover(id);
  };

  const handlePointerOut = () => {
    setLocalHover(false);
    if (onHover) onHover(null);
  };

  return (
    <group>
      {/* Translucent Sector Surface */}
      <mesh
        geometry={meshGeometry}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshBasicMaterial
          ref={fillMatRef}
          color={visualConfig.fillColor}
          transparent
          opacity={visualConfig.fillOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>

      {/* Structural Neon Boundary Outline */}
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial
          ref={edgeMatRef}
          color={visualConfig.edgeColor}
          transparent
          opacity={visualConfig.edgeOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
});

/** Data passed from 3D zone → DOM overlay */
export interface ZoneLabelData {
  id: string;
  name: string;
  shortLabel: string;
  source: ProvenanceSource;
  confidence: ConfidenceLevel;
  occupancy?: OccupancyRecord;
  visualState: ZoneVisualState;
  pos: { x: number; y: number } | null;
}
