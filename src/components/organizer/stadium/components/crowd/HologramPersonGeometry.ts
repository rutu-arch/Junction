import * as THREE from "three";

/**
 * Creates an ultra-lightweight low-poly holographic humanoid avatar geometry.
 * Consists of a tapered torso and stylized head merged into a single BufferGeometry (~24 vertices).
 * Height: ~0.32m, Width: ~0.12m (proportional to 1:1 scale stadium model).
 */
export function createHologramPersonGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];

  // ==========================================
  // 1. Torso: Tapered trapezoidal prism
  // ==========================================
  // Base corners (hips / seat level: y = 0.0)
  const baseW = 0.06; // half width (0.12m total)
  const baseD = 0.04; // half depth (0.08m total)
  const topW = 0.07;  // shoulders half width (0.14m total)
  const topD = 0.035; // shoulders half depth (0.07m total)
  const shoulderY = 0.20;

  // Base vertices: 0, 1, 2, 3
  vertices.push(
    -baseW, 0.0,  baseD, // 0: Front-Left
     baseW, 0.0,  baseD, // 1: Front-Right
     baseW, 0.0, -baseD, // 2: Back-Right
    -baseW, 0.0, -baseD  // 3: Back-Left
  );

  // Shoulder vertices: 4, 5, 6, 7
  vertices.push(
    -topW, shoulderY,  topD, // 4: Front-Left
     topW, shoulderY,  topD, // 5: Front-Right
     topW, shoulderY, -topD, // 6: Back-Right
    -topW, shoulderY, -topD  // 7: Back-Left
  );

  // Torso Faces (Front, Right, Back, Left, Top, Bottom)
  // Front
  indices.push(0, 1, 5,  0, 5, 4);
  // Right
  indices.push(1, 2, 6,  1, 6, 5);
  // Back
  indices.push(2, 3, 7,  2, 7, 6);
  // Left
  indices.push(3, 0, 4,  3, 4, 7);
  // Top (shoulders)
  indices.push(4, 5, 6,  4, 6, 7);

  // ==========================================
  // 2. Head: Low-poly faceted capsule / octahedron
  // ==========================================
  const neckY = 0.21;
  const headCenterY = 0.27;
  const headTopY = 0.33;
  const headR = 0.045; // head radius (0.09m diameter)

  const headBaseIdx = 8;
  // Neck vertex: 8
  vertices.push(0.0, neckY, 0.0);
  // Head equator vertices: 9, 10, 11, 12
  vertices.push(
    -headR, headCenterY, 0.0,   // 9: Left
     0.0,   headCenterY, headR, // 10: Front
     headR, headCenterY, 0.0,   // 11: Right
     0.0,   headCenterY, -headR  // 12: Back
  );
  // Crown apex: 13
  vertices.push(0.0, headTopY, 0.0);

  // Lower head pyramid (neck to equator)
  indices.push(
    headBaseIdx + 0, headBaseIdx + 2, headBaseIdx + 1,
    headBaseIdx + 0, headBaseIdx + 3, headBaseIdx + 2,
    headBaseIdx + 0, headBaseIdx + 4, headBaseIdx + 3,
    headBaseIdx + 0, headBaseIdx + 1, headBaseIdx + 4
  );

  // Upper head pyramid (equator to crown)
  indices.push(
    headBaseIdx + 5, headBaseIdx + 1, headBaseIdx + 2,
    headBaseIdx + 5, headBaseIdx + 2, headBaseIdx + 3,
    headBaseIdx + 5, headBaseIdx + 3, headBaseIdx + 4,
    headBaseIdx + 5, headBaseIdx + 4, headBaseIdx + 1
  );

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
