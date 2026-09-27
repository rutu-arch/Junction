// ============================================================
// JUNCTION - Unified Active Scenario & Single Source of Truth API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { SCENARIOS } from "@/data/mockScenarios";
import { ScenarioId, ZoneState } from "@/types";
import { OPERATIONAL_ZONES, fuseZoneState } from "@/services/zoneRegistry";
import { getResources, getHotels, getRestaurants, getAlerts } from "@/services/mockDataService";
import { MOCK_HOTELS_BASE } from "@/data/mockHotels";
import { recommendationLifecycleEngine } from "@/services/recommendationLifecycleEngine";

import { scenarioStore } from "@/services/scenarioStore";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  const currentActiveScenario = scenarioStore.getActiveScenario();
  const isRec1ApprovedState = scenarioStore.isRec1Approved();
  const scenarioVersion = scenarioStore.getScenarioVersion();

  const resources = getResources(currentActiveScenario);
  const fusedZones: ZoneState[] = OPERATIONAL_ZONES.map((zoneDef) =>
    fuseZoneState(zoneDef, resources, MOCK_HOTELS_BASE, currentActiveScenario)
  );

  const interventions = recommendationLifecycleEngine.generateInterventions(fusedZones);
  const hotels = getHotels(currentActiveScenario);
  const restaurants = getRestaurants(currentActiveScenario);
  const alerts = getAlerts(currentActiveScenario);

  return NextResponse.json(
    {
      success: true,
      activeScenario: currentActiveScenario,
      scenarioVersion,
      isRec1Approved: isRec1ApprovedState,
      scenarioDetails: SCENARIOS[currentActiveScenario],
      zones: fusedZones,
      interventions,
      hotels,
      restaurants,
      alerts,
      availableScenarios: Object.entries(SCENARIOS).map(([id, info]) => ({
        id,
        label: info.label,
        description: info.description,
      })),
      timestamp: new Date().toISOString(),
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (typeof body.isRec1Approved === "boolean") {
      scenarioStore.setRec1Approved(body.isRec1Approved);
      if (!body.isRec1Approved) {
        const { persistenceService } = await import("@/services/persistenceService");
        persistenceService.clearInterventions();
      }
    }

    if (body.scenarioId) {
      const scenarioId = body.scenarioId as ScenarioId;
      if (!SCENARIOS[scenarioId]) {
        return NextResponse.json(
          { success: false, error: `Invalid scenarioId. Must be one of: ${Object.keys(SCENARIOS).join(", ")}` },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      scenarioStore.setActiveScenario(scenarioId);
      const { persistenceService } = await import("@/services/persistenceService");
      persistenceService.clearInterventions();
    }

    const currentActiveScenario = scenarioStore.getActiveScenario();
    const isRec1ApprovedState = scenarioStore.isRec1Approved();
    const scenarioVersion = scenarioStore.getScenarioVersion();

    const resources = getResources(currentActiveScenario);
    const fusedZones: ZoneState[] = OPERATIONAL_ZONES.map((zoneDef) =>
      fuseZoneState(zoneDef, resources, MOCK_HOTELS_BASE, currentActiveScenario)
    );

    return NextResponse.json(
      {
        success: true,
        activeScenario: currentActiveScenario,
        scenarioVersion,
        isRec1Approved: isRec1ApprovedState,
        scenarioDetails: SCENARIOS[currentActiveScenario],
        zones: fusedZones,
        updatedAt: new Date().toISOString(),
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update active scenario" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
