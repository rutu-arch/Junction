import React, { useState, memo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { StadiumGate, StadiumConcourse } from "../../data/stadium/types";
import { useOccupancy } from "../../data/occupancy";
import type { GateSimulationState } from "../../data/simulation/types";

const GATE_LABEL_OFFSET_Y = 2.0;

const _wp = new THREE.Vector3();
const _ndc = new THREE.Vector3();

/** Data passed from 3D gate → DOM overlay */
export interface GateLabelData {
  id: string;
  gateCode: string;
  type: string;
  simState?: GateSimulationState;
  isSelected: boolean;
  pos: { x: number; y: number } | null;
}

interface SingleGateMarkerProps {
  gate: StadiumGate;
  simState?: GateSimulationState;
  isSelected: boolean;
  showLabels: boolean;
  onSelect?: (id: string) => void;
  onPositionUpdate?: (id: string, pos: { x: number; y: number } | null) => void;
}

const SingleGateMarker: React.FC<SingleGateMarkerProps> = memo(({
  gate,
  simState,
  isSelected,
  showLabels,
  onSelect,
  onPositionUpdate,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { camera, gl } = useThree();

  const status = simState ? simState.status : "NORMAL";
  const isVip = gate.type === "vip" || gate.type === "players";

  let beaconColor = "#00f0ff";
  if (isVip) beaconColor = "#ffd700";
  else if (status === "CRITICAL") beaconColor = "#ff365f";
  else if (status === "HIGH") beaconColor = "#ffc400";
  else if (isSelected) beaconColor = "#00ffaa";

  // Project 3D position + label offset → 2D screen
  useFrame(() => {
    if (!onPositionUpdate) return;
    if (!showLabels) { onPositionUpdate(gate.id, null); return; }

    _wp.set(gate.position[0], gate.position[1] + GATE_LABEL_OFFSET_Y, gate.position[2]);
    _ndc.copy(_wp).project(camera);

    if (_ndc.z > 1) { onPositionUpdate(gate.id, null); return; }

    const canvas = gl.domElement;
    const x = (_ndc.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-_ndc.y * 0.5 + 0.5) * canvas.clientHeight;
    onPositionUpdate(gate.id, { x, y });
  });

  const opacity = isSelected ? 0.95 : status === "CRITICAL" ? 0.85 : 0.6;

  return (
    <group
      position={gate.position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (onSelect) onSelect(gate.id);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setIsHovered(true);
      }}
      onPointerOut={() => setIsHovered(false)}
    >
      {/* Ground Beacon Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.3, 0.45, 24]} />
        <meshBasicMaterial color={beaconColor} transparent opacity={opacity} />
      </mesh>

      {/* Vertical Laser Marker Pin */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.5, 8]} />
        <meshBasicMaterial color={beaconColor} transparent opacity={isSelected ? 0.95 : 0.65} />
      </mesh>

      {/* Top Glowing Orb */}
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color={beaconColor} />
      </mesh>
    </group>
  );
});

interface GateMarkerProps {
  gates: StadiumGate[];
  concourses: StadiumConcourse[];
  selectedId: string | null;
  onSelect?: (id: string) => void;
  showLabels?: boolean;
  onGatePositionUpdate?: (id: string, pos: { x: number; y: number } | null, gateData: Omit<GateLabelData, "pos">) => void;
}

export const GateMarker: React.FC<GateMarkerProps> = memo(({
  gates,
  concourses,
  selectedId,
  onSelect,
  showLabels = true,
  onGatePositionUpdate,
}) => {
  const { gateStates } = useOccupancy();

  return (
    <group>
      {/* Stadium Gates with Live Operational Pressure & Queue State */}
      {gates.map((g) => (
        <SingleGateMarker
          key={g.id}
          gate={g}
          simState={gateStates[g.id]}
          isSelected={selectedId === g.id}
          showLabels={showLabels}
          onSelect={onSelect}
          onPositionUpdate={onGatePositionUpdate ? (id, pos) => {
            onGatePositionUpdate(id, pos, {
              id: g.id,
              gateCode: g.gateCode,
              type: g.type,
              simState: gateStates[g.id],
              isSelected: selectedId === g.id,
            });
          } : undefined}
        />
      ))}

      {/* Stadium Concourses */}
      {concourses.map((c) => {
        const isSelected = selectedId === c.id;
        return (
          <group
            key={c.id}
            position={c.position}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              if (onSelect) onSelect(c.id);
            }}
          >
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <circleGeometry args={[0.8, 24]} />
              <meshBasicMaterial
                color="#00a8ff"
                transparent
                opacity={isSelected ? 0.35 : 0.12}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
});
