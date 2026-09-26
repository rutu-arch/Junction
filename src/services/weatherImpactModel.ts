// ============================================================
// JUNCTION - Weather Impact Transformation Model
// HackCelestial 3.0 Midnight Task 1: Weather Digital Twin Layer
// ============================================================

import {
  WeatherTwinParams,
  WeatherImpactResult,
  ZoneWeatherDelta,
  RoadWeatherDelta,
} from "@/types/weather";
import { ZoneState, RoadEdge } from "@/types";

/**
 * Tunable physical and behavioral coefficients for weather impact propagation.
 * Explainable, inspectable, and never hardcoded into UI components.
 */
export const WEATHER_IMPACT_CONFIG = {
  // Pedestrian movement: rainfall reduces walking velocity (slippery surfaces, umbrella clashing)
  WALKING_SPEED_REDUCTION_COEFF: 0.007, // per mm/h of rain (e.g. 35mm -> ~25% reduction)
  MIN_WALKING_SPEED_FACTOR: 0.65, // floor at 65% of normal speed

  // Taxi & rideshare demand: visitors abandon walking to transit and hail cabs/autos
  TAXI_DEMAND_SURGE_COEFF: 0.016, // per mm/h of rain (e.g. 30mm -> +48% demand surge)
  MAX_TAXI_DEMAND_FACTOR: 1.85,

  // Road network vehicular delay: standing water, braking buffer, double-parking for pickups
  ROAD_CONGESTION_COEFF: 0.009, // per mm/h of rain
  MAX_ROAD_CONGESTION_FACTOR: 1.55,

  // Station platform concourse sheltering: crowds linger in dry terminal rather than dispersing
  STATION_SHELTERING_COEFF: 0.0075,
  MAX_STATION_PRESSURE_DELTA: 26,

  // Exit Gate Differentials:
  // Gate 1 (North perimeter / Marine Dr) faces coastal wind resistance and coastal splash
  GATE_1_RAIN_FACTOR: 1.05,
  // Gate 2 (South / Churchgate concourse & Taxi stand) suffers higher convergence from cab seekers
  GATE_2_RAIN_FACTOR: 1.28,

  // Duration escalation: when heavy rain persists past 40 min, micro-pooling and waterlogging intensify
  DURATION_THRESHOLD_MINUTES: 40,
  DURATION_ESCALATION_COEFF: 0.004, // per minute above threshold
};

export class WeatherImpactModel {
  private static instance: WeatherImpactModel;

  public static getInstance(): WeatherImpactModel {
    if (!WeatherImpactModel.instance) {
      WeatherImpactModel.instance = new WeatherImpactModel();
    }
    return WeatherImpactModel.instance;
  }

  /**
   * Calculates the macroscopic spatial and operational impact of weather parameters
   * on the JUNCTION zone network and corridors.
   *
   * Real world weather -> Weather impact -> Zone state -> Existing simulation
   */
  public evaluateImpact(
    params: WeatherTwinParams,
    currentZones: ZoneState[],
    roads?: RoadEdge[]
  ): WeatherImpactResult {
    const rain = Math.max(0, params.rainfallIntensity);
    const duration = Math.max(15, params.rainfallDuration);

    // If rainfall is negligible, return nominal baseline
    if (rain < 1.0) {
      const emptyZoneDeltas: Record<string, ZoneWeatherDelta> = {};
      currentZones.forEach((z) => {
        emptyZoneDeltas[z.id] = {
          zoneId: z.id,
          zoneName: z.name,
          baselinePressure: z.pressure,
          weatherAdjustedPressure: z.pressure,
          delta: 0,
          impactReason: "Nominal dry baseline conditions.",
        };
      });

      return {
        scenarioActive: false,
        severity: "NORMAL",
        walkingSpeedMultiplier: 1.0,
        roadCongestionMultiplier: 1.0,
        taxiDemandMultiplier: 1.0,
        stationWaitTimeMultiplier: 1.0,
        hospitalityShelterDemandMultiplier: 1.0,
        affectedZoneDeltas: emptyZoneDeltas,
        affectedRoadDeltas: {},
        summary: "Clear/dry operational state with nominal egress flow.",
        propagationPath: ["WANKHEDE GATES", "CHURCHGATE", "TAXI STAGING"],
        timestamp: new Date().toISOString(),
        coefficients: {
          rainToWalkingSpeedFactor: WEATHER_IMPACT_CONFIG.WALKING_SPEED_REDUCTION_COEFF,
          rainToRoadCongestionFactor: WEATHER_IMPACT_CONFIG.ROAD_CONGESTION_COEFF,
          rainToTaxiDemandFactor: WEATHER_IMPACT_CONFIG.TAXI_DEMAND_SURGE_COEFF,
          waterloggingRiskThresholdMm: 30,
        },
      };
    }

    // Duration escalation multiplier (longer duration = more pooling)
    let durationMultiplier = 1.0;
    if (duration > WEATHER_IMPACT_CONFIG.DURATION_THRESHOLD_MINUTES) {
      const extraMinutes = duration - WEATHER_IMPACT_CONFIG.DURATION_THRESHOLD_MINUTES;
      durationMultiplier += extraMinutes * WEATHER_IMPACT_CONFIG.DURATION_ESCALATION_COEFF;
    }

    // Effective rain impact index
    const effectiveRainIndex = rain * durationMultiplier;

    // Macro multipliers
    const walkingSpeedMultiplier = Number(
      Math.max(
        WEATHER_IMPACT_CONFIG.MIN_WALKING_SPEED_FACTOR,
        1.0 - effectiveRainIndex * WEATHER_IMPACT_CONFIG.WALKING_SPEED_REDUCTION_COEFF
      ).toFixed(2)
    );

    const roadCongestionMultiplier = Number(
      Math.min(
        WEATHER_IMPACT_CONFIG.MAX_ROAD_CONGESTION_FACTOR,
        1.0 + effectiveRainIndex * WEATHER_IMPACT_CONFIG.ROAD_CONGESTION_COEFF
      ).toFixed(2)
    );

    const taxiDemandMultiplier = Number(
      Math.min(
        WEATHER_IMPACT_CONFIG.MAX_TAXI_DEMAND_FACTOR,
        1.0 + effectiveRainIndex * WEATHER_IMPACT_CONFIG.TAXI_DEMAND_SURGE_COEFF
      ).toFixed(2)
    );

    const stationWaitTimeMultiplier = Number(
      Math.min(1.45, 1.0 + effectiveRainIndex * 0.007).toFixed(2)
    );

    const hospitalityShelterDemandMultiplier = Number(
      Math.min(1.65, 1.0 + effectiveRainIndex * 0.01).toFixed(2)
    );

    // Weather severity classification
    let severity: "NORMAL" | "MODERATE" | "HIGH" | "SEVERE" = "MODERATE";
    if (rain >= 35 || (rain >= 25 && duration >= 60)) {
      severity = "SEVERE";
    } else if (rain >= 20 || (rain >= 15 && duration >= 45)) {
      severity = "HIGH";
    } else if (rain >= 6) {
      severity = "MODERATE";
    } else {
      severity = "NORMAL";
    }

    // Zone-by-zone explainable delta computation
    const affectedZoneDeltas: Record<string, ZoneWeatherDelta> = {};

    currentZones.forEach((zone) => {
      const base = zone.pressure;
      let addedPressure = 0;
      let reason = "";

      switch (zone.id) {
        case "ZONE_WANKHEDE":
          // Stadium perimeter: turnstile delays and slower movement on staircases
          addedPressure = Math.round(effectiveRainIndex * 0.28);
          reason = `Concourse turnstiles slowed by umbrella deployment; egress clearance slowed by ${Math.round((1 - walkingSpeedMultiplier) * 100)}%.`;
          break;

        case "ZONE_WANKHEDE_GATE_1":
          // North Gate: Coastal Marine Drive egress chute
          addedPressure = Math.round(effectiveRainIndex * 0.26 * WEATHER_IMPACT_CONFIG.GATE_1_RAIN_FACTOR);
          reason = `Pedestrian movement to Marine Drive slowed by sea spray and slippery pavement.`;
          break;

        case "ZONE_WANKHEDE_GATE_2":
          // South Gate: Funnels directly to Churchgate subway & Taxi line
          addedPressure = Math.round(effectiveRainIndex * 0.34 * WEATHER_IMPACT_CONFIG.GATE_2_RAIN_FACTOR);
          reason = `High crowd convergence: exiting spectators halt under covered subway entrance; queue conflicts with taxi staging.`;
          break;

        case "ZONE_CHURCHGATE":
          // Churchgate Station: Indoor concourse sheltering + platform wait times
          addedPressure = Math.round(
            Math.min(
              WEATHER_IMPACT_CONFIG.MAX_STATION_PRESSURE_DELTA,
              effectiveRainIndex * WEATHER_IMPACT_CONFIG.STATION_SHELTERING_COEFF * 35
            )
          );
          reason = `Commuters sheltering on dry concourse rather than boarding immediately; Western Railway track speed reduced.`;
          break;

        case "ZONE_TAXI_STAGING":
          // Taxi Zone: Massive surge as spectators refuse to walk in rain
          addedPressure = Math.round(effectiveRainIndex * 0.55);
          reason = `Rideshare and taxi demand surged ${Math.round((taxiDemandMultiplier - 1) * 100)}%; pickup queues spill into roadway.`;
          break;

        case "ZONE_MARINE_LINES":
          // Marine Lines Station: Waterfront promenade empty, crowd moves to station
          addedPressure = Math.round(effectiveRainIndex * 0.22);
          reason = `Waterfront promenade evacuated due to coastal squall; foot traffic diverted into Marine Lines station.`;
          break;

        case "ZONE_CSMT":
          // CSMT: Secondary rail terminal
          addedPressure = Math.round(effectiveRainIndex * 0.14);
          reason = `Moderate sheltering load from Eastern egress stream.`;
          break;

        case "ZONE_DADAR":
          // Dadar: Strategic rail hub
          addedPressure = Math.round(effectiveRainIndex * 0.08);
          reason = `Minor ripple effect from train delay downstream.`;
          break;

        default:
          addedPressure = Math.round(effectiveRainIndex * 0.12);
          reason = `Weather-adjusted operational buffer.`;
          break;
      }

      const weatherAdjustedPressure = Math.min(99, Math.max(10, base + addedPressure));
      const delta = weatherAdjustedPressure - base;

      affectedZoneDeltas[zone.id] = {
        zoneId: zone.id,
        zoneName: zone.name,
        baselinePressure: base,
        weatherAdjustedPressure,
        delta,
        impactReason: reason,
      };
    });

    // Road network congestion adjustments
    const affectedRoadDeltas: Record<string, RoadWeatherDelta> = {
      ROAD_MARINE_DR: {
        roadId: "ROAD_MARINE_DR",
        roadName: "Marine Drive (Netaji Subhash Chandra Bose Rd)",
        baselineCongestion: 54,
        weatherAdjustedCongestion: Math.min(98, Math.round(54 * roadCongestionMultiplier)),
        delta: Math.min(98, Math.round(54 * roadCongestionMultiplier)) - 54,
      },
      ROAD_CHURCHGATE: {
        roadId: "ROAD_CHURCHGATE",
        roadName: "Churchgate Station Outer Circle (J.T. Road)",
        baselineCongestion: 48,
        weatherAdjustedCongestion: Math.min(98, Math.round(48 * (roadCongestionMultiplier + 0.12))),
        delta: Math.min(98, Math.round(48 * (roadCongestionMultiplier + 0.12))) - 48,
      },
    };

    const summary =
      rain >= 25
        ? `Heavy monsoon downpour (${rain} mm/h for ${duration}m) causes acute taxi shortages (+${Math.round(
            (taxiDemandMultiplier - 1) * 100
          )}%), slows walking speeds to ${Math.round(
            walkingSpeedMultiplier * 100
          )}%, and drives concourse sheltering at Churchgate and Gate 2.`
        : `Moderate rainfall (${rain} mm/h) causing pedestrian slowdown (-${Math.round(
            (1 - walkingSpeedMultiplier) * 100
          )}%) and elevated taxi rank queuing.`;

    const propagationPath = [
      "WANKHEDE GATE 1 & 2 (Turnstile Egress Slowdown)",
      "MARINE DRIVE ARTERIAL (Wet Surface Congestion)",
      "CHURCHGATE CONCOURSE (Indoor Sheltering Surge)",
      "TAXI STAGING (Rideshare Deficit & Queue Spillover)",
      "HOSPITALITY / STAGING (Shelter Influx)",
    ];

    return {
      scenarioActive: true,
      severity,
      walkingSpeedMultiplier,
      roadCongestionMultiplier,
      taxiDemandMultiplier,
      stationWaitTimeMultiplier,
      hospitalityShelterDemandMultiplier,
      affectedZoneDeltas,
      affectedRoadDeltas,
      summary,
      propagationPath,
      timestamp: new Date().toISOString(),
      coefficients: {
        rainToWalkingSpeedFactor: WEATHER_IMPACT_CONFIG.WALKING_SPEED_REDUCTION_COEFF,
        rainToRoadCongestionFactor: WEATHER_IMPACT_CONFIG.ROAD_CONGESTION_COEFF,
        rainToTaxiDemandFactor: WEATHER_IMPACT_CONFIG.TAXI_DEMAND_SURGE_COEFF,
        waterloggingRiskThresholdMm: 30,
      },
    };
  }
}

export const weatherImpactModel = WeatherImpactModel.getInstance();
