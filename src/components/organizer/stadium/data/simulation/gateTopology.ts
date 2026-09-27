export interface GateTopologyEntry {
  gateId: string;
  gateCode: string;
  name: string;
  type: "public" | "vip" | "players" | "media";
  nominalThroughput: number; // default people/min processed per gate
  connectedZones: {
    zoneId: string;
    flowWeight: number; // proportion of gate entrants entering this zone (sums to 1.0)
  }[];
}

/**
 * Operational Simulation Gate Topology.
 * Maps physical stadium perimeter turnstile gates to internal stand/pavilion operational zones.
 *
 * NOTE: These relationships represent operational simulation flow mappings
 * and should not be claimed as surveyed access measurements.
 */
export const GATE_TOPOLOGY: Record<string, GateTopologyEntry> = {
  "gate-1": {
    gateId: "gate-1",
    gateCode: "GATE-01",
    name: "Gate 1 (North Stand Public Entry)",
    type: "public",
    nominalThroughput: 38,
    connectedZones: [
      { zoneId: "north", flowWeight: 1.0 },
    ],
  },
  "gate-2": {
    gateId: "gate-2",
    gateCode: "GATE-02",
    name: "Gate 2 (North-East Office Corridor)",
    type: "public",
    nominalThroughput: 32,
    connectedZones: [
      { zoneId: "north", flowWeight: 0.45 },
      { zoneId: "sunilg", flowWeight: 0.55 },
    ],
  },
  "gate-3": {
    gateId: "gate-3",
    gateCode: "GATE-03",
    name: "Gate 3 (East Stand Public Entry)",
    type: "public",
    nominalThroughput: 38,
    connectedZones: [
      { zoneId: "sunilg", flowWeight: 1.0 },
    ],
  },
  "gate-4": {
    gateId: "gate-4",
    gateCode: "GATE-04",
    name: "Gate 4 (South-East Divecha Gate)",
    type: "public",
    nominalThroughput: 28,
    connectedZones: [
      { zoneId: "divecha", flowWeight: 0.80 },
      { zoneId: "sunilg", flowWeight: 0.20 },
    ],
  },
  "gate-5": {
    gateId: "gate-5",
    gateCode: "GATE-05",
    name: "Gate 5 (South-West Garware Gate)",
    type: "public",
    nominalThroughput: 28,
    connectedZones: [
      { zoneId: "garware", flowWeight: 0.80 },
      { zoneId: "vijaym", flowWeight: 0.20 },
    ],
  },
  "gate-6": {
    gateId: "gate-6",
    gateCode: "GATE-06",
    name: "Gate 6 (West Stand Public Entry)",
    type: "public",
    nominalThroughput: 38,
    connectedZones: [
      { zoneId: "vijaym", flowWeight: 1.0 },
    ],
  },
  "gate-7": {
    gateId: "gate-7",
    gateCode: "GATE-07",
    name: "Gate 7 (North-West Concourse Entry)",
    type: "public",
    nominalThroughput: 32,
    connectedZones: [
      { zoneId: "north", flowWeight: 0.50 },
      { zoneId: "vijaym", flowWeight: 0.50 },
    ],
  },
  "vipentry": {
    gateId: "vipentry",
    gateCode: "GATE-VIP",
    name: "VIP Entry Gate",
    type: "vip",
    nominalThroughput: 20,
    connectedZones: [
      { zoneId: "mca", flowWeight: 1.0 },
    ],
  },
  "playersentry": {
    gateId: "playersentry",
    gateCode: "GATE-PLAYERS",
    name: "Players & Officials Entry",
    type: "players",
    nominalThroughput: 15,
    connectedZones: [
      { zoneId: "mca", flowWeight: 1.0 },
    ],
  },
};

/**
 * Returns all connected gates for a given operational stand zone.
 */
export function getConnectedGatesForZone(zoneId: string): string[] {
  const gateIds: string[] = [];
  for (const entry of Object.values(GATE_TOPOLOGY)) {
    if (entry.connectedZones.some((z) => z.zoneId === zoneId)) {
      gateIds.push(entry.gateId);
    }
  }
  return gateIds;
}
