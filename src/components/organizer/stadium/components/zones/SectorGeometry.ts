import * as THREE from "three";
import type { SpatialCalibration } from "../../data/stadium/types";

/**
 * Creates an inclined curved stadium sector geometry matching a stand or block arc.
 */
export function createSectorGeometry(
  spatial: SpatialCalibration,
  segments: number = 24
): { meshGeometry: THREE.BufferGeometry; edgeGeometry: THREE.BufferGeometry } {
  const { innerRadius, outerRadius, arcStartDeg, arcEndDeg, elevationY, height, tiltDeg = 20 } = spatial;

  // Convert angles to radians (0 deg = North / +Z, 90 deg = East / +X, etc.)
  // Three.js XZ: x = sin(angle), z = cos(angle)
  const toRad = (deg: number) => ((deg % 360) * Math.PI) / 180;
  let startRad = toRad(arcStartDeg);
  let endRad = toRad(arcEndDeg);

  // Handle wrap-around (e.g. 330 deg to 30 deg)
  if (endRad <= startRad) {
    endRad += Math.PI * 2;
  }

  const arcSpan = endRad - startRad;
  const numRadial = Math.max(Math.ceil((arcSpan / (Math.PI * 2)) * segments * 2), 6);

  const vertices: number[] = [];
  const indices: number[] = [];
  const edgeVertices: number[] = [];

  const tiltRad = (tiltDeg * Math.PI) / 180;
  const radialDistance = outerRadius - innerRadius;
  const rise = Math.sin(tiltRad) * radialDistance;

  // Generate top curved surface grid (2 rows: inner ring and outer ring)
  for (let i = 0; i <= numRadial; i++) {
    const frac = i / numRadial;
    const angle = startRad + frac * arcSpan;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    // Inner point (pitch rim)
    const inX = innerRadius * sinA;
    const inZ = innerRadius * cosA;
    const inY = elevationY;

    // Outer point (stand upper rim)
    const outX = outerRadius * sinA;
    const outZ = outerRadius * cosA;
    const outY = elevationY + rise;

    // Bottom inner point
    const bInY = Math.max(elevationY - height * 0.4, 0.3);
    // Bottom outer point
    const bOutY = Math.max(outY - height * 0.4, 0.3);

    // Vertex 0: Top Inner
    vertices.push(inX, inY, inZ);
    // Vertex 1: Top Outer
    vertices.push(outX, outY, outZ);
    // Vertex 2: Bottom Inner
    vertices.push(inX, bInY, inZ);
    // Vertex 3: Bottom Outer
    vertices.push(outX, bOutY, outZ);
  }

  // Build faces
  for (let i = 0; i < numRadial; i++) {
    const row = i * 4;
    const nextRow = (i + 1) * 4;

    // Top surface
    indices.push(row + 0, row + 1, nextRow + 0);
    indices.push(nextRow + 0, row + 1, nextRow + 1);

    // Bottom surface
    indices.push(row + 2, nextRow + 2, row + 3);
    indices.push(nextRow + 2, nextRow + 3, row + 3);

    // Inner wall
    indices.push(row + 0, nextRow + 0, row + 2);
    indices.push(nextRow + 0, nextRow + 2, row + 2);

    // Outer wall
    indices.push(row + 1, row + 3, nextRow + 1);
    indices.push(nextRow + 1, row + 3, nextRow + 3);
  }

  // Left and right boundary side caps
  const first = 0;
  const last = numRadial * 4;
  indices.push(first + 0, first + 2, first + 1);
  indices.push(first + 1, first + 2, first + 3);
  indices.push(last + 0, last + 1, last + 2);
  indices.push(last + 1, last + 3, last + 2);

  // Build boundary outline edges
  for (let i = 0; i < numRadial; i++) {
    const r1 = i * 4;
    const r2 = (i + 1) * 4;
    // Top inner arc
    edgeVertices.push(vertices[r1 * 3], vertices[r1 * 3 + 1], vertices[r1 * 3 + 2]);
    edgeVertices.push(vertices[r2 * 3], vertices[r2 * 3 + 1], vertices[r2 * 3 + 2]);

    // Top outer arc
    edgeVertices.push(vertices[(r1 + 1) * 3], vertices[(r1 + 1) * 3 + 1], vertices[(r1 + 1) * 3 + 2]);
    edgeVertices.push(vertices[(r2 + 1) * 3], vertices[(r2 + 1) * 3 + 1], vertices[(r2 + 1) * 3 + 2]);
  }

  // Radial side boundary lines
  // Start edge
  edgeVertices.push(vertices[0], vertices[1], vertices[2]);
  edgeVertices.push(vertices[3], vertices[4], vertices[5]);
  // End edge
  edgeVertices.push(vertices[last * 3], vertices[last * 3 + 1], vertices[last * 3 + 2]);
  edgeVertices.push(vertices[(last + 1) * 3], vertices[(last + 1) * 3 + 1], vertices[(last + 1) * 3 + 2]);

  const meshGeometry = new THREE.BufferGeometry();
  meshGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  meshGeometry.setIndex(indices);
  meshGeometry.computeVertexNormals();

  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(edgeVertices, 3));

  return { meshGeometry, edgeGeometry };
}

/**
 * Calculates centroid coordinates for floating 3D label placement.
 */
export function getSectorLabelPosition(spatial: SpatialCalibration): [number, number, number] {
  const { innerRadius, outerRadius, arcStartDeg, arcEndDeg, elevationY, height } = spatial;
  const toRad = (deg: number) => ((deg % 360) * Math.PI) / 180;
  let startRad = toRad(arcStartDeg);
  let endRad = toRad(arcEndDeg);
  if (endRad <= startRad) endRad += Math.PI * 2;

  const midAngle = (startRad + endRad) / 2;
  const midRadius = (innerRadius + outerRadius) / 2;
  const x = midRadius * Math.sin(midAngle);
  const z = midRadius * Math.cos(midAngle);
  const y = elevationY + height * 0.65 + 0.8;

  return [x, y, z];
}
