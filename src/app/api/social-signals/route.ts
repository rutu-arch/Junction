// ============================================================
// JUNCTION - Social & Public Signals API Endpoint
// HackCelestial 3.0 Midnight Task 1: Weather Digital Twin Layer
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { socialSignalAdapter } from "@/services/socialSignalAdapter";

export async function GET(req: NextRequest) {
  try {
    const feed = await socialSignalAdapter.getPublicSignals();

    return NextResponse.json(
      {
        success: true,
        ...feed,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[API /api/social-signals] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Failed to retrieve public signals",
        signals: [],
        isLive: false,
        sourceStatus: "UNAVAILABLE",
      },
      { status: 500 }
    );
  }
}
