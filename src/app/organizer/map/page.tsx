"use client";
import { useRouter } from "next/navigation";
import WankhedeHoloDigitalTwin from "@/components/organizer/map/WankhedeHoloDigitalTwin";

export default function MapPage() {
  const router = useRouter();

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden", background: "#030712" }}>
      <WankhedeHoloDigitalTwin onBackToDashboard={() => router.push("/organizer")} />
    </div>
  );
}
