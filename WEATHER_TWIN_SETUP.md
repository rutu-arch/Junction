# JUNCTION — Weather Digital Twin (HackCelestial 3.0 Task 1)

## Architecture Overview
The Weather Digital Twin Layer extends the existing JUNCTION application without breaking or replacing existing services:

```
REAL WORLD WEATHER (Open-Meteo API @ Wankhede [18.9388, 72.8258])
       ↓
WeatherService (/api/weather with 5-minute memory cache & timeout protection)
       ↓
Normalized WeatherState (temperature, rainfall, humidity, wind, condition, source)
       ↓
Weather Impact Model (Physical & behavioral coefficients: walking speed, taxi surge, station concourse)
       +
Existing JUNCTION Zone State & Operational Road Corridors
       +
Social / Public Signals (Civic syndication adapter, MCGM / Traffic Police advisories)
       ↓
Weather-Adjusted Simulation Parameters (Hypothetical twin layer)
       ↓
Existing What-If Simulator (Weather Twin mode + Baseline vs Weather-Adjusted Matrix)
       ↓
Existing MapLibre 3D Vector Map (Zone pressure & corridor congestion deltas)
       ↓
Existing Predictions & Decision Workflow
```

## Environment Configuration
The primary live weather provider is **Open-Meteo**, which requires **no API key** and has no rate-limiting credentials to manage.

Optional environment variables in `.env.local`:
| Variable | Required? | Description | Default / Fallback |
| :--- | :---: | :--- | :--- |
| `WEATHER_API_KEY` | Optional | API key if switching to commercial meteorological provider | Uses Open-Meteo zero-credential API |
| `PUBLIC_CIVIC_FEED_URL` | Optional | HTTPS URL for custom live civic RSS/JSON syndication | Uses MCGM & Traffic Police civic advisory reference model |

## Degradation & Offline Behavior
- If network connection fails or external API times out (4.5s threshold), the weather service returns `source: "DEGRADED"` or `"UNAVAILABLE"`.
- Mock or fallback data is **never falsely labeled as LIVE**.
- Existing JUNCTION operations continue normally without disruption if external APIs are unreachable.

## Preserved Gate Distinction
- **Wankhede Stadium — Exit Gate 1** (`ZONE_WANKHEDE_GATE_1`): North perimeter egress to Marine Drive, coastal wind & spray slowdown.
- **Wankhede Stadium — Exit Gate 2** (`ZONE_WANKHEDE_GATE_2`): South turnstiles to Churchgate subway & Taxi Stand, acute cab-seeking bottleneck.
- Both exit gates maintain their distinct identities across CCTV, zone registry, What-If simulator, and spatial map.
