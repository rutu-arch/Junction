import React from "react";

export const Lighting: React.FC = () => {
  return (
    <>
      {/* Deep Cyber Ambient Light */}
      <ambientLight intensity={0.35} color="#051a2e" />

      {/* Primary Key Rim Light */}
      <directionalLight
        position={[20, 28, 20]}
        intensity={0.6}
        color="#00d8f6"
      />

      {/* Secondary Fill Azure Light */}
      <directionalLight
        position={[-20, 15, -20]}
        intensity={0.4}
        color="#0055aa"
      />

      {/* Subtle Pedestal Uplight */}
      <pointLight
        position={[0, 0.4, 0]}
        intensity={0.6}
        distance={20}
        color="#00f0ff"
      />
    </>
  );
};
