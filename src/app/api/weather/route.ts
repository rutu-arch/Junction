// ============================================================
// JUNCTION - Real-time Weather & Impact API Endpoint
// HackCelestial 3.0 Midnight Task 1: Weather Digital Twin Layer
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { weatherService } from "@/services/weatherService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const refresh = searchParams.get("refresh") === "true";

    const weather = await weatherService.getLiveWeather(refresh);

    return NextResponse.json(
      {
        success: true,
        weather,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("[API /api/weather] Error serving weather:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Failed to retrieve weather",
        weather: {
          temperature: 29,
          rainfall: 0,
          precipitationProbability: 10,
          humidity: 72,
          windSpeed: 12,
          condition: "Unavailable",
          weatherCode: 0,
          timestamp: new Date().toISOString(),
          source: "UNAVAILABLE",
          providerName: "Fallback",
          locationName: "Wankhede Stadium / South Mumbai",
        },
      },
      { status: 500 }
    );
  }
}
