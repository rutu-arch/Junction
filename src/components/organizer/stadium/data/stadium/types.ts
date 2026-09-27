export type ProvenanceSource = "wayfinding" | "ticketing-demo" | "inferred";
export type ConfidenceLevel = "confirmed" | "approximate" | "assumed";
export type ZoneType = "stand" | "pavilion" | "level" | "gate" | "concourse" | "office";
export type ZoneVisualState = "normal" | "active" | "warning" | "critical" | "selected" | "hovered";

export interface SpatialCalibration {
  center: [number, number, number]; // [x, y, z] in local stadium space
  innerRadius: number; // inner boundary (pitch edge)
  outerRadius: number; // outer boundary (stand rim)
  arcStartDeg: number; // start angle in degrees (0 = +Z North, 90 = +X East, 180 = -Z South, 270 = -X West)
  arcEndDeg: number;   // end angle in degrees
  elevationY: number;  // base Y height
  height: number;      // vertical thickness / tier height
  tiltDeg?: number;    // radial slope angle
}

export interface StadiumLevel {
  id: string;
  name: string;
  shortLabel: string;
  floorIndex: number;
  heightMeters: number;
  source: ProvenanceSource;
  confidence: ConfidenceLevel;
  description: string;
  accessible: boolean;
}

export interface StadiumStand {
  id: string;
  name: string;
  shortLabel: string;
  aliases: string[];
  type: "stand" | "pavilion";
  source: ProvenanceSource;
  confidence: ConfidenceLevel;
  levels: string[]; // references to level ids
  spatial: SpatialCalibration;
  description: string;
  approxCapacity?: number;
  cameraIds?: string[]; // placeholder for future CCTV/YOLO mapping
}

export interface StadiumGate {
  id: string;
  name: string;
  gateCode: string;
  type: "vip" | "players" | "public" | "media";
  levelId: string;
  source: ProvenanceSource;
  confidence: ConfidenceLevel;
  position: [number, number, number];
  accessible: boolean;
  description: string;
}

export interface StadiumConcourse {
  id: string;
  name: string;
  shortLabel: string;
  levelId: string;
  source: ProvenanceSource;
  confidence: ConfidenceLevel;
  position: [number, number, number];
  accessible: boolean;
  description: string;
}

export interface LogicalStadiumModel {
  metadata: {
    name: string;
    city: string;
    coordinates: { lat: number; lng: number };
    totalApproxCapacity: number;
    sources: {
      wayfinding: string;
      ticketingDemo: string;
    };
    coordinateConvention: string;
  };
  levels: StadiumLevel[];
  stands: StadiumStand[];
  gates: StadiumGate[];
  concourses: StadiumConcourse[];
}
