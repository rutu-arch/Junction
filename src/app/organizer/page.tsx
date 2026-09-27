"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/state/AppContext";
import { Resource, ZoneState } from "@/types";
import { CCTV_FEEDS } from "@/data/cctvFeeds";
import DestinationMap from "@/components/organizer/DestinationMap";
import ResourcePanel from "@/components/organizer/ResourcePanel";
import ActionDrawer from "@/components/organizer/ActionDrawer";
import ZoneDrawer from "@/components/organizer/ZoneDrawer";
import SimulationDrawer from "@/components/organizer/SimulationDrawer";
import { Zap, Video, ChevronDown } from "lucide-react";
import { getPressureColor, getPressureLabel } from "@/components/ui/PressureIndicator";
import styles from "./dashboard.module.css";

// Feeds to show in the visual verification strip (zone-first, prioritise active gates)
const VERIFICATION_FEED_IDS = ["FEED_CCTV_01", "FEED_CCTV_02", "FEED_CCTV_03", "FEED_CCTV_08"];

export default function OrganizerDashboard() {
  const {
    activeScenario,
    recommendations,
    resources,
    redistributionApplied,
    redistributionImpact,
    zones,
    approveRecommendation,
    rejectRecommendation,
    isRecommendationApproved,
    weatherState,
    weatherImpact,
  } = useApp();

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneState | null>(null);
  const [showActionDrawer, setShowActionDrawer] = useState<boolean>(false);
  const [showSimulationDrawer, setShowSimulationDrawer] = useState<boolean>(false);

  // ── Zone state helpers ─────────────────────────────────────────────────────

  const sortedZones = useMemo(
    () => [...zones].sort((a, b) => b.pressure - a.pressure),
    [zones]
  );

  // Primary zone = highest pressure overall
  const primaryZone = sortedZones[0] || zones[0];

  // Gate sub-zones — derived from registry, not hardcoded
  const gate1Zone = zones.find(z => z.id === "ZONE_WANKHEDE_GATE_1");
  const gate2Zone = zones.find(z => z.id === "ZONE_WANKHEDE_GATE_2");

  // If either gate is the active hotspot, surface the more specific label
  const activeGate = useMemo(() => {
    if (!gate1Zone && !gate2Zone) return null;
    if (gate1Zone && gate2Zone) {
      return gate1Zone.pressure >= gate2Zone.pressure ? gate1Zone : gate2Zone;
    }
    return gate1Zone ?? gate2Zone;
  }, [gate1Zone, gate2Zone]);

  const heroZone = useMemo(() => {
    // If the primary zone IS one of the gate zones, use the more specific one
    if (primaryZone?.id === "ZONE_WANKHEDE_GATE_1" || primaryZone?.id === "ZONE_WANKHEDE_GATE_2") {
      return primaryZone;
    }
    // If Wankhede parent is primary, surface the highest-pressure gate instead
    if (primaryZone?.id === "ZONE_WANKHEDE" && activeGate) {
      return activeGate;
    }
    return primaryZone;
  }, [primaryZone, activeGate]);

  // Human-readable location hierarchy for hero
  const heroLocationLine = useMemo(() => {
    if (!heroZone) return "JUNCTION MONITORING ACTIVE";
    if (heroZone.id === "ZONE_WANKHEDE_GATE_1") return "WANKHEDE STADIUM — EXIT GATE 1";
    if (heroZone.id === "ZONE_WANKHEDE_GATE_2") return "WANKHEDE STADIUM — EXIT GATE 2";
    return heroZone.name.toUpperCase();
  }, [heroZone]);

  const heroStatusWord = heroZone?.pressure ?? 0;
  const heroStatusLabel = heroStatusWord >= 90 ? "CRITICAL" : heroStatusWord >= 85 ? "CRITICAL" : heroStatusWord >= 70 ? "RISING" : "ELEVATED";
  const heroColor = heroStatusWord >= 85 ? "var(--red)" : heroStatusWord >= 70 ? "var(--orange)" : "var(--yellow-state)";

  // Recommendation
  const topRec = useMemo(
    () => recommendations.find(r => r.status === "PENDING") || recommendations[0],
    [recommendations]
  );
  const isTopRecApproved = isRecommendationApproved(topRec?.id || "");

  // Churchgate capacity for hero metric
  const churchgateRes = resources.find(r => r.id === "CHURCHGATE");

  // Scenario label
  const scenarioLabel =
    activeScenario === "POST_EVENT_SURGE" ? "POST-EVENT SURGE" :
    activeScenario === "TRANSPORT_DISRUPTION" ? "TRANSIT SIGNAL DISRUPTION" :
    activeScenario === "HEAVY_RAIN" ? "MONSOON WEATHER ADVISORY" :
    "NOMINAL FLOW";

  // Wankhede gate rows (compact)
  const showGateContext = gate1Zone || gate2Zone;

  return (
    <div className={styles.page}>
      {/* ── 1. PRIMARY OPERATIONAL SITUATION HERO (Dominant First-Screen Command Center) ── */}
      <section className={styles.heroSection} aria-label="Operational Command Hero">
        <div className={styles.heroCard}>
          {/* Eyebrow / Context Row */}
          <div className={styles.heroHeader}>
            <div className={styles.heroMetaLeft}>
              <span className={styles.scenarioBadge}>{scenarioLabel}</span>
              <span className={styles.eventContextBadge}>WANKHEDE STADIUM · 33,000 SPECTATORS</span>
            </div>
            {weatherState && (
              <Link
                href="/organizer/simulation?scenario=weather"
                className={styles.weatherTag}
                title="Live Weather Context · Click to test in What-If Simulator"
              >
                <span>🌧️ {weatherState.condition} · {weatherState.temperature}°C · {weatherState.rainfall} mm/h</span>
                <span
                  className={`pill ${weatherState.source === "LIVE" ? "pill-live" : "pill-watch"}`}
                  style={{ fontSize: 8, padding: "1px 5px" }}
                >
                  {weatherState.source}
                </span>
                {weatherImpact?.scenarioActive && (
                  <span className="pill pill-critical" style={{ fontSize: 8, padding: "1px 5px" }}>
                    TWIN: {weatherImpact.severity}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Main Hero Body: Asymmetric Grid */}
          <div className={styles.heroGrid}>
            {/* Left Column: Location, Headline, Intelligence Assessment, Telemetry, and Gate Details */}
            <div className={styles.heroMainCol}>
              <div className={styles.headlineBlock}>
                <span className={styles.locationSupertitle}>{heroLocationLine}</span>
                <h1 className={styles.situationTitle}>
                  PRESSURE IS <span style={{ color: heroColor }}>{heroStatusLabel}</span>
                </h1>
              </div>

              {/* Compact Contextual Intelligence Assessment */}
              <div className={styles.contextBriefing}>
                <div className={styles.contextBriefingHeader}>
                  <span className={styles.contextBriefingTag}>OPERATIONAL ASSESSMENT</span>
                  <span className={styles.contextBriefingMeta}>Egress Surge Telemetry</span>
                </div>
                <p className={styles.contextBriefingText}>
                  High-velocity concourse discharge concentrated at Gate 2 with +{heroZone?.inflowRate ?? 42} pax/min toward Western Railway.
                  Downstream clearance buffer at Churchgate is operating at threshold capacity. Corridor metering active to stabilize egress velocity and redirect flow toward Marine Lines.
                </p>
              </div>

              {/* Three Key Telemetry Metrics */}
              <div className={styles.telemetryRow}>
                <div className={styles.telemetryCard}>
                  <span className={styles.telemetryLabel}>INFLOW VELOCITY</span>
                  <div className={styles.telemetryValue}>
                    +{heroZone?.inflowRate ?? 42} <span className={styles.unit}>pax/min</span>
                  </div>
                  <span className={styles.telemetrySub}>Egress flowing toward Western Railway</span>
                </div>

                <div className={styles.telemetryCard}>
                  <span className={styles.telemetryLabel}>PLATFORM CAPACITY</span>
                  <div className={styles.telemetryValue}>
                    {churchgateRes?.availableCapacity?.toLocaleString() ?? "1,200"} <span className={styles.unit}>remaining</span>
                  </div>
                  <span className={styles.telemetrySub}>Churchgate clearance buffer</span>
                </div>

                <div className={styles.telemetryCard}>
                  <span className={styles.telemetryLabel}>CLEARANCE STATUS</span>
                  <div className={styles.telemetryValue} style={{ color: "var(--red)" }}>
                    High Bottleneck
                  </div>
                  <span className={styles.telemetrySub}>Downstream trains at full capacity</span>
                </div>
              </div>

              {/* Wankhede Gate Split Telemetry */}
              {showGateContext && (
                <div className={styles.gateContextSection}>
                  <span className={styles.gateContextLabel}>GATE CORRIDOR TELEMETRY</span>
                  <div className={styles.gateContextGrid}>
                    {gate1Zone && (
                      <div className={styles.gateCard}>
                        <div className={styles.gateCardTop}>
                          <span className={styles.gateName}>Exit Gate 1</span>
                          <span className={`pill ${gate1Zone.pressure >= 85 ? "pill-critical" : gate1Zone.pressure >= 70 ? "pill-high" : "pill-watch"}`} style={{ fontSize: 9 }}>
                            {getPressureLabel(gate1Zone.pressure)}
                          </span>
                        </div>
                        <span className={styles.gatePressure} style={{ color: getPressureColor(gate1Zone.pressure) }}>
                          {gate1Zone.pressure}%
                        </span>
                      </div>
                    )}
                    {gate2Zone && (
                      <div className={styles.gateCard}>
                        <div className={styles.gateCardTop}>
                          <span className={styles.gateName}>Exit Gate 2</span>
                          <span className={`pill ${gate2Zone.pressure >= 85 ? "pill-critical" : gate2Zone.pressure >= 70 ? "pill-high" : "pill-watch"}`} style={{ fontSize: 9 }}>
                            {getPressureLabel(gate2Zone.pressure)}
                          </span>
                        </div>
                        <span className={styles.gatePressure} style={{ color: getPressureColor(gate2Zone.pressure) }}>
                          {gate2Zone.pressure}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Dominant Pressure Gauge & Forward Trend */}
            <div className={styles.heroGaugeCol}>
              <div className={styles.gaugeBox}>
                <div className={styles.gaugeHeader}>
                  <span className={styles.gaugeTitle}>CURRENT ZONE PRESSURE</span>
                  <span className={`pill ${(heroZone?.pressure ?? 0) >= 85 ? "pill-critical" : "pill-high"}`} style={{ fontSize: 10, padding: "2px 8px" }}>
                    {(heroZone?.pressure ?? 0) >= 85 ? "CRITICAL" : "HIGH LOAD"}
                  </span>
                </div>

                <div className={styles.gaugeNumber} style={{ color: heroColor }}>
                  {heroZone?.pressure ?? "—"}%
                </div>

                <div className={styles.forecastBox}>
                  <span className={styles.forecastLabel}>Forecast +15 min</span>
                  <span className={styles.forecastValue} style={{ color: heroColor }}>
                    {heroZone?.predictedPressure15 ?? "—"}%
                  </span>
                </div>

                <Link href="/organizer/predictions" className={styles.forecastLink}>
                  VIEW FULL FORECAST →
                </Link>
              </div>
            </div>
          </div>

          {/* Closed Loop / Diversion Banner (if active) */}
          {redistributionApplied && redistributionImpact && (
            <div className={styles.closedLoopBanner}>
              <div className={styles.closedLoopTitle}>
                <Zap size={16} color="var(--green)" />
                <span>PROACTIVE DIVERSION ACTIVE — REDISTRIBUTION APPLIED</span>
              </div>
              <div className={styles.closedLoopStats}>
                <div>Churchgate: <strong>{redistributionImpact.churchgateBefore}% → {redistributionImpact.churchgateAfter}%</strong></div>
                <div>Dadar: <strong>{redistributionImpact.dadarBefore}% → {redistributionImpact.dadarAfter}%</strong></div>
                <div>Diverted: <strong>~{redistributionImpact.visitorsRedistributed.toLocaleString()} pax</strong></div>
              </div>
            </div>
          )}

          {/* Action Ready Recommendation Strip */}
          {topRec && (
            <div className={styles.heroActionStrip}>
              <div className={styles.actionLeft}>
                <span className={styles.actionBadge}>ACTION READY</span>
                <div className={styles.actionContent}>
                  <span className={styles.actionHeadline}>{topRec.title}</span>
                  <span className={styles.actionImpact}>
                    Expected Impact: {topRec.expectedImpact[0]?.before}% → {topRec.expectedImpact[0]?.after}% operational relief
                  </span>
                </div>
              </div>
              <div className={styles.actionRight}>
                <button
                  type="button"
                  className="btn btn-yellow"
                  style={{ fontWeight: 800, padding: "10px 22px", fontSize: 12, letterSpacing: "0.02em" }}
                  onClick={() => setShowActionDrawer(true)}
                >
                  {isTopRecApproved ? "✓ APPROVED" : "REVIEW ACTION →"}
                </button>
                <Link
                  href="/organizer/simulation"
                  className={styles.actionSimLink}
                >
                  Test in Simulator →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Scroll Invitation */}
        <div className={styles.scrollInvitation}>
          <span>Scroll down for Spatial Command Map &amp; CCTV Feeds</span>
          <ChevronDown size={14} className={styles.scrollIcon} />
        </div>
      </section>

      {/* ── 2. SPATIAL COMMAND MAP (Visible After Scroll) ── */}
      <section className={styles.spatialSection} aria-label="Spatial Monitor">
        <div className={styles.spatialHud}>
          <div className={styles.hudLeft}>
            <span className={styles.hudTitle}>SPATIAL MONITOR — WHERE THIS IS HAPPENING</span>
            <span className={styles.hudBadge}>{zones.length} MONITORED ZONES</span>
          </div>
          <button
            type="button"
            className={styles.hudBtn}
            onClick={() => setSelectedZone(heroZone ?? null)}
          >
            INSPECT {heroZone?.name?.split("—")[0]?.trim() ?? "ZONE"} →
          </button>
        </div>

        {/* LOCKED MAP COMPONENT — DO NOT TOUCH */}
        <div className={styles.mapCanvas}>
          <DestinationMap
            resources={resources}
            onSelectResource={r => setSelectedResource(r)}
            selectedId={selectedResource?.id ?? null}
          />
        </div>
      </section>

      {/* ── 3. LIVE SIGNAL HEALTH (Further Down) ── */}
      <section className={styles.signalSection} aria-label="Live Signal Health">
        <div className={styles.signalHeader}>
          <span className={styles.signalTitle}>LIVE SIGNALS</span>
          <Link href="/organizer/cctv-demo" className={styles.signalViewAllLink}>
            <Video size={12} />
            VIEW ALL SIGNALS →
          </Link>
        </div>
        <div className={styles.signalRows}>
          <div className={styles.signalRow}>
            <span className={styles.signalName}>CCTV Computer Vision</span>
            <span className={styles.signalValue}>9 Feeds</span>
            <span className={styles.signalStatus}><span className={styles.signalDot} />ONLINE</span>
          </div>
          <div className={styles.signalRow}>
            <span className={styles.signalName}>Western &amp; Central Rail</span>
            <span className={styles.signalValue}>4.2 min Headway</span>
            <span className={styles.signalStatus}><span className={styles.signalDot} />ONLINE</span>
          </div>
          <div className={styles.signalRow}>
            <span className={styles.signalName}>Road Corridor Sensors</span>
            <span className={styles.signalValue}>18 km/h</span>
            <span className={styles.signalStatus}><span className={styles.signalDot} />ONLINE</span>
          </div>
          <div className={styles.signalRow}>
            <span className={styles.signalName}>Hospitality &amp; Staging</span>
            <span className={styles.signalValue}>1,240 Usable</span>
            <span className={styles.signalStatus}><span className={styles.signalDot} />ONLINE</span>
          </div>
          <div className={styles.signalRow}>
            <span className={styles.signalName}>Live Meteorological Feed</span>
            <span className={styles.signalValue}>
              {weatherState ? `${weatherState.condition} · ${weatherState.temperature}°C` : "29°C · 0.0 mm/h"}
            </span>
            <span className={styles.signalStatus}>
              <span
                className={styles.signalDot}
                style={{ background: weatherState?.source === "LIVE" ? "var(--green)" : "var(--yellow)" }}
              />
              {weatherState?.source === "LIVE" ? "ONLINE" : "CACHED"}
            </span>
          </div>
        </div>
      </section>

      {/* ── 4. VISUAL VERIFICATION (Further Down) ── */}
      <section className={styles.verificationSection} aria-label="Visual Verification CCTV">
        <div className={styles.verificationHeader}>
          <span className={styles.verificationTitle}>VISUAL VERIFICATION</span>
          <Link href="/organizer/cctv-demo" className={styles.verificationOpenLink}>
            OPEN CCTV &amp; SENSOR INPUTS →
          </Link>
        </div>
        <div className={styles.verificationGrid}>
          {VERIFICATION_FEED_IDS.map(feedId => {
            const feed = CCTV_FEEDS.find(f => f.id === feedId);
            if (!feed) return null;
            const zoneLabel = feed.operationalZoneGroup && feed.subZoneName
              ? `${feed.operationalZoneGroup} · ${feed.subZoneName}`
              : feed.zoneName;
            return (
              <div key={feed.id} className={styles.verificationTile}>
                <div className={styles.verificationTileHeader}>
                  <span className={styles.verificationZoneName}>{zoneLabel}</span>
                  <span className={styles.verificationCamId}>{feed.cameraId}</span>
                </div>
                <div className={styles.verificationVideoWrapper}>
                  <video
                    src={feed.videoSrc}
                    muted
                    autoPlay
                    loop
                    playsInline
                    preload="metadata"
                    className={styles.verificationVideo}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── OVERLAYS & DRAWERS ── */}
      {selectedResource && (
        <div className={styles.resourceModalOverlay} onClick={() => setSelectedResource(null)}>
          <div className={styles.resourceModalBox} onClick={e => e.stopPropagation()}>
            <ResourcePanel
              resource={selectedResource}
              scenario={activeScenario}
              onClose={() => setSelectedResource(null)}
            />
          </div>
        </div>
      )}

      <ActionDrawer
        isOpen={showActionDrawer}
        recommendation={topRec}
        onClose={() => setShowActionDrawer(false)}
        onApprove={approveRecommendation}
        onReject={rejectRecommendation}
        isApproved={isTopRecApproved}
        onOpenSimulation={() => setShowSimulationDrawer(true)}
      />

      <ZoneDrawer
        isOpen={selectedZone !== null}
        zone={selectedZone}
        onClose={() => setSelectedZone(null)}
      />

      <SimulationDrawer
        isOpen={showSimulationDrawer}
        onClose={() => setShowSimulationDrawer(false)}
      />
    </div>
  );
}
