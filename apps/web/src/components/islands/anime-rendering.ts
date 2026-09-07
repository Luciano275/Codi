import * as THREE from 'three';

export const ANIME_RENDERING = {
  exposure: 1.08,
  maxPixelRatio: 2,
  key: { color: 0xfff1d0, intensity: 4.5, position: [-28, 20, 1] as const },
  fill: { color: 0xb8d4f0, intensity: 0.15 },
  shadowMapSize: 4096,
  shadowBias: -0.00035,
  shadowNormalBias: 0.015,
  saturation: 1.12,
  toonSteps: [62, 154, 255] as const,
};

export function configureAnimeRenderer(renderer: THREE.WebGLRenderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, ANIME_RENDERING.maxPixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = ANIME_RENDERING.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

export function createAnimeLighting() {
  const lights = new THREE.Group();
  lights.name = 'AnimeLighting';

  const fill = new THREE.AmbientLight(
    ANIME_RENDERING.fill.color,
    ANIME_RENDERING.fill.intensity,
  );
  lights.add(fill);

  const key = new THREE.DirectionalLight(ANIME_RENDERING.key.color, ANIME_RENDERING.key.intensity);
  key.position.set(...ANIME_RENDERING.key.position);
  key.castShadow = true;
  key.shadow.mapSize.set(ANIME_RENDERING.shadowMapSize, ANIME_RENDERING.shadowMapSize);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 70;
  key.shadow.camera.left = -20;
  key.shadow.camera.right = 20;
  key.shadow.camera.top = 14;
  key.shadow.camera.bottom = -10;
  key.shadow.bias = ANIME_RENDERING.shadowBias;
  key.shadow.normalBias = ANIME_RENDERING.shadowNormalBias;
  lights.add(key);

  return lights;
}

export function createToonGradient() {
  const gradient = new THREE.DataTexture(
    new Uint8Array(ANIME_RENDERING.toonSteps),
    ANIME_RENDERING.toonSteps.length,
    1,
    THREE.RedFormat,
  );
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.unpackAlignment = 1;
  gradient.needsUpdate = true;
  return gradient;
}

function saturate(color: THREE.Color) {
  const hsl = color.getHSL({ h: 0, s: 0, l: 0 });
  return color.setHSL(hsl.h, Math.min(1, hsl.s * ANIME_RENDERING.saturation), hsl.l);
}

function createToonMaterial(source: THREE.MeshStandardMaterial, gradient: THREE.DataTexture) {
  return new THREE.MeshToonMaterial({
    name: `${source.name}_Toon`,
    color: saturate(source.color.clone()),
    map: source.map,
    lightMap: source.lightMap,
    lightMapIntensity: source.lightMapIntensity,
    aoMap: source.aoMap,
    aoMapIntensity: source.aoMapIntensity,
    emissive: source.emissive,
    emissiveMap: source.emissiveMap,
    emissiveIntensity: source.emissiveIntensity,
    bumpMap: source.bumpMap,
    bumpScale: source.bumpScale,
    normalMap: source.normalMap,
    normalScale: source.normalScale,
    displacementMap: source.displacementMap,
    displacementScale: source.displacementScale,
    displacementBias: source.displacementBias,
    alphaMap: source.alphaMap,
    alphaTest: source.alphaTest,
    transparent: source.transparent,
    opacity: source.opacity,
    side: source.side,
    depthTest: source.depthTest,
    depthWrite: source.depthWrite,
    vertexColors: source.vertexColors,
    fog: source.fog,
    gradientMap: gradient,
  });
}

export function applyAnimeMaterials(root: THREE.Object3D, gradient: THREE.DataTexture) {
  const toonMaterials = new Map<THREE.Material, THREE.Material>();

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const sources = Array.isArray(child.material) ? child.material : [child.material];
    const materials = sources.map((source) => {
      if (!(source instanceof THREE.MeshStandardMaterial)) return source;
      const cached = toonMaterials.get(source);
      if (cached) return cached;
      const toon = createToonMaterial(source, gradient);
      toonMaterials.set(source, toon);
      source.dispose();
      return toon;
    });
    child.material = Array.isArray(child.material) ? materials : materials[0];
  });
}
