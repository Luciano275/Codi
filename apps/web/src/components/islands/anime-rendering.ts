import * as THREE from 'three';
import { getWebGlRenderQuality, type WebGlRenderQuality } from '@/lib/webgl-performance';

export const ANIME_RENDERING = {
  exposure: 1.18,
  sun: { color: 0xffedc1, intensity: 5.4, position: [-28, 15, 16] as const },
  fill: { skyColor: 0x9ad9ff, groundColor: 0x315a3d, intensity: 0.92 },
  rim: { color: 0x8eeaff, strength: 0.1 },
  shadowBias: -0.00035,
  shadowNormalBias: 0.015,
  saturation: 1.28,
  toonSteps: [42, 112, 196, 255] as const,
};

export interface AnimeAtmosphere {
  root: THREE.Group;
  clouds: THREE.Sprite[];
  cloudTexture: THREE.CanvasTexture;
}

export function configureAnimeRenderer(
  renderer: THREE.WebGLRenderer,
  quality: WebGlRenderQuality = getWebGlRenderQuality(),
) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatioCap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = ANIME_RENDERING.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
}

export function createAnimeLighting(quality = getWebGlRenderQuality()) {
  const lights = new THREE.Group();
  lights.name = 'AnimeLighting';

  const fill = new THREE.HemisphereLight(
    ANIME_RENDERING.fill.skyColor,
    ANIME_RENDERING.fill.groundColor,
    ANIME_RENDERING.fill.intensity,
  );
  lights.add(fill);

  const sun = new THREE.DirectionalLight(ANIME_RENDERING.sun.color, ANIME_RENDERING.sun.intensity);
  sun.name = 'AnimeSun';
  sun.position.set(...ANIME_RENDERING.sun.position);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 70;
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -10;
  sun.shadow.bias = ANIME_RENDERING.shadowBias;
  sun.shadow.normalBias = ANIME_RENDERING.shadowNormalBias;
  lights.add(sun, sun.target);

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

export function createAnimeSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo crear el cielo del mapa.');

  const skyGradient = context.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, '#063667');
  skyGradient.addColorStop(0.52, '#127bb6');
  skyGradient.addColorStop(1, '#67d8ed');
  context.fillStyle = skyGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const sunGlow = context.createRadialGradient(150, 95, 10, 150, 95, 250);
  sunGlow.addColorStop(0, 'rgba(255, 239, 185, 0.72)');
  sunGlow.addColorStop(0.28, 'rgba(255, 232, 161, 0.3)');
  sunGlow.addColorStop(1, 'rgba(255, 232, 161, 0)');
  context.fillStyle = sunGlow;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo crear la textura de nubes.');

  const puffs = [
    [48, 80, 38],
    [84, 60, 48],
    [128, 53, 54],
    [172, 67, 43],
    [208, 85, 30],
  ] as const;
  puffs.forEach(([x, y, radius]) => {
    const gradient = context.createRadialGradient(x, y, radius * 0.08, x, y, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 250, 0.98)');
    gradient.addColorStop(0.56, 'rgba(250, 248, 233, 0.8)');
    gradient.addColorStop(1, 'rgba(224, 239, 255, 0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function createCloudSprite(
  texture: THREE.CanvasTexture,
  position: readonly [number, number, number],
  size: readonly [number, number],
  opacity: number,
) {
  const cloud = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, opacity, depthWrite: false }),
  );
  cloud.position.set(...position);
  cloud.scale.set(size[0], size[1], 1);
  cloud.renderOrder = -1;
  cloud.userData.basePosition = cloud.position.clone();
  return cloud;
}

export function createAnimeAtmosphere(): AnimeAtmosphere {
  const root = new THREE.Group();
  root.name = 'AnimeAtmosphere';
  const cloudTexture = createCloudTexture();
  const clouds = [
    createCloudSprite(cloudTexture, [-8, -1, -7], [11, 5.5], 0.8),
    createCloudSprite(cloudTexture, [7.5, 1.5, -12], [8.5, 4.2], 0.62),
    createCloudSprite(cloudTexture, [-5.5, 7.2, -15], [9, 4.5], 0.55),
    createCloudSprite(cloudTexture, [7.5, 8.2, -17], [7, 3.5], 0.5),
  ];
  clouds.forEach((cloud) => root.add(cloud));
  return { root, clouds, cloudTexture };
}

export function updateAnimeAtmosphere(atmosphere: AnimeAtmosphere, elapsed: number) {
  atmosphere.clouds.forEach((cloud, index) => {
    const basePosition = cloud.userData.basePosition as THREE.Vector3;
    cloud.position.x = basePosition.x + Math.sin(elapsed * 0.08 + index * 1.7) * 0.12;
    cloud.position.y = basePosition.y + Math.sin(elapsed * 0.16 + index) * 0.05;
  });
}

function saturate(color: THREE.Color) {
  const hsl = color.getHSL({ h: 0, s: 0, l: 0 });
  return color.setHSL(hsl.h, Math.min(1, hsl.s * ANIME_RENDERING.saturation), hsl.l);
}

function addRimLight(material: THREE.MeshToonMaterial | THREE.MeshPhongMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.rimColor = { value: new THREE.Color(ANIME_RENDERING.rim.color) };
    shader.uniforms.rimStrength = { value: ANIME_RENDERING.rim.strength };
    shader.fragmentShader = shader.fragmentShader.replace(
      'void main() {',
      'uniform vec3 rimColor;\nuniform float rimStrength;\n\nvoid main() {',
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `float rim = pow(1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0), 3.0);
       outgoingLight += rimColor * rim * rimStrength;
       #include <opaque_fragment>`,
    );
  };
  material.customProgramCacheKey = () => 'anime-rim-v1';
}

function createToonMaterial(source: THREE.MeshStandardMaterial, gradient: THREE.DataTexture) {
  const material = new THREE.MeshToonMaterial({
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
  addRimLight(material);
  return material;
}

function isReflectiveMaterial(material: THREE.MeshStandardMaterial) {
  const materialName = material.name.toLowerCase();
  return (
    material.metalness > 0.25 ||
    /metal|gold|silver|chrome|steel|copper|water|ocean|river|lake|sea|lagoon/.test(materialName)
  );
}

function isWaterMaterial(material: THREE.MeshStandardMaterial) {
  return /water|ocean|river|lake|sea|lagoon/.test(material.name.toLowerCase());
}

function createHighlightMaterial(source: THREE.MeshStandardMaterial) {
  const isWater = isWaterMaterial(source);
  const material = new THREE.MeshPhongMaterial({
    name: `${source.name}_${isWater ? 'Water' : 'Metal'}Highlight`,
    color: saturate(source.color.clone()),
    map: source.map,
    lightMap: source.lightMap,
    lightMapIntensity: source.lightMapIntensity,
    aoMap: source.aoMap,
    aoMapIntensity: source.aoMapIntensity,
    emissive: source.emissive,
    emissiveMap: source.emissiveMap,
    emissiveIntensity: source.emissiveIntensity,
    normalMap: source.normalMap,
    normalScale: source.normalScale,
    alphaMap: source.alphaMap,
    alphaTest: source.alphaTest,
    transparent: source.transparent,
    opacity: source.opacity,
    side: source.side,
    depthTest: source.depthTest,
    depthWrite: source.depthWrite,
    vertexColors: source.vertexColors,
    fog: source.fog,
    specular: isWater ? 0xcff8ff : 0xfff1bd,
    shininess: isWater ? 110 : 82,
    reflectivity: isWater ? 0.8 : 0.65,
  });
  addRimLight(material);
  return material;
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
      const material = isReflectiveMaterial(source)
        ? createHighlightMaterial(source)
        : createToonMaterial(source, gradient);
      toonMaterials.set(source, material);
      source.dispose();
      return material;
    });
    child.material = Array.isArray(child.material) ? materials : materials[0];
  });
}
