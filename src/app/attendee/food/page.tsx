"use client";
import { useState } from "react";
import { useApp } from "@/state/AppContext";
import { getRestaurants } from "@/services/mockDataService";
import { Restaurant } from "@/types";
import styles from "./food.module.css";

function RestaurantImage({ restaurant }: { restaurant: Restaurant }) {
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(true);

  const src = restaurant.imageUrl || restaurant.image;

  if (!src || imgError) {
    return (
      <div className={styles.imageFallback}>
        <span style={{ fontSize: 24 }}>🍽</span>
        <span>{restaurant.name}</span>
      </div>
    );
  }

  return (
    <div className={styles.imageWrapper}>
      {loading && (
        <div
          className={styles.imageFallback}
          style={{ position: "absolute", inset: 0, zIndex: 1 }}
        >
          <span style={{ fontSize: 18 }}>Loading...</span>
        </div>
      )}
      <img
        src={src}
        alt={restaurant.name}
        className={styles.restImage}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          setImgError(true);
          setLoading(false);
        }}
      />
    </div>
  );
}

export default function FoodPage() {
  const { activeScenario } = useApp();
  const restaurants = getRestaurants(activeScenario);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"DISTANCE" | "WAIT">("WAIT");

  const filtered = restaurants.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.cuisine.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "DISTANCE") return a.distanceFromVenue - b.distanceFromVenue;
    if (sortBy === "WAIT") return a.waitTime - b.waitTime;
    return 0;
  });

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Restaurants</h1>

      {/* SEARCH AND FILTERS */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search restaurants..."
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
          {(["WAIT", "DISTANCE"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`btn btn-sm ${sortBy === key ? "btn-yellow" : "btn-outline"}`}
              style={{ fontSize: 11 }}
            >
              {key === "WAIT" ? "Shortest Wait" : "Distance"}
            </button>
          ))}
        </div>
      </div>

      {/* UNIFIED RESTAURANTS LIST */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="text-meta">ALL RESTAURANTS ({sorted.length})</span>
        </div>

        <div className={styles.list}>
          {sorted.map((r) => (
            <div key={r.id} className={styles.card}>
              <RestaurantImage restaurant={r} />

              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.restName}>{r.name}</h3>
                    <span className={styles.restCuisine}>{r.cuisine}</span>
                  </div>
                  <span className={`pill ${r.pressureLevel === "NORMAL" ? "pill-live" : r.pressureLevel === "WATCH" ? "pill-watch" : "pill-high"}`}>
                    {r.pressureLevel}
                  </span>
                </div>

                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>DISTANCE</span>
                    <span className={styles.metaValue}>{r.distanceFromVenue} min</span>
                    <span className={styles.metaSub}>walk/transit</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>WAIT NOW</span>
                    <span
                      className={styles.metaValue}
                      style={{
                        color:
                          r.waitTime > 30 ? "var(--red)" : r.waitTime > 15 ? "var(--orange)" : "var(--green)",
                      }}
                    >
                      {r.waitTime} min
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>PREDICTED</span>
                    <span className={styles.metaValue}>{r.predictedWaitTime} min</span>
                  </div>
                </div>

                {r.hasIncentive && r.incentiveLabel && (
                  <div className={styles.incentive}>
                    <span className={styles.incentiveIcon}>🎟</span>
                    <span>{r.incentiveLabel}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
