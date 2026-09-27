import * as THREE from "three";

export type RenderMode = "hologram" | "wireframe" | "tactical";

export interface HologramUniforms {
  uTime: { value: number };
  uScanY: { value: number };
  uScanWidth: { value: number };
  uScanIntensity: { value: number };
  uBaseColor: { value: THREE.Color };
  uGlowColor: { value: THREE.Color };
  uScanColor: { value: THREE.Color };
  uFresnelPower: { value: number };
  uBaseOpacity: { value: number };
  uScanlineFrequency: { value: number };
  uScanlineStrength: { value: number };
}

export function createHologramMaterial(mode: RenderMode = "hologram"): THREE.ShaderMaterial {
  const isWireframe = mode === "wireframe";
  const isTactical = mode === "tactical";

  const uniforms: HologramUniforms = {
    uTime: { value: 0 },
    uScanY: { value: 0 },
    uScanWidth: { value: 0.85 },
    uScanIntensity: { value: 0.65 },
    uBaseColor: {
      value: new THREE.Color(isTactical ? "#010e1a" : isWireframe ? "#000a12" : "#021220"),
    },
    uGlowColor: {
      value: new THREE.Color(isWireframe ? "#00f0ff" : "#00d8f6"),
    },
    uScanColor: {
      value: new THREE.Color("#80ffff"),
    },
    uFresnelPower: {
      value: isTactical ? 3.5 : isWireframe ? 4.0 : 3.2,
    },
    uBaseOpacity: {
      value: isTactical ? 0.65 : isWireframe ? 0.08 : 0.18,
    },
    uScanlineFrequency: {
      value: 80.0,
    },
    uScanlineStrength: {
      value: isTactical ? 0.04 : 0.06,
    },
  };

  const vertexShader = `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uScanY;
    uniform float uScanWidth;
    uniform float uScanIntensity;
    uniform vec3 uBaseColor;
    uniform vec3 uGlowColor;
    uniform vec3 uScanColor;
    uniform float uFresnelPower;
    uniform float uBaseOpacity;
    uniform float uScanlineFrequency;
    uniform float uScanlineStrength;

    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Localized Fresnel rim glow (only at grazing incident angles)
      float dotNV = max(dot(normal, viewDir), 0.0);
      float fresnel = pow(1.0 - dotNV, uFresnelPower);

      // Subtle fine scanline raster
      float scanline = sin(vWorldPosition.y * uScanlineFrequency + uTime * 2.0) * 0.5 + 0.5;

      // Localized Gaussian holographic scan beam (does not flood entire model)
      float scanDist = abs(vWorldPosition.y - uScanY);
      float scanBeam = exp(-pow(scanDist, 2.0) / (2.0 * uScanWidth * uScanWidth));

      // Tonal color composition: Dark Base -> Controlled Rim -> Localized Scan Slice
      vec3 col = uBaseColor;
      col += uGlowColor * (fresnel * 0.45);
      col += uGlowColor * (scanline * uScanlineStrength);
      col += uScanColor * (scanBeam * uScanIntensity);

      // Controlled semi-transparency allowing internal bowl/pitch geometry to be seen
      float alpha = uBaseOpacity + (fresnel * 0.35) + (scanBeam * 0.35);
      alpha = clamp(alpha, 0.04, 0.85);

      gl_FragColor = vec4(col, alpha);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as { [uniform: string]: THREE.IUniform },
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
  });
}
