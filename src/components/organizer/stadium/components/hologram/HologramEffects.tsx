import React from "react";
import { EffectComposer, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

interface HologramEffectsProps {
  bloomIntensity?: number;
  bloomEnabled?: boolean;
}

export const HologramEffects: React.FC<HologramEffectsProps> = ({
  bloomIntensity = 0.45,
  bloomEnabled = true,
}) => {
  if (!bloomEnabled) return null;

  return (
    <EffectComposer multisampling={4}>
      <Bloom
        luminanceThreshold={0.72}
        luminanceSmoothing={0.15}
        intensity={bloomIntensity}
        mipmapBlur
        radius={0.45}
      />
      <Vignette
        eskil={false}
        offset={0.3}
        darkness={0.65}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
};
