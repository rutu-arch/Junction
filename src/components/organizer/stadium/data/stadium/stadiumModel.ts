import type { LogicalStadiumModel, StadiumStand, StadiumLevel, StadiumGate, StadiumConcourse } from "./types";
import { STADIUM_LEVELS } from "./levels";
import { STADIUM_STANDS } from "./stands";
import { STADIUM_GATES } from "./gates";
import { STADIUM_CONCOURSES } from "./concourses";

export const WANKHEDE_LOGICAL_MODEL: LogicalStadiumModel = {
  metadata: {
    name: "Wankhede Cricket Stadium",
    city: "Mumbai, Maharashtra, India",
    coordinates: { lat: 18.9389, lng: 72.8258 },
    totalApproxCapacity: 33108,
    sources: {
      wayfinding: "Derived from 4 architectural CAD drawings (Ground Plan, Typical Section, Site Plan, Perimeter Offices).",
      ticketingDemo: "Derived from commercial 3D ticketing demo stand approximations.",
    },
    coordinateConvention: "Local Cartesian: Pitch at Origin (0,0,0). +Z = North (Sachin Tendulkar Stand), +X = East (Sunil Gavaskar Stand), -Z = South (MCA Pavilion), -X = West (Vijay Merchant Stand).",
  },
  levels: STADIUM_LEVELS,
  stands: STADIUM_STANDS,
  gates: STADIUM_GATES,
  concourses: STADIUM_CONCOURSES,
};

export function getStandById(id: string): StadiumStand | undefined {
  return STADIUM_STANDS.find((s) => s.id === id);
}

export function getLevelById(id: string): StadiumLevel | undefined {
  return STADIUM_LEVELS.find((l) => l.id === id);
}

export function getGateById(id: string): StadiumGate | undefined {
  return STADIUM_GATES.find((g) => g.id === id);
}

export function getConcourseById(id: string): StadiumConcourse | undefined {
  return STADIUM_CONCOURSES.find((c) => c.id === id);
}

export * from "./types";
export * from "./levels";
export * from "./stands";
export * from "./gates";
export * from "./concourses";
