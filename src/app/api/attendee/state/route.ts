// ============================================================
// JUNCTION - Attendee-Safe Unified State API
// Clean, sanitized endpoint for mobile & attendee clients.
// Does NOT expose organizer-only telemetry, raw CV feeds, or HoloJi internals.
// ============================================================

import { NextResponse } from "next/server";
import { MOCK_EVENT } from "@/data/mockEvent";
import { SCENARIOS } from "@/data/mockScenarios";
import { ScenarioId } from "@/types";
import { getHotels, getRestaurants, getAlerts } from "@/services/mockDataService";
import { getAttendeeRoutes } from "@/data/mockRoutes";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  try {
    const activeScenarioId: ScenarioId = "NORMAL" as ScenarioId;
    const isRec1Approved: boolean = false;

    // Build attendee-facing advisory message
    let advisoryMessage = "Normal matchday flow. All corridors operating smoothly.";
    if (activeScenarioId === ("POST_EVENT_SURGE" as ScenarioId)) {
      advisoryMessage = "Post-match exit surge active: Churchgate at heavy crowd pressure. Dadar route recommended with dedicated shuttle connection.";
    } else if (activeScenarioId === ("TRANSPORT_DISRUPTION" as ScenarioId)) {
      advisoryMessage = "Western Railway disruption reported. Dadar or CSMT alternate corridors active.";
    } else if (activeScenarioId === ("HEAVY_RAIN" as ScenarioId)) {
      advisoryMessage = "Heavy monsoon rainfall detected. Covered concourses and express shuttles active.";
    } else if (activeScenarioId === ("EVENT_DELAY" as ScenarioId)) {
      advisoryMessage = "Match start delayed by +30m. Entry gates remain open for relaxed arrival.";
    } else if (isRec1Approved) {
      advisoryMessage = "Organizer recommendation active: Visitors redirected toward Dadar to reduce Churchgate choke point.";
    }

    // 2. Format sanitized attendee event
    const event = {
      id: MOCK_EVENT.id,
      name: MOCK_EVENT.name,
      venue: `${MOCK_EVENT.venue}, ${MOCK_EVENT.city}`,
      city: MOCK_EVENT.city,
      date: "Today",
      startTime: MOCK_EVENT.startTime,
      endTime: MOCK_EVENT.endTime,
      status: MOCK_EVENT.status,
      expectedAttendance: MOCK_EVENT.expectedAttendance,
      totalCapacity: MOCK_EVENT.expectedAttendance,
      allocatedGate: "Gate 3 (South)",
    };

    // 3. Format sanitized routes
    const routes = getAttendeeRoutes(activeScenarioId, isRec1Approved);

    // 4. Format sanitized hotels & restaurants
    const hotels = getHotels(activeScenarioId);
    const restaurants = getRestaurants(activeScenarioId);
    const alerts = getAlerts(activeScenarioId);

    // 5. Format public venue information
    const venue = {
      name: "Wankhede Stadium",
      address: "Vinoo Mankad Rd, Churchgate, Mumbai, Maharashtra 400020",
      coordinates: { lat: 18.9389, lng: 72.8258 },
      gates: [
        { id: "G1", name: "Gate 1", stand: "North Stand / Sunil Gavaskar Stand", recommendedTransit: "Marine Lines Station" },
        { id: "G2", name: "Gate 2", stand: "East Stand / Sachin Tendulkar Stand", recommendedTransit: "Churchgate Station (East)" },
        { id: "G3", name: "Gate 3", stand: "South Stand / Pavilion Club", recommendedTransit: "Churchgate Station (South Walkway)" },
        { id: "G4", name: "Gate 4", stand: "West Stand / Vijay Merchant Stand", recommendedTransit: "Marine Drive Promenade" },
      ],
      entryAdvisory: "Gates open 3 hours prior to match start. Carry digital mobile pass. Strict no-bag policy in General Stands.",
    };

    return NextResponse.json(
      {
        success: true,
        version: 1,
        timestamp: new Date().toISOString(),
        event,
        scenario: {
          id: activeScenarioId,
          name: SCENARIOS[activeScenarioId]?.label || "Normal Operations",
          badge: activeScenarioId,
          isRec1Approved,
          advisoryMessage,
        },
        routes,
        hotels,
        restaurants,
        alerts,
        venue,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load attendee state" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
