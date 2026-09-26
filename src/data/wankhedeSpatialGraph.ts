/**
 * WANKHEDE HOLO — Authoritative Spatial Graph & Seat Database for Wankhede Stadium.
 *
 * Provides real-time 3D coordinate mapping, A* spatial routing, stand/block registries,
 * gate/exit coordinates, and spatial node definitions.
 */

export interface StadiumNode {
  id: string;
  name: string;
  category: "GATE" | "CONCOURSE" | "STAND" | "BLOCK" | "SEAT" | "EXIT" | "ACCESSIBLE_LIFT";
  lng: number;
  lat: number;
  elevation: number; // Meters above ground level
  accessible: boolean; // Accessible via ramp/lift
  description?: string;
}

export interface StadiumEdge {
  from: string;
  to: string;
  distanceMeters: number;
  isAccessible: boolean;
  congestionFactor: number; // 1.0 = clear, 2.5 = heavy crowd
}

export interface SeatRecord {
  id: string; // e.g. "D-142"
  stand: string; // "Sunil Gavaskar Stand"
  block: string; // "Block D"
  row: string; // "Row 14"
  number: string; // "Seat 42"
  gateRecommendation: string; // "Gate 1"
  exitRecommendation: string; // "Exit 4"
  nodeId: string;
  lng: number;
  lat: number;
  elevation: number;
}

// ── 1. STAND DEFINITIONS ───────────────────────────────────────────────────
export const WANKHEDE_STANDS = [
  { id: "STAND_GAVASKAR", name: "Sunil Gavaskar Stand", shortName: "GAVASKAR STAND", gate: "Gate 1", exit: "Exit 4", color: "#38bdf8", lng: 72.8262, lat: 18.9388, elevation: 18 },
  { id: "STAND_TENDULKAR", name: "Sachin Tendulkar Stand", shortName: "TENDULKAR STAND", gate: "Gate 2", exit: "Exit 1", color: "#f59e0b", lng: 72.8252, lat: 18.9392, elevation: 22 },
  { id: "STAND_MERCHANT", name: "Vijay Merchant Stand", shortName: "MERCHANT STAND", gate: "Gate 3", exit: "Exit 2", color: "#10b981", lng: 72.8260, lat: 18.9380, elevation: 16 },
  { id: "STAND_MCA", name: "MCA Pavilion", shortName: "MCA PAVILION", gate: "Gate 4", exit: "Exit 3", color: "#a855f7", lng: 72.8250, lat: 18.9385, elevation: 25 },
  { id: "STAND_GARWARE", name: "Garware Pavilion", shortName: "GARWARE PAVILION", gate: "Gate 5", exit: "Exit 4", color: "#ec4899", lng: 72.8265, lat: 18.9384, elevation: 20 },
  { id: "STAND_DIVECHA", name: "Divecha Pavilion", shortName: "DIVECHA PAVILION", gate: "Gate 6", exit: "Exit 5", color: "#06b6d4", lng: 72.8256, lat: 18.9378, elevation: 18 },
];

// ── 2. STADIUM NODES GRAPH ─────────────────────────────────────────────────
export const STADIUM_NODES: Record<string, StadiumNode> = {
  // Gates
  NODE_GATE_1: { id: "NODE_GATE_1", name: "Gate 1", category: "GATE", lng: 72.8268, lat: 18.9389, elevation: 0, accessible: true, description: "Main North-East Entrance · Churchgate Link" },
  NODE_GATE_2: { id: "NODE_GATE_2", name: "Gate 2", category: "GATE", lng: 72.8253, lat: 18.9395, elevation: 0, accessible: true, description: "East Promenade Gate · Marine Drive Link" },
  NODE_GATE_3: { id: "NODE_GATE_3", name: "Gate 3", category: "GATE", lng: 72.8262, lat: 18.9376, elevation: 0, accessible: true, description: "South Gate · Egress Ramp A" },
  NODE_GATE_4: { id: "NODE_GATE_4", name: "Gate 4", category: "GATE", lng: 72.8248, lat: 18.9384, elevation: 0, accessible: true, description: "VIP / Members Pavilion Entry" },
  NODE_GATE_5: { id: "NODE_GATE_5", name: "Gate 5", category: "GATE", lng: 72.8266, lat: 18.9382, elevation: 0, accessible: false, description: "East Garware Turnstiles" },
  NODE_GATE_6: { id: "NODE_GATE_6", name: "Gate 6", category: "GATE", lng: 72.8254, lat: 18.9376, elevation: 0, accessible: true, description: "South-West Media & Staff Gate" },

  // Concourses
  NODE_CONCOURSE_NORTH: { id: "NODE_CONCOURSE_NORTH", name: "North Concourse", category: "CONCOURSE", lng: 72.8264, lat: 18.9391, elevation: 4, accessible: true },
  NODE_CONCOURSE_EAST: { id: "NODE_CONCOURSE_EAST", name: "East Concourse", category: "CONCOURSE", lng: 72.8265, lat: 18.9386, elevation: 4, accessible: true },
  NODE_CONCOURSE_SOUTH: { id: "NODE_CONCOURSE_SOUTH", name: "South Concourse", category: "CONCOURSE", lng: 72.8258, lat: 18.9379, elevation: 4, accessible: true },
  NODE_CONCOURSE_WEST: { id: "NODE_CONCOURSE_WEST", name: "West Concourse", category: "CONCOURSE", lng: 72.8249, lat: 18.9386, elevation: 4, accessible: true },

  // Accessible Ramp & Lift Hubs
  NODE_LIFT_NORTH: { id: "NODE_LIFT_NORTH", name: "North Elevator Hub A", category: "ACCESSIBLE_LIFT", lng: 72.8265, lat: 18.9390, elevation: 4, accessible: true },
  NODE_RAMP_SOUTH: { id: "NODE_RAMP_SOUTH", name: "South Accessible Ramp B", category: "ACCESSIBLE_LIFT", lng: 72.8259, lat: 18.9381, elevation: 4, accessible: true },

  // Blocks
  NODE_BLOCK_D: { id: "NODE_BLOCK_D", name: "Block D (Gavaskar Stand)", category: "BLOCK", lng: 72.8263, lat: 18.9388, elevation: 12, accessible: true },
  NODE_BLOCK_A: { id: "NODE_BLOCK_A", name: "Block A (MCA Pavilion)", category: "BLOCK", lng: 72.8251, lat: 18.9386, elevation: 16, accessible: true },
  NODE_BLOCK_B: { id: "NODE_BLOCK_B", name: "Block B (Garware Pavilion)", category: "BLOCK", lng: 72.8264, lat: 18.9383, elevation: 14, accessible: true },
  NODE_BLOCK_C: { id: "NODE_BLOCK_C", name: "Block C (Merchant Stand)", category: "BLOCK", lng: 72.8260, lat: 18.9381, elevation: 10, accessible: true },
  NODE_BLOCK_E: { id: "NODE_BLOCK_E", name: "Block E (Tendulkar Stand)", category: "BLOCK", lng: 72.8253, lat: 18.9392, elevation: 18, accessible: true },
  NODE_BLOCK_F: { id: "NODE_BLOCK_F", name: "Block F (Divecha Pavilion)", category: "BLOCK", lng: 72.8256, lat: 18.9379, elevation: 12, accessible: true },

  // Specific Seats
  NODE_SEAT_D142: { id: "NODE_SEAT_D142", name: "Seat D-142", category: "SEAT", lng: 72.8262, lat: 18.9388, elevation: 18, accessible: true },
  NODE_SEAT_A108: { id: "NODE_SEAT_A108", name: "Seat A-108", category: "SEAT", lng: 72.8250, lat: 18.9386, elevation: 22, accessible: true },
  NODE_SEAT_B205: { id: "NODE_SEAT_B205", name: "Seat B-205", category: "SEAT", lng: 72.8265, lat: 18.9384, elevation: 16, accessible: true },
  NODE_SEAT_C054: { id: "NODE_SEAT_C054", name: "Seat C-054", category: "SEAT", lng: 72.8260, lat: 18.9380, elevation: 12, accessible: true },
  NODE_SEAT_E312: { id: "NODE_SEAT_E312", name: "Seat E-312", category: "SEAT", lng: 72.8252, lat: 18.9392, elevation: 24, accessible: true },
  NODE_SEAT_F119: { id: "NODE_SEAT_F119", name: "Seat F-119", category: "SEAT", lng: 72.8256, lat: 18.9378, elevation: 15, accessible: true },

  // Emergency Exits
  NODE_EXIT_1: { id: "NODE_EXIT_1", name: "Exit 1", category: "EXIT", lng: 72.8250, lat: 18.9396, elevation: 0, accessible: true, description: "North Marine Drive Evacuation Corridor" },
  NODE_EXIT_2: { id: "NODE_EXIT_2", name: "Exit 2", category: "EXIT", lng: 72.8265, lat: 18.9374, elevation: 0, accessible: true, description: "South Egress to Oval Maidan" },
  NODE_EXIT_3: { id: "NODE_EXIT_3", name: "Exit 3", category: "EXIT", lng: 72.8245, lat: 18.9385, elevation: 0, accessible: true, description: "West Coastal Road Egress" },
  NODE_EXIT_4: { id: "NODE_EXIT_4", name: "Exit 4", category: "EXIT", lng: 72.8270, lat: 18.9388, elevation: 0, accessible: true, description: "Fastest Churchgate Transit Link" },
  NODE_EXIT_5: { id: "NODE_EXIT_5", name: "Exit 5", category: "EXIT", lng: 72.8253, lat: 18.9373, elevation: 0, accessible: true, description: "South-West Emergency Bypass" },
};

// ── 3. SPATIAL GRAPH EDGES ─────────────────────────────────────────────────
export const STADIUM_EDGES: StadiumEdge[] = [
  // Gate 1 connections
  { from: "NODE_GATE_1", to: "NODE_CONCOURSE_NORTH", distanceMeters: 65, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_GATE_1", to: "NODE_EXIT_4", distanceMeters: 45, isAccessible: true, congestionFactor: 1.1 },

  // Gate 2 connections
  { from: "NODE_GATE_2", to: "NODE_CONCOURSE_NORTH", distanceMeters: 55, isAccessible: true, congestionFactor: 1.2 },
  { from: "NODE_GATE_2", to: "NODE_EXIT_1", distanceMeters: 40, isAccessible: true, congestionFactor: 1.0 },

  // Gate 3 connections
  { from: "NODE_GATE_3", to: "NODE_CONCOURSE_SOUTH", distanceMeters: 60, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_GATE_3", to: "NODE_EXIT_2", distanceMeters: 50, isAccessible: true, congestionFactor: 1.0 },

  // Gate 4 connections
  { from: "NODE_GATE_4", to: "NODE_CONCOURSE_WEST", distanceMeters: 40, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_GATE_4", to: "NODE_EXIT_3", distanceMeters: 35, isAccessible: true, congestionFactor: 1.0 },

  // Gate 5 connections
  { from: "NODE_GATE_5", to: "NODE_CONCOURSE_EAST", distanceMeters: 50, isAccessible: false, congestionFactor: 1.4 },

  // Gate 6 connections
  { from: "NODE_GATE_6", to: "NODE_CONCOURSE_SOUTH", distanceMeters: 55, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_GATE_6", to: "NODE_EXIT_5", distanceMeters: 30, isAccessible: true, congestionFactor: 1.0 },

  // Concourse spine connections
  { from: "NODE_CONCOURSE_NORTH", to: "NODE_CONCOURSE_EAST", distanceMeters: 110, isAccessible: true, congestionFactor: 1.3 },
  { from: "NODE_CONCOURSE_EAST", to: "NODE_CONCOURSE_SOUTH", distanceMeters: 120, isAccessible: true, congestionFactor: 1.1 },
  { from: "NODE_CONCOURSE_SOUTH", to: "NODE_CONCOURSE_WEST", distanceMeters: 115, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_CONCOURSE_WEST", to: "NODE_CONCOURSE_NORTH", distanceMeters: 105, isAccessible: true, congestionFactor: 1.0 },

  // Lifts and Ramps
  { from: "NODE_CONCOURSE_NORTH", to: "NODE_LIFT_NORTH", distanceMeters: 20, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_CONCOURSE_SOUTH", to: "NODE_RAMP_SOUTH", distanceMeters: 25, isAccessible: true, congestionFactor: 1.0 },

  // Block connections from concourses
  { from: "NODE_CONCOURSE_NORTH", to: "NODE_BLOCK_E", distanceMeters: 75, isAccessible: true, congestionFactor: 1.2 },
  { from: "NODE_CONCOURSE_EAST", to: "NODE_BLOCK_D", distanceMeters: 80, isAccessible: true, congestionFactor: 1.1 },
  { from: "NODE_CONCOURSE_EAST", to: "NODE_BLOCK_B", distanceMeters: 70, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_CONCOURSE_SOUTH", to: "NODE_BLOCK_C", distanceMeters: 65, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_CONCOURSE_SOUTH", to: "NODE_BLOCK_F", distanceMeters: 60, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_CONCOURSE_WEST", to: "NODE_BLOCK_A", distanceMeters: 55, isAccessible: true, congestionFactor: 1.0 },

  // Accessible Lift connections directly to Blocks
  { from: "NODE_LIFT_NORTH", to: "NODE_BLOCK_E", distanceMeters: 45, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_LIFT_NORTH", to: "NODE_BLOCK_D", distanceMeters: 50, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_RAMP_SOUTH", to: "NODE_BLOCK_C", distanceMeters: 40, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_RAMP_SOUTH", to: "NODE_BLOCK_F", distanceMeters: 35, isAccessible: true, congestionFactor: 1.0 },

  // Block to Seat connections
  { from: "NODE_BLOCK_D", to: "NODE_SEAT_D142", distanceMeters: 40, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_BLOCK_A", to: "NODE_SEAT_A108", distanceMeters: 35, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_BLOCK_B", to: "NODE_SEAT_B205", distanceMeters: 45, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_BLOCK_C", to: "NODE_SEAT_C054", distanceMeters: 30, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_BLOCK_E", to: "NODE_SEAT_E312", distanceMeters: 50, isAccessible: true, congestionFactor: 1.0 },
  { from: "NODE_BLOCK_F", to: "NODE_SEAT_F119", distanceMeters: 35, isAccessible: true, congestionFactor: 1.0 },
];

// ── 4. SEAT DATABASE ───────────────────────────────────────────────────────
export const SEAT_DATABASE: SeatRecord[] = [
  { id: "D-142", stand: "Sunil Gavaskar Stand", block: "Block D", row: "Row 14", number: "Seat 42", gateRecommendation: "Gate 1", exitRecommendation: "Exit 4", nodeId: "NODE_SEAT_D142", lng: 72.8262, lat: 18.9388, elevation: 18 },
  { id: "A-108", stand: "MCA Pavilion", block: "Block A", row: "Row 10", number: "Seat 8", gateRecommendation: "Gate 4", exitRecommendation: "Exit 3", nodeId: "NODE_SEAT_A108", lng: 72.8250, lat: 18.9386, elevation: 22 },
  { id: "B-205", stand: "Garware Pavilion", block: "Block B", row: "Row 20", number: "Seat 5", gateRecommendation: "Gate 5", exitRecommendation: "Exit 4", nodeId: "NODE_SEAT_B205", lng: 72.8265, lat: 18.9384, elevation: 16 },
  { id: "C-054", stand: "Vijay Merchant Stand", block: "Block C", row: "Row 5", number: "Seat 54", gateRecommendation: "Gate 3", exitRecommendation: "Exit 2", nodeId: "NODE_SEAT_C054", lng: 72.8260, lat: 18.9380, elevation: 12 },
  { id: "E-312", stand: "Sachin Tendulkar Stand", block: "Block E", row: "Row 31", number: "Seat 12", gateRecommendation: "Gate 2", exitRecommendation: "Exit 1", nodeId: "NODE_SEAT_E312", lng: 72.8252, lat: 18.9392, elevation: 24 },
  { id: "F-119", stand: "Divecha Pavilion", block: "Block F", row: "Row 11", number: "Seat 19", gateRecommendation: "Gate 6", exitRecommendation: "Exit 5", nodeId: "NODE_SEAT_F119", lng: 72.8256, lat: 18.9378, elevation: 15 },
];

// ── 5. A* SPATIAL ROUTER IMPLEMENTATION ────────────────────────────────────
export interface RouteResult {
  path: StadiumNode[];
  totalDistanceMeters: number;
  estimatedMinutes: number;
  steps: string[];
  routeType: "SHORTEST" | "FASTEST" | "ACCESSIBLE" | "EVACUATION";
}

export function findSpatialRoute(
  fromNodeId: string,
  toNodeId: string,
  routeType: "SHORTEST" | "FASTEST" | "ACCESSIBLE" | "EVACUATION" = "SHORTEST"
): RouteResult | null {
  const startNode = STADIUM_NODES[fromNodeId];
  const endNode = STADIUM_NODES[toNodeId];
  if (!startNode || !endNode) return null;

  // Build adjacency graph
  const adjacency: Record<string, { node: StadiumNode; edge: StadiumEdge }[]> = {};
  Object.keys(STADIUM_NODES).forEach((id) => {
    adjacency[id] = [];
  });

  STADIUM_EDGES.forEach((edge) => {
    if (routeType === "ACCESSIBLE" && !edge.isAccessible) return;

    const nFrom = STADIUM_NODES[edge.from];
    const nTo = STADIUM_NODES[edge.to];
    if (nFrom && nTo) {
      adjacency[edge.from].push({ node: nTo, edge });
      // Undirected pathing across stadium concourses
      adjacency[edge.to].push({ node: nFrom, edge: { ...edge, from: edge.to, to: edge.from } });
    }
  });

  // A* Algorithm
  const openSet = new Set<string>([fromNodeId]);
  const cameFrom: Record<string, string> = {};
  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};

  Object.keys(STADIUM_NODES).forEach((id) => {
    gScore[id] = Infinity;
    fScore[id] = Infinity;
  });

  gScore[fromNodeId] = 0;
  fScore[fromNodeId] = heuristic(startNode, endNode);

  while (openSet.size > 0) {
    // Current node with lowest fScore
    let currentId = Array.from(openSet).reduce((lowest, node) =>
      fScore[node] < fScore[lowest] ? node : lowest
    );

    if (currentId === toNodeId) {
      // Reconstruct path
      const pathNodes: StadiumNode[] = [STADIUM_NODES[currentId]];
      while (cameFrom[currentId]) {
        currentId = cameFrom[currentId];
        pathNodes.unshift(STADIUM_NODES[currentId]);
      }

      // Calculate total distance & steps
      let totalDist = 0;
      for (let i = 0; i < pathNodes.length - 1; i++) {
        const edge = STADIUM_EDGES.find(
          (e) =>
            (e.from === pathNodes[i].id && e.to === pathNodes[i + 1].id) ||
            (e.to === pathNodes[i].id && e.from === pathNodes[i + 1].id)
        );
        const dist = edge ? edge.distanceMeters : 40;
        const weight = routeType === "FASTEST" && edge ? edge.congestionFactor : 1.0;
        totalDist += Math.round(dist * weight);
      }

      // Walking speed approx 1.2 m/s (72 m/min)
      const walkSpeedMetersPerMin = routeType === "FASTEST" ? 85 : 70;
      const estimatedMinutes = Math.max(1, Math.ceil(totalDist / walkSpeedMetersPerMin));

      // Human readable step sequence
      const steps = pathNodes.map((n) => n.name);

      return {
        path: pathNodes,
        totalDistanceMeters: totalDist,
        estimatedMinutes,
        steps,
        routeType,
      };
    }

    openSet.delete(currentId);

    const neighbors = adjacency[currentId] || [];
    for (const { node: neighbor, edge } of neighbors) {
      const edgeWeight =
        routeType === "FASTEST"
          ? edge.distanceMeters * edge.congestionFactor
          : edge.distanceMeters;

      const tentativeGScore = gScore[currentId] + edgeWeight;

      if (tentativeGScore < gScore[neighbor.id]) {
        cameFrom[neighbor.id] = currentId;
        gScore[neighbor.id] = tentativeGScore;
        fScore[neighbor.id] = gScore[neighbor.id] + heuristic(neighbor, endNode);
        openSet.add(neighbor.id);
      }
    }
  }

  // Fallback direct segment if graph traversal misses
  return {
    path: [startNode, endNode],
    totalDistanceMeters: Math.round(heuristic(startNode, endNode) * 100000),
    estimatedMinutes: 5,
    steps: [startNode.name, "Concourse", endNode.name],
    routeType,
  };
}

function heuristic(a: StadiumNode, b: StadiumNode): number {
  const dLng = (a.lng - b.lng) * 111000 * Math.cos((a.lat * Math.PI) / 180);
  const dLat = (a.lat - b.lat) * 111000;
  const dAlt = a.elevation - b.elevation;
  return Math.sqrt(dLng * dLng + dLat * dLat + dAlt * dAlt);
}

// Find nearest exit from a given start node
export function findNearestExit(fromNodeId: string): RouteResult | null {
  const exitNodes = Object.values(STADIUM_NODES).filter((n) => n.category === "EXIT");
  let bestRoute: RouteResult | null = null;

  for (const exit of exitNodes) {
    const route = findSpatialRoute(fromNodeId, exit.id, "EVACUATION");
    if (route && (!bestRoute || route.totalDistanceMeters < bestRoute.totalDistanceMeters)) {
      bestRoute = route;
    }
  }

  return bestRoute;
}
