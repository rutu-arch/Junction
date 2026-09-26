"use client";
import { useState } from "react";
import { useApp } from "@/state/AppContext";
import { getAttendeeRoutes } from "@/data/mockRoutes";
import { AttendeeRoute } from "@/types";
import styles from "./plan.module.css";

export default function PlanPage() {
  const { activeScenario, isRecommendationApproved, selectAttendeeRoute, attendeeSelectedRouteId } = useApp();
  const rec1Approved = isRecommendationApproved("REC1");
  const routes = getAttendeeRoutes(activeScenario, rec1Approved);

  const [travelMode, setTravelMode] = useState<"ALL" | "TRANSIT" | "DRIVE">("ALL");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [planned, setPlanned] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<AttendeeRoute>(routes[0]);

  const crowdColor = (l: string) =>
    l === "HIGH" ? "var(--red)" : l === "MEDIUM" ? "var(--yellow-state)" : "var(--green)";

  const activeRoute = routes.find((r) => r.id === attendeeSelectedRouteId) || selectedRoute;

  return (
    <div className={styles.page}>
      <h1 className={styles.planTitle}>Plan Your Journey</h1>

      {/* TARGET LAYOUT: CLEAN FORM */}
      <div
        style={{
          background: "var(--white)",
          padding: 20,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--neutral)",
          marginBottom: 16,
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <span className="text-meta" style={{ fontSize: 10, display: "block", marginBottom: 4 }}>
            FROM
          </span>
          <div
            style={{
              padding: "10px 14px",
              background: "var(--paper)",
              borderRadius: "var(--radius-sm)",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Harbour Line Area
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <span className="text-meta" style={{ fontSize: 10, display: "block", marginBottom: 4 }}>
            TO
          </span>
          <div
            style={{
              padding: "10px 14px",
              background: "var(--paper)",
              borderRadius: "var(--radius-sm)",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Wankhede Stadium
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <span className="text-meta" style={{ fontSize: 10, display: "block", marginBottom: 4 }}>
            DATE / TIME
          </span>
          <div
            style={{
              padding: "10px 14px",
              background: "var(--paper)",
              borderRadius: "var(--radius-sm)",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Today · 18:00
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <span className="text-meta" style={{ fontSize: 10, display: "block", marginBottom: 6 }}>
            TRAVEL OPTIONS
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {(["ALL", "TRANSIT", "DRIVE"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTravelMode(mode)}
                className={`btn btn-sm ${travelMode === mode ? "btn-yellow" : "btn-outline"}`}
                style={{ fontSize: 11 }}
              >
                {mode === "ALL" ? "All Modes" : mode === "TRANSIT" ? "Public Transit" : "Drive / Cab"}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn btn-yellow"
          style={{ width: "100%", fontWeight: 800 }}
          onClick={() => setPlanned(true)}
        >
          PLAN JOURNEY
        </button>
      </div>

      {/* COLLAPSIBLE ADVANCED OPTIONS */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: "none",
            border: "none",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ink-muted)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {showAdvanced ? "▲ Hide Advanced Options" : "▼ Advanced Options"}
        </button>

        {showAdvanced && rec1Approved && (
          <div
            className={styles.orgBanner}
            style={{ marginTop: 10, padding: 12, borderRadius: "var(--radius-sm)" }}
          >
            <span className={styles.orgBannerIcon}>◆</span>
            <div>
              <span className={styles.orgBannerTitle}>Organizer Recommendation Active</span>
              <p className={styles.orgBannerMsg}>
                Dadar Station route is recommended due to rising Churchgate pressure.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* JOURNEY RESULT */}
      {planned && (
        <div>
          <span className="text-meta" style={{ marginBottom: 10, display: "block" }}>
            JOURNEY RESULT
          </span>

          <div
            style={{
              background: "var(--white)",
              padding: 20,
              borderRadius: "var(--radius-md)",
              border: "1.5px solid var(--yellow-state)",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 10, color: "var(--ink-muted)", display: "block" }}>FROM</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Harbour Line Area</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 10, color: "var(--ink-muted)", display: "block" }}>TO</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Wankhede Stadium</span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                background: "var(--paper)",
                padding: 12,
                borderRadius: "var(--radius-sm)",
                marginBottom: 14,
              }}
            >
              <div>
                <span style={{ fontSize: 9, color: "var(--ink-muted)", display: "block" }}>EST TIME</span>
                <span style={{ fontSize: 16, fontWeight: 800 }}>{activeRoute.totalTime} min</span>
              </div>
              <div>
                <span style={{ fontSize: 9, color: "var(--ink-muted)", display: "block" }}>DISTANCE</span>
                <span style={{ fontSize: 16, fontWeight: 800 }}>8.2 km</span>
              </div>
              <div>
                <span style={{ fontSize: 9, color: "var(--ink-muted)", display: "block" }}>TRANSPORT</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{activeRoute.label}</span>
              </div>
            </div>

            <button
              className="btn btn-yellow"
              style={{ width: "100%", fontWeight: 800 }}
              onClick={() => selectAttendeeRoute(activeRoute.id)}
            >
              {attendeeSelectedRouteId === activeRoute.id ? "✓ ROUTE ACTIVE" : "VIEW ROUTE"}
            </button>
          </div>

          {/* ROUTE STRATEGIES SELECTOR */}
          <span className="text-meta" style={{ marginBottom: 10, display: "block" }}>
            AVAILABLE ROUTE OPTIONS
          </span>
          <div className={styles.routeOptions}>
            {routes.map((r) => (
              <div
                key={r.id}
                className={`${styles.routeCard} ${
                  r.id === activeRoute.id ? styles.routeSelected : ""
                }`}
                onClick={() => {
                  setSelectedRoute(r);
                  selectAttendeeRoute(r.id);
                }}
              >
                <div className={styles.routeCardHeader}>
                  <span className="pill pill-yellow">{r.label}</span>
                  <span className={styles.routeTime}>{r.totalTime} min</span>
                </div>
                <div className={styles.routeCardMeta} style={{ marginTop: 8 }}>
                  <span style={{ color: crowdColor(r.crowdLevel), fontSize: 12, fontWeight: 700 }}>
                    {r.crowdLevel} Crowd
                  </span>
                  <span>·</span>
                  <span>{r.transfers} transfers</span>
                  <span>·</span>
                  <span>{r.walkingTime} min walk</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
