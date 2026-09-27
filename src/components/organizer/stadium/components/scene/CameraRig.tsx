import React, { useRef, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

export type CameraPreset = "isometric" | "top" | "pitch" | "north" | "east";

interface CameraRigProps {
  preset: CameraPreset;
  onControlsChange?: () => void;
}

const PRESET_CONFIGS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  isometric: { pos: [21, 14, 21], target: [0, 2.0, 0] },
  top: { pos: [0, 32, 0.1], target: [0, 0, 0] },
  pitch: { pos: [0, 3.2, 9], target: [0, 1.8, 0] },
  north: { pos: [0, 13, 24], target: [0, 2.0, 0] },
  east: { pos: [24, 12, 0], target: [0, 2.0, 0] },
};

export const CameraRig: React.FC<CameraRigProps> = ({ preset, onControlsChange }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const targetPos = useRef<THREE.Vector3>(new THREE.Vector3(...PRESET_CONFIGS.isometric.pos));
  const targetLook = useRef<THREE.Vector3>(new THREE.Vector3(...PRESET_CONFIGS.isometric.target));
  const isTransitioning = useRef<boolean>(false);

  useEffect(() => {
    const config = PRESET_CONFIGS[preset];
    if (config) {
      targetPos.current.set(...config.pos);
      targetLook.current.set(...config.target);
      isTransitioning.current = true;
    }
  }, [preset]);

  useFrame((state) => {
    if (isTransitioning.current && controlsRef.current) {
      state.camera.position.lerp(targetPos.current, 0.07);
      controlsRef.current.target.lerp(targetLook.current, 0.07);
      controlsRef.current.update();

      if (state.camera.position.distanceTo(targetPos.current) < 0.15) {
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={6}
      maxDistance={65}
      maxPolarAngle={Math.PI / 2 + 0.01}
      target={[0, 2.0, 0]}
      onChange={onControlsChange}
      onStart={() => {
        isTransitioning.current = false;
      }}
    />
  );
};
