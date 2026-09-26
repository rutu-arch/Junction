// ============================================================
// JUNCTION - Weather & Social Signal Type Definitions
// HackCelestial 3.0 Midnight Task 1: Weather Digital Twin Layer
// ============================================================

export type WeatherDataSource = "LIVE" | "DEGRADED" | "UNAVAILABLE";

export interface WeatherForecastPoint {
  time: string;
  temperature: number;
  rainfall: number; // mm/h
  precipitationProbability: number; // 0-100%
  condition: string;
}

export interface WeatherState {
  temperature: number; // Celsius
  rainfall: number; // mm in last hour / current rate
  precipitationProbability: number; // 0-100%
  humidity: number; // %
  windSpeed: number; // km/h
  condition: string;
  weatherCode: number;
  timestamp: string; // ISO string
  source: WeatherDataSource;
  providerName: string;
  locationName: string;
  forecast?: WeatherForecastPoint[];
}

export type SocialSignalType =
  | "WATERLOGGING"
  | "TRAFFIC_DISRUPTION"
  | "TAXI_SURGE"
  | "PEDESTRIAN_SLOWDOWN"
  | "TRANSIT_DELAY"
  | "CIVIC_ADVISORY";

export type SocialSignalSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface SocialSignal {
  id: string;
  source: string;
  timestamp: string;
  signalType: SocialSignalType;
  severity: SocialSignalSeverity;
  location: string;
  textSummary: string;
  isLive: boolean;
  verified: boolean;
  relatedZoneId?: string;
}

export interface WeatherTwinParams {
  rainfallIntensity: number; // mm/h (0 to 60)
  rainfallDuration: number; // minutes (15 to 180)
  temperature: number; // Celsius
  windSpeed: number; // km/h
  affectedArea: "WANKHEDE_CORRIDOR" | "SOUTH_MUMBAI_ALL";
}

export interface ZoneWeatherDelta {
  zoneId: string;
  zoneName: string;
  baselinePressure: number;
  weatherAdjustedPressure: number;
  delta: number;
  impactReason: string;
}

export interface RoadWeatherDelta {
  roadId: string;
  roadName: string;
  baselineCongestion: number;
  weatherAdjustedCongestion: number;
  delta: number;
}

export interface WeatherImpactResult {
  scenarioActive: boolean;
  severity: "NORMAL" | "MODERATE" | "HIGH" | "SEVERE";
  walkingSpeedMultiplier: number; // 0.65 to 1.0 (slower in rain)
  roadCongestionMultiplier: number; // 1.0 to 1.5 (higher in rain)
  taxiDemandMultiplier: number; // 1.0 to 1.85 (surge in rain)
  stationWaitTimeMultiplier: number; // 1.0 to 1.45 (platform crowding)
  hospitalityShelterDemandMultiplier: number; // 1.0 to 1.6 (sheltering demand)
  affectedZoneDeltas: Record<string, ZoneWeatherDelta>;
  affectedRoadDeltas: Record<string, RoadWeatherDelta>;
  summary: string;
  propagationPath: string[];
  timestamp: string;
  coefficients: {
    rainToWalkingSpeedFactor: number;
    rainToRoadCongestionFactor: number;
    rainToTaxiDemandFactor: number;
    waterloggingRiskThresholdMm: number;
  };
}
