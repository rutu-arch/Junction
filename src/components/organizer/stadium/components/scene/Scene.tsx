import React, { Suspense, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Lighting } from "./Lighting";
import { Environment } from "./Environment";
import { CameraRig } from "./CameraRig";
import type { CameraPreset } from "./CameraRig";
import { StadiumModel } from "../stadium/StadiumModel";
import { ScanEffect } from "../hologram/ScanEffect";
import { HologramEffects } from "../hologram/HologramEffects";
import type { RenderMode } from "../hologram/HologramMaterial";
import { ZoneManager } from "../zones/ZoneManager";
import { CrowdManager } from "../crowd/CrowdManager";
import type { SpatialCalibration } from "../../data/stadium/types";
import type { ZoneLabelData } from "../zones/StadiumZone";
import type { GateLabelData } from "../zones/GateMarker";

interface SceneProps {
  renderMode: RenderMode;
  showEdges: boolean;
  scanActive: boolean;
  bloomEnabled: boolean;
  cameraPreset: CameraPreset;
  onScanYUpdate?: (y: number) => void;
  onCameraChange?: () => void;

  // Zone & Crowd props
  zonesEnabled: boolean;
  showZoneLabels: boolean;
  showCrowd?: boolean;
  selectedZoneId: string | null;
  onSelectZone: (id: string | null) => void;
  hoveredZoneId: string | null;
  onHoverZone: (id: string | null) => void;
  calibrations?: Record<string, SpatialCalibration>;

  /** Receives projected label positions each frame for DOM overlay rendering */
  onLabelsUpdate?: (zones: ZoneLabelData[], gates: GateLabelData[]) => void;
}

export const Scene: React.FC<SceneProps> = ({
  renderMode,
  showEdges,
  scanActive,
  bloomEnabled,
  cameraPreset,
  onScanYUpdate,
  onCameraChange,
  zonesEnabled,
  showZoneLabels,
  showCrowd = true,
  selectedZoneId,
  onSelectZone,
  hoveredZoneId,
  onHoverZone,
  calibrations,
  onLabelsUpdate,
}) => {
  const [bounds] = useState({ minY: 0.5, maxY: 10.0, radius: 12.0 });
  const [currentScanY, setCurrentScanY] = useState(2.0);

  const handleScanUpdate = useCallback((y: number) => {
    setCurrentScanY(y);
    if (onScanYUpdate) {
      onScanYUpdate(y);
    }
  }, [onScanYUpdate]);

  return (
    <div className="scene-container">
      <Canvas
        camera={{
          fov: 40,
          position: [21, 14, 21],
          near: 0.1,
          far: 250,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <Lighting />
        <Environment radius={bounds.radius * 1.2} />

        <Suspense fallback={null}>
          <StadiumModel
            renderMode={renderMode}
            showEdges={showEdges}
            scanY={currentScanY}
          />

          {/* 6 Primary Stand/Pavilion Zone Overlays */}
          <ZoneManager
            enabled={zonesEnabled}
            showLabels={showZoneLabels}
            selectedZoneId={selectedZoneId}
            onSelectZone={onSelectZone}
            hoveredZoneId={hoveredZoneId}
            onHoverZone={onHoverZone}
            calibrations={calibrations}
            onLabelsUpdate={onLabelsUpdate}
          />

          {/* 3D Holographic Crowd Population Layer */}
          <CrowdManager
            enabled={zonesEnabled && showCrowd}
            selectedZoneId={selectedZoneId}
            calibrations={calibrations}
          />
        </Suspense>

        <ScanEffect
          bounds={bounds}
          active={scanActive}
          onScanYUpdate={handleScanUpdate}
        />

        <CameraRig preset={cameraPreset} onControlsChange={onCameraChange} />

        <HologramEffects bloomEnabled={bloomEnabled} bloomIntensity={renderMode === "wireframe" ? 0.6 : 0.45} />
      </Canvas>
    </div>
  );
};
