"use client";

import dynamic from "next/dynamic";

const HoloJiStadiumTwin = dynamic(
  () => import("@/components/organizer/stadium/HoloJiStadiumTwin"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          background: "#080c14",
          color: "#00f0ff",
          fontFamily: "monospace",
          letterSpacing: "0.1em",
        }}
      >
        <div style={{ fontSize: 18, marginBottom: 12 }}>
          INITIALIZING HOLOJI DIGITAL TWIN...
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          Loading 3D stadium geometry &amp; simulation engines
        </div>
      </div>
    ),
  }
);

export default function StadiumPage() {
  return <HoloJiStadiumTwin />;
}
