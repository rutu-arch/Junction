// ============================================================
// JUNCTION - Weather Service & Provider
// HackCelestial 3.0 Midnight Task 1: Weather Digital Twin Layer
// ============================================================

import { WeatherState, WeatherForecastPoint } from "@/types/weather";

const WANKHEDE_COORDS = {
  latitude: 18.9388,
  longitude: 72.8258,
  locationName: "Wankhede Stadium / South Mumbai",
};

// 5-minute cache to avoid hammering the external meteorological API
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedWeather {
  data: WeatherState;
  cachedAt: number;
}

let memoryCache: CachedWeather | null = null;

function mapWmoWeatherCode(code: number): string {
  switch (code) {
    case 0:
      return "Clear Sky";
    case 1:
      return "Mainly Clear";
    case 2:
      return "Partly Cloudy";
    case 3:
      return "Overcast";
    case 45:
    case 48:
      return "Foggy / Low Visibility";
    case 51:
    case 53:
    case 55:
      return "Light Drizzle";
    case 61:
      return "Slight Rain";
    case 63:
      return "Moderate Rain";
    case 65:
      return "Heavy Rain";
    case 80:
    case 81:
      return "Rain Showers";
    case 82:
      return "Violent Rain Showers";
    case 95:
      return "Thunderstorm";
    case 96:
    case 99:
      return "Thunderstorm with Hail";
    default:
      return code >= 50 && code < 70 ? "Rain / Precipitation" : "Overcast";
  }
}

export class WeatherService {
  private static instance: WeatherService;

  public static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  /**
   * Fetches current meteorological conditions for the Wankhede / South Mumbai operational envelope.
   * Leverages Open-Meteo as the primary zero-credential provider, with optional WEATHER_API_KEY support.
   */
  public async getLiveWeather(forceRefresh = false): Promise<WeatherState> {
    const now = Date.now();

    // Check memory cache
    if (!forceRefresh && memoryCache && now - memoryCache.cachedAt < CACHE_TTL_MS) {
      return memoryCache.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${WANKHEDE_COORDS.latitude}&longitude=${WANKHEDE_COORDS.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&forecast_hours=6&timezone=Asia%2FKolkata`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "JUNCTION-WeatherTwin/1.0",
        },
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP error: status ${response.status}`);
      }

      const raw = await response.json();
      const current = raw.current;

      if (!current) {
        throw new Error("Malformed weather payload: current block missing");
      }

      // Parse hourly forecast points (next 4-6 hours)
      const forecastPoints: WeatherForecastPoint[] = [];
      if (raw.hourly && Array.isArray(raw.hourly.time)) {
        const count = Math.min(raw.hourly.time.length, 6);
        for (let i = 0; i < count; i++) {
          forecastPoints.push({
            time: raw.hourly.time[i],
            temperature: Math.round(raw.hourly.temperature_2m?.[i] ?? 28),
            rainfall: Number((raw.hourly.precipitation?.[i] ?? 0).toFixed(1)),
            precipitationProbability: Math.round(raw.hourly.precipitation_probability?.[i] ?? 0),
            condition: mapWmoWeatherCode(raw.hourly.weather_code?.[i] ?? 0),
          });
        }
      }

      const weatherCode = Number(current.weather_code ?? 0);
      const condition = mapWmoWeatherCode(weatherCode);
      const temperature = Math.round(current.temperature_2m ?? 29);
      const rainfall = Number((current.precipitation ?? current.rain ?? 0).toFixed(1));
      const humidity = Math.round(current.relative_humidity_2m ?? 70);
      const windSpeed = Math.round(current.wind_speed_10m ?? 12);
      const precipProb = forecastPoints[0]?.precipitationProbability ?? (rainfall > 0 ? 90 : 15);

      const weatherState: WeatherState = {
        temperature,
        rainfall,
        precipitationProbability: precipProb,
        humidity,
        windSpeed,
        condition,
        weatherCode,
        timestamp: current.time ? new Date(current.time).toISOString() : new Date().toISOString(),
        source: "LIVE",
        providerName: "Open-Meteo Meteorological Service",
        locationName: WANKHEDE_COORDS.locationName,
        forecast: forecastPoints,
      };

      memoryCache = {
        data: weatherState,
        cachedAt: now,
      };

      return weatherState;
    } catch (err) {
      console.warn("[WeatherService] Live fetch failed or timed out:", (err as Error).message);

      // Return degraded fallback clearly flagged with source: "DEGRADED" or "UNAVAILABLE"
      const fallbackState: WeatherState = {
        temperature: 29,
        rainfall: 0.0,
        precipitationProbability: 20,
        humidity: 76,
        windSpeed: 14,
        condition: "Partly Cloudy (Fallback)",
        weatherCode: 2,
        timestamp: new Date().toISOString(),
        source: "DEGRADED",
        providerName: "JUNCTION Offline Fallback Model",
        locationName: WANKHEDE_COORDS.locationName,
        forecast: [
          { time: "+1h", temperature: 29, rainfall: 0.0, precipitationProbability: 20, condition: "Partly Cloudy" },
          { time: "+2h", temperature: 28, rainfall: 0.2, precipitationProbability: 35, condition: "Passing Clouds" },
          { time: "+3h", temperature: 28, rainfall: 0.5, precipitationProbability: 45, condition: "Light Overcast" },
        ],
      };

      return fallbackState;
    }
  }

  /**
   * For the What-If Simulator: generates a hypothetical weather state based on operator parameter adjustments
   */
  public createHypotheticalWeather(
    baseline: WeatherState,
    rainfallIntensity: number,
    rainfallDuration: number
  ): WeatherState {
    const isHeavy = rainfallIntensity >= 25;
    const isModerate = rainfallIntensity >= 10 && rainfallIntensity < 25;
    const isLight = rainfallIntensity > 0 && rainfallIntensity < 10;

    let condition = "Clear / Dry";
    let weatherCode = 0;

    if (rainfallIntensity >= 40) {
      condition = "Monsoon Cloudburst / Torrential";
      weatherCode = 82;
    } else if (isHeavy) {
      condition = "Heavy Monsoon Rain";
      weatherCode = 65;
    } else if (isModerate) {
      condition = "Moderate Steady Rain";
      weatherCode = 63;
    } else if (isLight) {
      condition = "Light Intermittent Rain";
      weatherCode = 61;
    }

    return {
      ...baseline,
      rainfall: rainfallIntensity,
      precipitationProbability: rainfallIntensity > 0 ? 100 : baseline.precipitationProbability,
      condition,
      weatherCode,
      humidity: Math.min(100, Math.max(baseline.humidity, rainfallIntensity > 0 ? 92 : baseline.humidity)),
      timestamp: new Date().toISOString(),
      source: "LIVE", // simulated layer based on live baseline
    };
  }
}

export const weatherService = WeatherService.getInstance();
