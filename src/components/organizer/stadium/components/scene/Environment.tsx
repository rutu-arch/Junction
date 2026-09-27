import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Grid, Sparkles } from "@react-three/drei";
import * as THREE from "three";

interface EnvironmentProps {
  radius?: number;
}

export const Environment: React.FC<EnvironmentProps> = ({ radius = 18 }) => {
  const radarRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (radarRingRef.current) {
      radarRingRef.current.rotation.z = t * 0.08;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Background Dark Fog for Command-Center Depth */}
      <fog attach="fog" args={["#01050a", 28, 80]} />

      {/* Subtle Technical Ground Grid */}
      <Grid
        position={[0, 0.01, 0]}
        args={[60, 60]}
        cellSize={1.0}
        cellThickness={0.5}
        cellColor="#011824"
        sectionSize={5.0}
        sectionThickness={0.9}
        sectionColor="#023850"
        fadeDistance={45}
        fadeStrength={1.5}
      />

      {/* Subtle Dark Radial Pedestal Underneath Stadium */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[radius * 1.1, 64]} />
        <meshBasicMaterial
          color="#001626"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Thin Outer Coordinate Ring */}
      <group position={[0, 0.03, 0]}>
        <mesh ref={radarRingRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 0.98 - 0.08, radius * 0.98, 96]} />
          <meshBasicMaterial
            color="#00f0ff"
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Very Subtle Holographic Atmospheric Particulates */}
      <Sparkles
        count={50}
        scale={[28, 12, 28]}
        size={2.0}
        speed={0.3}
        opacity={0.25}
        color="#7df9ff"
        position={[0, 4, 0]}
      />
    </group>
  );
};
