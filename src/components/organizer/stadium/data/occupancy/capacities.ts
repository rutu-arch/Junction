import type { ZoneCapacityConfig } from "./types";
import { STADIUM_STANDS } from "../stadium/stands";

/**
 * Configured Capacities for all Logical Stadium Stand/Pavilion Zones.
 * Sourced directly from architectural layout approximations.
 * Non-editable from UI.
 */
export const ZONE_CAPACITIES: Record<string, ZoneCapacityConfig> = {};

// Register Stand & Pavilion Capacities (6 Primary Zones)
STADIUM_STANDS.forEach((stand) => {
  ZONE_CAPACITIES[stand.id] = {
    zoneId: stand.id,
    capacity: stand.approxCapacity || 5000,
    source: stand.source,
    confidence: "approximate",
    notes: `Configured nominal capacity for ${stand.name}. Based on architectural layout estimates.`,
  };
});

export function getZoneCapacityConfig(zoneId: string): ZoneCapacityConfig | undefined {
  return ZONE_CAPACITIES[zoneId];
}

export function getTotalStadiumCapacity(): number {
  return STADIUM_STANDS.reduce((sum, s) => sum + (s.approxCapacity || 0), 0);
}
