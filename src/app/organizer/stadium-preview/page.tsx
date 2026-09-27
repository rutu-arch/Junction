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
          [DEV PREVIEW] INITIALIZING HOLOJI DIGITAL TWIN...
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          Development-only inspection surface
        </div>
      </div>
    ),
  }
);

export default function StadiumPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <div style={{ padding: 40, color: "white", background: "#080c14", minHeight: "100vh" }}>
        <h2>404 — Not Found</h2>
        <p>This inspection door is disabled in production environments.</p>
      </div>
    );
  }

  return <HoloJiStadiumTwin />;
}
