// ============================================================
// JUNCTION - Attendee Action & Closed-Loop Feedback API
// Allows mobile attendee client to signal route choices anonymously
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, routeId, userId, scenarioId } = body;

    // Log the closed-loop attendee choice
    console.log(`[JUNCTION CLOSED LOOP] Action=${action || "SELECT_ROUTE"} Route=${routeId || "UNKNOWN"} User=${userId || "ANONYMOUS"} Scenario=${scenarioId || "NORMAL"}`);

    return NextResponse.json(
      {
        success: true,
        recorded: true,
        timestamp: new Date().toISOString(),
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record attendee feedback" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
