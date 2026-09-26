"use client";
import { useState } from "react";
import { useApp } from "@/state/AppContext";
import styles from "./stay.module.css";

export default function StayPage() {
  const { hotels } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"DISTANCE" | "PRESSURE" | "PRICE">("DISTANCE");

  const filteredHotels = hotels.filter((h) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      h.zone.toLowerCase().includes(q)
    );
  });

  const sortedHotels = [...filteredHotels].sort((a, b) => {
    if (sortBy === "DISTANCE") return a.travelTimeToVenue - b.travelTimeToVenue;
    if (sortBy === "PRESSURE") return a.pressure - b.pressure;
    if (sortBy === "PRICE") return (a.priceRange || "").localeCompare(b.priceRange || "");
    return 0;
  });

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Hotels</h1>

      {/* SEARCH AND FILTERS */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search hotels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--neutral)",
            marginBottom: 10,
            fontSize: 14,
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          {(["DISTANCE", "PRESSURE", "PRICE"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`btn btn-sm ${sortBy === key ? "btn-yellow" : "btn-outline"}`}
              style={{ fontSize: 11 }}
            >
              {key === "DISTANCE" ? "Closest to Venue" : key === "PRESSURE" ? "Lowest Pressure" : "Price"}
            </button>
          ))}
        </div>
      </div>

      {/* UNIFIED HOTEL LIST */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="text-meta">ALL HOTELS ({sortedHotels.length})</span>
        </div>

        <div className={styles.hotelList}>
          {sortedHotels.map((h) => (
            <div key={h.id} className={styles.hotelCard}>
              <div className={styles.hotelHeader}>
                <div>
                  <h3 className={styles.hotelName}>{h.name}</h3>
                  <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>{h.zone.replace("_", " ")}</span>
                </div>
                <span className={`pill ${h.pressureLevel === "NORMAL" ? "pill-live" : h.pressureLevel === "WATCH" ? "pill-watch" : "pill-high"}`}>
                  {h.pressureLevel}
                </span>
              </div>

              <div className={styles.hotelMeta} style={{ marginTop: 10 }}>
                <div className={styles.metaGroup}>
                  <span className={styles.metaLabel}>DISTANCE</span>
                  <span className={styles.metaValue}>{h.travelTimeToVenue} min</span>
                  <span className={styles.metaSub}>to venue</span>
                </div>
                <div className={styles.metaGroup}>
                  <span className={styles.metaLabel}>PRICE</span>
                  <span className={styles.metaValue} style={{ fontSize: 13 }}>{h.priceRange || "Standard"}</span>
                </div>
                <div className={styles.metaGroup}>
                  <span className={styles.metaLabel}>CAPACITY</span>
                  <span className={styles.metaValue}>{h.usableRooms}</span>
                  <span className={styles.metaSub}>usable rooms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
