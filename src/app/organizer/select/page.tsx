"use client";

import React from "react";
import Link from "next/link";
import styles from "./select.module.css";

export default function ScopeSelectionPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brandTag}>
          <span style={{ width: 8, height: 8, background: "#F5C400", borderRadius: 1, display: "inline-block", flexShrink: 0 }} />
          JUNCTION
        </div>
        <h1 className={styles.title}>CHOOSE YOUR OPERATIONS VIEW</h1>
        <p className={styles.subtitle}>
          Select the operational layer you want to manage.
        </p>
      </header>

      <div className={styles.cardGrid}>
        {/* INTERNAL CARD: STADIUM OPERATIONS */}
        <Link href="/organizer/stadium" className={`${styles.card} ${styles.internalCard}`}>
          <div>
            <div className={styles.badgeRow}>
              <span className={`${styles.scopeBadge} ${styles.internalBadge}`}>INTERNAL</span>
              <span className={`${styles.techTag} ${styles.internalTechTag}`}>HoloJi</span>
            </div>
            <h2 className={styles.cardTitle}>STADIUM OPERATIONS</h2>
            <p className={styles.cardDesc}>
              Manage crowd conditions and operations inside the stadium.
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <span className={styles.internalBullet}>•</span> Crowd occupancy
              </li>
              <li className={styles.featureItem}>
                <span className={styles.internalBullet}>•</span> Stand &amp; gate pressure
              </li>
              <li className={styles.featureItem}>
                <span className={styles.internalBullet}>•</span> Internal queues
              </li>
              <li className={styles.featureItem}>
                <span className={styles.internalBullet}>•</span> Crowd flow
              </li>
              <li className={styles.featureItem}>
                <span className={styles.internalBullet}>•</span> Stadium recommendations
              </li>
            </ul>
          </div>
          <div className={`${styles.cardCta} ${styles.internalCta}`}>
            <span>ENTER STADIUM OPS</span>
            <span>→</span>
          </div>
        </Link>

        {/* EXTERNAL CARD: EVENT OPERATIONS */}
        <Link href="/organizer" className={`${styles.card} ${styles.externalCard}`}>
          <div>
            <div className={styles.badgeRow}>
              <span className={`${styles.scopeBadge} ${styles.externalBadge}`}>EXTERNAL</span>
              <span className={`${styles.techTag} ${styles.externalTechTag}`}>JUNCTION</span>
            </div>
            <h2 className={styles.cardTitle}>EVENT OPERATIONS</h2>
            <p className={styles.cardDesc}>
              Manage the wider event ecosystem around the stadium.
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <span className={styles.externalBullet}>•</span> City &amp; transit
              </li>
              <li className={styles.featureItem}>
                <span className={styles.externalBullet}>•</span> Roads
              </li>
              <li className={styles.featureItem}>
                <span className={styles.externalBullet}>•</span> Transport
              </li>
              <li className={styles.featureItem}>
                <span className={styles.externalBullet}>•</span> Accommodation
              </li>
              <li className={styles.featureItem}>
                <span className={styles.externalBullet}>•</span> Restaurants &amp; venues
              </li>
            </ul>
          </div>
          <div className={`${styles.cardCta} ${styles.externalCta}`}>
            <span>ENTER EVENT OPS</span>
            <span>→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
