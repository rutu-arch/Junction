"use client";
import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "./attendee.module.css";

const NAV_ITEMS = [
  { href: "/attendee?app=true", label: "Home", icon: "◉" },
  { href: "/attendee/plan", label: "Plan", icon: "◇" },
  { href: "/attendee/stay", label: "Stay", icon: "◈" },
  { href: "/attendee/food", label: "Food", icon: "◆" },
  { href: "/attendee/event", label: "Event", icon: "★" },
];

function BarcodeScannerModal({ onClose }: { onClose: () => void }) {
  const [barcode, setBarcode] = useState("8901234567890");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (barcode.trim()) {
      localStorage.setItem("junction_scanned_barcode", barcode.trim());
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--white)",
          borderRadius: "var(--radius-md)",
          padding: 20,
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>BARCODE SCANNER</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <p style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 16 }}>
          Scan or input ticket barcode numeric value below.
        </p>

        {/* MOCK SCANNER FRAME */}
        <div
          style={{
            background: "var(--ink)",
            borderRadius: "var(--radius-sm)",
            height: 120,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--yellow)",
            marginBottom: 16,
            color: "var(--yellow)",
          }}
        >
          <span style={{ fontSize: 32 }}>📷</span>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", marginTop: 6 }}>
            ALIGN BARCODE INSIDE FRAME
          </span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-faint)", display: "block", marginBottom: 4 }}>
            BARCODE NUMERIC VALUE
          </label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontFamily: "var(--font-display)",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "0.1em",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--neutral)",
            }}
          />
        </div>

        <button
          onClick={handleSave}
          className={`btn ${saved ? "btn-live" : "btn-yellow"}`}
          style={{ width: "100%", padding: 12, fontSize: 12, fontWeight: 800 }}
        >
          {saved ? "BARCODE SAVED ✓" : "SAVE BARCODE NUMERIC VALUE"}
        </button>
      </div>
    </div>
  );
}

function AttendeeLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isApp = searchParams.get("app") === "true";
  const [showScanner, setShowScanner] = useState(false);

  // Public showcase at /attendee when NOT in app mode
  const isShowcase = pathname === "/attendee" && !isApp;

  if (isShowcase) {
    return <div className={styles.showcaseShell}>{children}</div>;
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>JUNCTION</Link>
        <div className={styles.headerRight}>
          <span className="pill pill-live" style={{ fontSize: 10 }}>● LIVE</span>
          <button
            onClick={() => setShowScanner(true)}
            className="btn btn-yellow btn-sm"
            style={{ padding: "4px 8px", fontSize: 11, fontWeight: 800 }}
            title="Scan Ticket Barcode"
          >
            📷 SCAN BARCODE
          </button>
          <Link href="/organizer" className="btn btn-outline btn-sm">Organizer →</Link>
        </div>
      </header>
      <div className={styles.body}>
        <main className={styles.main}>{children}</main>
      </div>
      <nav className={styles.bottomNav}>
        {NAV_ITEMS.map(item => {
          const isActive = item.href.startsWith("/attendee?app=true")
            ? pathname === "/attendee" && isApp
            : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`${styles.navItem} ${isActive ? styles.navActive : ""}`}>
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {showScanner && <BarcodeScannerModal onClose={() => setShowScanner(false)} />}
    </div>
  );
}

export default function AttendeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className={styles.showcaseShell}>{children}</div>}>
      <AttendeeLayoutContent>{children}</AttendeeLayoutContent>
    </Suspense>
  );
}
