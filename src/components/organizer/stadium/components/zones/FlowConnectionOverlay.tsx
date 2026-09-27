import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useOccupancy } from "../../data/occupancy";

/**
 * 3D Holographic Flow Connection Arc.
 * Renders a glowing directional laser tube between Gate 01 and Gate 02 during active crowd redirection.
 */
export const FlowConnectionOverlay: React.FC = () => {
  const { activeRecommendations, snapshot } = useOccupancy();
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  // Check if redirection between Gate 01 and Gate 02 is suggested or active
  const hasActiveRedirection = useMemo(() => {
    const isApplied = snapshot.activeOperatorActions.includes("REDIRECT_GATE_1_TO_2");
    const rec = activeRecommendations.find((r) => r.actionKey === "REDIRECT_GATE_1_TO_2");
    return (rec && rec.status !== "RESOLVED") || isApplied;
  }, [activeRecommendations, snapshot.activeOperatorActions]);

  // Generate 3D curved tube geometry between Gate 01 [0, 0.8, 11.8] and Gate 02 [6.5, 0.8, 9.8]
  const tubeGeometry = useMemo(() => {
    const p0 = new THREE.Vector3(0, 0.8, 11.8);
    const p1 = new THREE.Vector3(3.5, 2.4, 11.8); // Elevated apex over concourse
    const p2 = new THREE.Vector3(6.5, 0.8, 9.8);

    const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
    return new THREE.TubeGeometry(curve, 32, 0.07, 8, false);
  }, []);

  // Frame animation for laser pulse travel
  useFrame((state) => {
    if (matRef.current) {
      const t = state.clock.getElapsedTime();
      matRef.current.opacity = 0.55 + Math.sin(t * 4.0) * 0.35;
    }
  });

  if (!hasActiveRedirection) return null;

  const isApplied = snapshot.activeOperatorActions.includes("REDIRECT_GATE_1_TO_2");

  return (
    <group name="flow-connection-arcs">
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial
          ref={matRef}
          color={isApplied ? "#00ffaa" : "#ffc400"}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
