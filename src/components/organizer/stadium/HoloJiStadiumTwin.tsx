"use client";

import React, { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Scene } from "./components/scene/Scene";
import { HUDOverlay } from "./components/ui/HUDOverlay";
import { ZoneInspector } from "./components/ui/ZoneInspector";
import { SituationAlertPanel } from "./components/ui/SituationAlertPanel";
import { SimulationControlBar } from "./components/ui/SimulationControlBar";
import { ZoneLabelsOverlay } from "./components/zones/ZoneLabelsOverlay";
import { OccupancyDataProvider } from "./data/occupancy";
import type { CameraPreset } from "./components/scene/CameraRig";
import type { RenderMode } from "./components/hologram/HologramMaterial";
import type { SpatialCalibration } from "./data/stadium/types";
import type { ZoneLabelData } from "./components/zones/StadiumZone";
import type { GateLabelData } from "./components/zones/GateMarker";
import "./stadium.css";

export default function HoloJiStadiumTwin() {
  const [renderMode, setRenderMode] = useState<RenderMode>("hologram");
  const [showEdges, setShowEdges] = useState<boolean>(true);
  const [scanActive, setScanActive] = useState<boolean>(true);
  const [bloomEnabled, setBloomEnabled] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("isometric");
  const [scanAltitude, setScanAltitude] = useState<number>(2.45);

  // Zone & Crowd States
  const [zonesEnabled, setZonesEnabled] = useState<boolean>(true);
  const [showZoneLabels, setShowZoneLabels] = useState<boolean>(true);
  const [showCrowd, setShowCrowd] = useState<boolean>(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [calibrations, setCalibrations] = useState<Record<string, SpatialCalibration>>({});

  // DOM label overlay state — updated each frame via useFrame inside the canvas
  const [zoneLabelData, setZoneLabelData] = useState<ZoneLabelData[]>([]);
  const [gateLabelData, setGateLabelData] = useState<GateLabelData[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectZone = useCallback((id: string | null) => {
    setSelectedZoneId(id);
    if (id) {
      setIsInspectorOpen(true);
    }
  }, []);

  const handleUpdateCalibration = useCallback((id: string, spatial: SpatialCalibration) => {
    setCalibrations((prev) => ({
      ...prev,
      [id]: spatial,
    }));
  }, []);

  const handleLabelsUpdate = useCallback((zones: ZoneLabelData[], gates: GateLabelData[]) => {
    setZoneLabelData(zones);
    setGateLabelData(gates);
  }, []);

  return (
    <OccupancyDataProvider>
      <div className="holoji-root app-container" ref={containerRef}>
        {/* Switch Operations Nav Button — JUNCTION platform navigation */}
        <div style={{ position: "absolute", top: "14px", left: "16px", zIndex: 100 }}>
          <Link href="/organizer/select" className="junction-nav-btn">
            ← SWITCH OPERATIONS
          </Link>
        </div>

        <Scene
          renderMode={renderMode}
          showEdges={showEdges}
          scanActive={scanActive}
          bloomEnabled={bloomEnabled}
          cameraPreset={cameraPreset}
          onScanYUpdate={setScanAltitude}
          zonesEnabled={zonesEnabled}
          showZoneLabels={showZoneLabels}
          showCrowd={showCrowd}
          selectedZoneId={selectedZoneId}
          onSelectZone={handleSelectZone}
          hoveredZoneId={hoveredZoneId}
          onHoverZone={setHoveredZoneId}
          calibrations={calibrations}
          onLabelsUpdate={showZoneLabels ? handleLabelsUpdate : undefined}
        />

        {/* DOM-based label overlay — sits outside the Canvas, no React portals */}
        {showZoneLabels && (
          <ZoneLabelsOverlay
            zones={zoneLabelData}
            gates={gateLabelData}
            onSelectZone={handleSelectZone}
            width={containerRef.current?.clientWidth ?? window.innerWidth}
            height={containerRef.current?.clientHeight ?? window.innerHeight}
          />
        )}

        <HUDOverlay
          renderMode={renderMode}
          setRenderMode={setRenderMode}
          showEdges={showEdges}
          setShowEdges={setShowEdges}
          scanActive={scanActive}
          setScanActive={setScanActive}
          bloomEnabled={bloomEnabled}
          setBloomEnabled={setBloomEnabled}
          showCrowd={showCrowd}
          setShowCrowd={setShowCrowd}
          cameraPreset={cameraPreset}
          setCameraPreset={setCameraPreset}
          scanAltitude={scanAltitude}
          zonesEnabled={zonesEnabled}
          setZonesEnabled={setZonesEnabled}
          showZoneLabels={showZoneLabels}
          setShowZoneLabels={setShowZoneLabels}
          selectedZoneId={selectedZoneId}
          onOpenCalibration={() => setIsInspectorOpen(true)}
        />

        {/* Real-time Situation Alert & Explainable Recommendation Card */}
        <SituationAlertPanel />

        {/* Bottom Simulation Clock, Scenarios & Playback Controls */}
        <SimulationControlBar />

        {/* Zone & Gate Inspector Drawer */}
        {isInspectorOpen && (
          <ZoneInspector
            selectedZoneId={selectedZoneId}
            onClose={() => setIsInspectorOpen(false)}
            calibrations={calibrations}
            onUpdateCalibration={handleUpdateCalibration}
            onSelectZone={handleSelectZone}
          />
        )}
      </div>
    </OccupancyDataProvider>
  );
}
