import type { OccupancyThresholds } from "./types";

export const DEFAULT_OCCUPANCY_THRESHOLDS: OccupancyThresholds = {
  lowMax: 49.9,
  normalMax: 74.9,
  highMax: 89.9,
  criticalMin: 90.0,
};

export const STATUS_LABELS: Record<string, { label: string; description: string }> = {
  LOW: { label: "Low Density", description: "Occupancy below 50% capacity. Normal operational flow." },
  NORMAL: { label: "Normal Density", description: "Occupancy between 50% and 74%. Optimal capacity utilization." },
  HIGH: { label: "High Density", description: "Occupancy between 75% and 89%. Elevated crowd concentration." },
  CRITICAL: { label: "Critical Density", description: "Occupancy at or above 90%. Monitoring and queue management required." },
};
