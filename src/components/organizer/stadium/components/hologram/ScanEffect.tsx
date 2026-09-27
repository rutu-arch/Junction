import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ScanEffectProps {
  bounds: { minY: number; maxY: number; radius: number };
  active?: boolean;
  onScanYUpdate?: (scanY: number) => void;
}

export const ScanEffect: React.FC<ScanEffectProps> = ({
  bounds,
  active = true,
  onScanYUpdate,
}) => {
  const planeRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!active) return;
    const t = state.clock.getElapsedTime();
    const range = bounds.maxY - bounds.minY || 10;
    // Smooth sinusoidal sweep up and down
    const normalizedY = (Math.sin(t * 0.7) + 1) / 2;
    const currentY = bounds.minY + normalizedY * range;

    if (planeRef.current) {
      planeRef.current.position.y = currentY;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.15;
    }

    if (onScanYUpdate) {
      onScanYUpdate(currentY);
    }
  });

  const scanRadius = Math.max(bounds.radius * 1.05, 12);

  return (
    <group ref={planeRef} position={[0, bounds.minY, 0]}>
      {/* Ultra-subtle Luminous Scan Slice Disk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, scanRadius, 64]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.02}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Clean, Thin Outer Scan Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[scanRadius - 0.12, scanRadius, 64]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Crosshairs on the scan plane */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                -scanRadius, 0, 0,  scanRadius, 0, 0,
                0, 0, -scanRadius,  0, 0, scanRadius,
              ]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
};
