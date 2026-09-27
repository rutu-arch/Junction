import type {
  ZoneSimulationState,
  GateSimulationState,
  Situation,
  Recommendation,
} from "./types";

/**
 * Deterministic Rule-Based Situation Analyzer & Recommendation Engine.
 *
 * Continuously evaluates simulated gate queues, stand occupancy, throughput,
 * and temporal trends to detect operational anomalies and generate explainable
 * actionable recommendations.
 */
export function analyzeStadiumOperations(
  zones: Record<string, ZoneSimulationState>,
  gates: Record<string, GateSimulationState>,
  activeActions: string[],
  simTimeFormatted: string
): { situations: Situation[]; recommendations: Recommendation[] } {
  const situations: Situation[] = [];
  const recommendations: Recommendation[] = [];

  const gate1 = gates["gate-1"];
  const gate2 = gates["gate-2"];
  const north = zones["north"];

  const hasRedirection = activeActions.includes("REDIRECT_GATE_1_TO_2");

  // =========================================================================
  // RULE 1: North Stand & Gate 01 Bottleneck / Uneven Entry Load
  // =========================================================================
  if (gate1 && gate2 && north) {
    const isGate1High = gate1.pressurePercent >= 72 || gate1.queueLength >= 75;
    const isGate2Low = gate2.pressurePercent <= 58;
    const isNorthHigh = north.occupancyPercent >= 74;
    const isBottleneck = (isGate1High && isGate2Low) || (isGate1High && isNorthHigh);

    if (isBottleneck || hasRedirection) {
      let situationStatus: "ACTIVE" | "RESOLVING" | "RESOLVED" = "ACTIVE";
      let recStatus: "ACTIVE" | "ACKNOWLEDGED" | "APPLIED" | "RESOLVING" | "RESOLVED" = "ACTIVE";

      if (hasRedirection) {
        if (gate1.queueLength <= 45 && gate1.pressurePercent <= 62) {
          situationStatus = "RESOLVED";
          recStatus = "RESOLVED";
        } else {
          situationStatus = "RESOLVING";
          recStatus = "RESOLVING";
        }
      }

      const sitSeverity = (gate1.pressurePercent >= 85 || north.occupancyPercent >= 85) && situationStatus === "ACTIVE"
        ? "CRITICAL"
        : "WARNING";

      situations.push({
        id: "sit-north-gate1",
        code: "UNEVEN_GATE_LOAD_NORTH",
        title: situationStatus === "RESOLVED"
          ? "North Stand Concourse Load Resolved"
          : situationStatus === "RESOLVING"
          ? "North Concourse Inflow Redistribution Active"
          : "North Stand Arrival Surge & Gate 01 Bottleneck",
        severity: situationStatus === "RESOLVED" ? "INFO" : sitSeverity,
        affectedZoneIds: ["north"],
        affectedGateIds: ["gate-1", "gate-2"],
        description: situationStatus === "RESOLVED"
          ? `Gate 01 queue has normalized to ${gate1.queueLength} attendees. North Stand pressure is stable at ${north.occupancyPercent.toFixed(1)}%.`
          : situationStatus === "RESOLVING"
          ? `Operator redirection in progress. Gate 01 queue discharging (${gate1.queueLength} ↓), Gate 02 absorbing flow (${gate2.queueLength}).`
          : `Gate 01 operating at ${gate1.pressurePercent.toFixed(0)}% pressure with queue of ${gate1.queueLength}, feeding North Stand (${north.occupancyPercent.toFixed(1)}% occupied).`,
        detectedAtSimTime: simTimeFormatted,
        status: situationStatus,
      });

      recommendations.push({
        id: "rec-north-gate1",
        situationId: "sit-north-gate1",
        severity: situationStatus === "RESOLVED" ? "INFO" : sitSeverity,
        title: situationStatus === "RESOLVED"
          ? "Concourse Load Stabilized"
          : situationStatus === "RESOLVING"
          ? "Concourse Re-routing In Progress"
          : "Divert Inflow: Gate 01 → Gate 02",
        explanation: situationStatus === "RESOLVED"
          ? `Turnstile load between Gate 01 (${gate1.pressurePercent.toFixed(0)}%) and Gate 02 (${gate2.pressurePercent.toFixed(0)}%) is now balanced.`
          : situationStatus === "RESOLVING"
          ? `Incoming attendees are actively being guided to Gate 02 turnstiles. Gate 01 queue is steadily discharging.`
          : `Gate 01 is at ${gate1.pressurePercent.toFixed(0)}% pressure (Queue: ${gate1.queueLength}), while neighboring Gate 02 operates at only ${gate2.pressurePercent.toFixed(0)}% pressure (Queue: ${gate2.queueLength}). North Stand is at ${north.occupancyPercent.toFixed(1)}% (${north.trend}).`,
        suggestedAction: situationStatus === "RESOLVED"
          ? "Maintain standard matchday turnstile configuration."
          : situationStatus === "RESOLVING"
          ? "Continue dynamic digital signage and steward assistance until Gate 01 queue falls below 35."
          : "Divert 50% of incoming North Stand attendees to Gate 02 via East Concourse.",
        actionKey: "REDIRECT_GATE_1_TO_2",
        affectedZones: ["north", "sunilg"],
        affectedGates: ["gate-1", "gate-2"],
        reasons: [
          `Gate 01 queue (${gate1.queueLength}) is ${gate1.trend.toLowerCase()} (${gate1.inflowRate.toFixed(0)} arrivals/min vs ${gate1.throughputRate.toFixed(0)} throughput)`,
          `Gate 02 has headroom (${gate2.nominalCapacity - gate2.queueLength} queue capacity available)`,
          `North Stand occupancy is ${north.occupancyPercent.toFixed(1)}% (${north.status}) with ${north.trend.toLowerCase()} trend`,
        ],
        confidence: "confirmed",
        timestamp: simTimeFormatted,
        status: recStatus,
      });
    }
  }

  // =========================================================================
  // RULE 2: Generic Critical Zone Saturation Check (e.g. MCA Pavilion)
  // =========================================================================
  for (const [zId, zone] of Object.entries(zones)) {
    if (zId !== "north" && zone.occupancyPercent >= 90) {
      situations.push({
        id: `sit-sat-${zId}`,
        code: "ZONE_SATURATION_CRITICAL",
        title: `${zone.name} Near Maximum Capacity`,
        severity: "CRITICAL",
        affectedZoneIds: [zId],
        affectedGateIds: zone.connectedGateIds,
        description: `${zone.name} has reached ${zone.occupancyPercent.toFixed(1)}% capacity (${zone.peopleCount.toLocaleString()} / ${zone.capacity.toLocaleString()} seats).`,
        detectedAtSimTime: simTimeFormatted,
        status: "ACTIVE",
      });

      recommendations.push({
        id: `rec-sat-${zId}`,
        situationId: `sit-sat-${zId}`,
        severity: "CRITICAL",
        title: `Restrict Entry: ${zone.name}`,
        explanation: `${zone.name} has reached ${zone.occupancyPercent.toFixed(1)}% saturation. Immediate steward access management recommended.`,
        suggestedAction: `Station stewards at entry gates (${zone.connectedGateIds.join(", ")}) to verify ticket allocations.`,
        actionKey: "STANDARD_MONITOR",
        affectedZones: [zId],
        affectedGates: zone.connectedGateIds,
        reasons: [
          `Stand utilization is at critical threshold (${zone.occupancyPercent.toFixed(1)}%)`,
          `Outflow rate is currently low (${zone.outflowRate.toFixed(0)} people/min)`,
        ],
        confidence: "confirmed",
        timestamp: simTimeFormatted,
        status: "ACTIVE",
      });
    }
  }

  return { situations, recommendations };
}
