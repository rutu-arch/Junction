import React, { useMemo, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createHologramMaterial } from "../hologram/HologramMaterial";
import type { RenderMode } from "../hologram/HologramMaterial";

interface StadiumModelProps {
  modelUrl?: string;
  renderMode: RenderMode;
  showEdges?: boolean;
  scanY?: number;
}

export const StadiumModel: React.FC<StadiumModelProps> = ({
  modelUrl = "/models/wankhede_stadium.glb",
  renderMode,
  showEdges = true,
  scanY = 0,
}) => {
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<THREE.ShaderMaterial[]>([]);

  // Clone and prepare model geometry
  const processedGroup = useMemo(() => {
    const root = new THREE.Group();
    const cloned = scene.clone(true);

    // Compute bounding box of original GLB
    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Normalize scale so stadium diameter is ~24 units
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const targetDim = 24.0;
    const scaleFactor = targetDim / maxDim;

    cloned.scale.setScalar(scaleFactor);

    // Center on X and Z, and place base at y = 0.5
    cloned.position.x = -center.x * scaleFactor;
    cloned.position.z = -center.z * scaleFactor;
    cloned.position.y = -bbox.min.y * scaleFactor + 0.5;

    root.add(cloned);

    return root;
  }, [scene]);

  // Apply holographic materials and edge highlights
  useEffect(() => {
    const mats: THREE.ShaderMaterial[] = [];

    processedGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        // Create shader material for mesh
        const mat = createHologramMaterial(renderMode);
        mesh.material = mat;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mats.push(mat);

        // Remove old edge helpers if any
        const existingEdges = mesh.children.filter((c) => c.name === "__holo_edges__");
        existingEdges.forEach((e) => mesh.remove(e));

        if (showEdges && mesh.geometry) {
          try {
            // High-precision structural edge lines (26 deg threshold captures architectural edges cleanly)
            const edgesGeom = new THREE.EdgesGeometry(mesh.geometry, 26);
            const edgeLineMat = new THREE.LineBasicMaterial({
              color: renderMode === "wireframe" ? "#00ffff" : "#00f0ff",
              transparent: true,
              opacity: renderMode === "wireframe" ? 0.65 : 0.38,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            });
            const edgeLines = new THREE.LineSegments(edgesGeom, edgeLineMat);
            edgeLines.name = "__holo_edges__";
            mesh.add(edgeLines);
          } catch {
            // Ignore non-standard geometry edge creation issues
          }
        }
      }
    });

    materialsRef.current = mats;
  }, [processedGroup, renderMode, showEdges]);

  // Animate uniforms frame-by-frame
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    for (const mat of materialsRef.current) {
      if (mat.uniforms.uTime) {
        mat.uniforms.uTime.value = elapsed;
      }
      if (mat.uniforms.uScanY) {
        mat.uniforms.uScanY.value = scanY;
      }
    }
  });

  return <primitive ref={groupRef} object={processedGroup} />;
};

useGLTF.preload("/models/wankhede_stadium.glb");
