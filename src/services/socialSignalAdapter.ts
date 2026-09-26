// ============================================================
// JUNCTION - Social & Public Signal Adapter
// HackCelestial 3.0 Midnight Task 1: Weather Digital Twin Layer
// ============================================================

import { SocialSignal, SocialSignalType, SocialSignalSeverity } from "@/types/weather";

export interface PublicSignalFeedResult {
  signals: SocialSignal[];
  isLive: boolean;
  sourceStatus: "LIVE" | "DEGRADED" | "UNAVAILABLE";
  providerName: string;
  lastUpdated: string;
}

/**
 * Reference Civic Advisories representing Mumbai MCGM / Mumbai Traffic Police protocols
 * Used ONLY when live network syndication is unreachable, explicitly tagged isLive: false.
 */
const CIVIC_REFERENCE_SIGNALS: SocialSignal[] = [
  {
    id: "SIG_MCGM_01",
    source: "MCGM Disaster Management Cell (Civic Advisory)",
    timestamp: new Date().toISOString(),
    signalType: "WATERLOGGING",
    severity: "HIGH",
    location: "Marine Drive / Maharshi Karve Road Concourse",
    textSummary: "Waterlogging alert on low-lying egress channels. Sump pumps activated along Veer Nariman Rd.",
    isLive: false,
    verified: true,
    relatedZoneId: "ZONE_MARINE_LINES",
  },
  {
    id: "SIG_MTP_02",
    source: "Mumbai Traffic Police (Public Traffic Broadcast)",
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    signalType: "TRAFFIC_DISRUPTION",
    severity: "HIGH",
    location: "Churchgate Station Outer Circle / J.T. Road",
    textSummary: "Heavy vehicular congestion near Churchgate station taxi stand. Diversion advised via Netaji Subhash Chandra Bose Rd.",
    isLive: false,
    verified: true,
    relatedZoneId: "ZONE_CHURCHGATE",
  },
  {
    id: "SIG_RIDE_03",
    source: "Mumbai Commuter Public Signal",
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    signalType: "TAXI_SURGE",
    severity: "CRITICAL",
    location: "Wankhede Stadium Gate 2 Staging Point",
    textSummary: "High wait times for black-and-yellow cabs and rideshare pickups. Egress queues backing up to concourse.",
    isLive: false,
    verified: false,
    relatedZoneId: "ZONE_WANKHEDE_GATE_2",
  },
  {
    id: "SIG_WR_04",
    source: "Western Railway Public Transit Alert",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    signalType: "TRANSIT_DELAY",
    severity: "MODERATE",
    location: "Churchgate - Marine Lines Corridor",
    textSummary: "Suburban trains operating with caution speed (35 km/h) due to track-adjacent pooling. Average 8-12 min delay.",
    isLive: false,
    verified: true,
    relatedZoneId: "ZONE_CHURCHGATE",
  },
  {
    id: "SIG_PED_05",
    source: "Wankhede Crowd Safety Marshall Broadcast",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    signalType: "PEDESTRIAN_SLOWDOWN",
    severity: "MODERATE",
    location: "Wankhede Stadium Exit Gate 1",
    textSummary: "Foot traffic bottlenecked under station underpass due to umbrella deployment and slick stairways.",
    isLive: false,
    verified: true,
    relatedZoneId: "ZONE_WANKHEDE_GATE_1",
  },
];

export class SocialSignalAdapter {
  private static instance: SocialSignalAdapter;

  public static getInstance(): SocialSignalAdapter {
    if (!SocialSignalAdapter.instance) {
      SocialSignalAdapter.instance = new SocialSignalAdapter();
    }
    return SocialSignalAdapter.instance;
  }

  /**
   * Fetches real-world public signals from municipal / civic syndication feeds.
   * If the remote civic endpoint is unreachable or times out, safely falls back
   * to clearly tagged reference civic signals (isLive: false).
   */
  public async getPublicSignals(): Promise<PublicSignalFeedResult> {
    try {
      // Check if custom live civic endpoint is supplied via environment variable
      const customFeedUrl = process.env.PUBLIC_CIVIC_FEED_URL;

      if (customFeedUrl) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(customFeedUrl, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.signals)) {
            return {
              signals: data.signals.map((s: any, idx: number) => ({
                id: s.id || `SIG_LIVE_${idx}`,
                source: s.source || "Public Civic Broadcast",
                timestamp: s.timestamp || new Date().toISOString(),
                signalType: (s.signalType as SocialSignalType) || "CIVIC_ADVISORY",
                severity: (s.severity as SocialSignalSeverity) || "MODERATE",
                location: s.location || "South Mumbai Operational Area",
                textSummary: s.textSummary || s.text || "",
                isLive: true,
                verified: Boolean(s.verified),
                relatedZoneId: s.relatedZoneId,
              })),
              isLive: true,
              sourceStatus: "LIVE",
              providerName: "Live Civic & Public Feed Adapter",
              lastUpdated: new Date().toISOString(),
            };
          }
        }
      }

      // If no custom live feed or feed returned non-200, return clearly flagged offline reference
      return {
        signals: CIVIC_REFERENCE_SIGNALS,
        isLive: false,
        sourceStatus: "DEGRADED",
        providerName: "MCGM & Mumbai Traffic Police Public Advisory Model (Offline Reference)",
        lastUpdated: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("[SocialSignalAdapter] Failed to fetch live public signals:", (err as Error).message);
      return {
        signals: CIVIC_REFERENCE_SIGNALS,
        isLive: false,
        sourceStatus: "UNAVAILABLE",
        providerName: "MCGM Civic Advisory (Fallback Mode)",
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Filter signals pertinent to a given operational zone
   */
  public getSignalsForZone(signals: SocialSignal[], zoneId: string): SocialSignal[] {
    return signals.filter(
      (s) => s.relatedZoneId === zoneId || s.location.toLowerCase().includes(zoneId.toLowerCase().replace("zone_", ""))
    );
  }
}

export const socialSignalAdapter = SocialSignalAdapter.getInstance();
