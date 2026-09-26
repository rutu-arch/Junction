"use client";
import { MOCK_EVENT } from "@/data/mockEvent";
import { useApp } from "@/state/AppContext";
import styles from "./event.module.css";

export default function AttendeeEventPage() {
  const { activeScenario } = useApp();
  const isDelay = activeScenario === "EVENT_DELAY";
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Event Info</h1>

      <div className={styles.card}>
        <div className={styles.cardTop}>
          <span className="pill pill-live">● LIVE</span>
          {isDelay && <span className="pill pill-high">DELAYED +30 MIN</span>}
        </div>
        <h2 className={styles.eventName}>{MOCK_EVENT.name}</h2>
        <span className={styles.eventVenue}>{MOCK_EVENT.venue}</span>
        <div className={styles.times}>
          <div className={styles.timeItem}>
            <span className={styles.timeLabel}>GATE OPEN</span>
            <span className={styles.timeVal}>{isDelay ? "19:30" : "18:00"}</span>
          </div>
          <div className={styles.timeItem}>
            <span className={styles.timeLabel}>MATCH START</span>
            <span className={styles.timeVal}>{isDelay ? "20:00" : "19:30"}</span>
          </div>
          <div className={styles.timeItem}>
            <span className={styles.timeLabel}>EST END</span>
            <span className={styles.timeVal}>{isDelay ? "23:00" : "22:30"}</span>
          </div>
        </div>
      </div>

      <div className={styles.gates}>
        <span className="text-meta">Your Gate</span>
        <div className={styles.gateHighlight}>Gate 3 (South) — Your allocated entry</div>
        <p className={styles.gateNote}>
          Arrive at least 30 minutes before match time. Expect security queue at peak times.
        </p>
      </div>

      {/* COMPACT EMERGENCY CONTACT SECTION */}
      <div
        style={{
          background: "var(--white)",
          padding: 16,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--neutral)",
          marginTop: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>
            EMERGENCY CONTACT
          </span>
          <span style={{ color: "var(--red)", fontWeight: "bold" }}>📞</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 12 }}>
          Need immediate assistance?
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Security / Emergency</div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>112</div>
            </div>
            <a href="tel:112" className="btn btn-yellow btn-sm" style={{ padding: "4px 12px" }}>
              Call
            </a>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Medical Assistance</div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>102</div>
            </div>
            <a href="tel:102" className="btn btn-yellow btn-sm" style={{ padding: "4px 12px" }}>
              Call
            </a>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Event Help Desk</div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>+91 22 2279 5500</div>
            </div>
            <a href="tel:+912222795500" className="btn btn-yellow btn-sm" style={{ padding: "4px 12px" }}>
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
