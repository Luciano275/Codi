'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinnedModel } from 'three/addons/utils/SkeletonUtils.js';
import {
  applyAnimeMaterials,
  createAnimeAtmosphere,
  configureAnimeRenderer,
  createAnimeLighting,
  createAnimeSkyTexture,
  createToonGradient,
  updateAnimeAtmosphere,
} from './anime-rendering';
import type { IslandViewModel } from './types';

interface IslandWorldProps {
  islands: IslandViewModel[];
  departingId: string | null;
  focusedIslandId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

const HOVER_LIFT = 0.22;
const ENTER_DURATION = 0.55;
const ENTER_LIFT_OFFSET = 2.4;
const ENTER_FLY_OFFSET = 3.4;

function easeInQuart(t: number) {
  return t * t * t * t;
}

function makeUnavailable(root: THREE.Object3D) {
  const unavailableMaterials = new Map<THREE.Material, THREE.MeshStandardMaterial>();

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const sources = Array.isArray(child.material) ? child.material : [child.material];
    const materials = sources.map((source) => {
      const cached = unavailableMaterials.get(source);
      if (cached) return cached;
      const color = 'color' in source ? (source.color as THREE.Color) : new THREE.Color(0x888888);
      const luminance = color.r * 0.21 + color.g * 0.72 + color.b * 0.07;
      const unavailable = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0, 0, Math.min(0.68, Math.max(0.32, luminance))),
        roughness: 0.9,
        metalness: 0,
        transparent: true,
        opacity: 0.78,
      });
      unavailableMaterials.set(source, unavailable);
      source.dispose();
      return unavailable;
    });
    child.material = Array.isArray(child.material) ? materials : materials[0];
  });
}

function prepareIsland(
  root: THREE.Object3D,
  island: IslandViewModel,
  index: number,
  count: number,
  toonGradient: THREE.DataTexture,
) {
  const initialBox = new THREE.Box3().setFromObject(root);
  const size = initialBox.getSize(new THREE.Vector3());
  const modelScale = 10.2 / Math.max(size.x, size.y, size.z);
  root.scale.setScalar(modelScale);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  root.position.x += (index - (count - 1) / 2) * 11.2;
  root.position.y += 0.4;
  root.userData.baseY = root.position.y;
  root.userData.islandId = island.id;
  root.userData.available = island.available;
  root.userData.href = island.href;
  root.userData.hovered = false;

  root.traverse((child) => {
    child.userData.islandRoot = root;
    if (child instanceof THREE.Mesh) {
      child.castShadow = island.available;
      child.receiveShadow = true;
    }
  });
  if (island.available) applyAnimeMaterials(root, toonGradient);
  if (!island.available) makeUnavailable(root);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(Math.max(size.x, size.z) * 0.45, 0.075 / modelScale, 8, 48),
    new THREE.MeshBasicMaterial({
      color: 0x4fd8ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -size.y / 2 + 0.15 / modelScale;
  ring.renderOrder = 1;
  root.add(ring);
  root.userData.ring = ring;
  return root;
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

function cloneIslandModel(source: THREE.Object3D) {
  const clone = cloneSkinnedModel(source);
  clone.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const clonedMaterials = materials.map((material) => material.clone());
    child.material = Array.isArray(child.material) ? clonedMaterials : clonedMaterials[0];
  });
  return clone;
}

export default function IslandWorld({
  islands,
  departingId,
  focusedIslandId,
  onHover,
  onSelect,
}: IslandWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);
  const notifyHover = useEffectEvent(onHover);
  const notifySelect = useEffectEvent(onSelect);
  const startEnterRef = useRef<((id: string) => void) | null>(null);
  const focusIslandRef = useRef<((id: string) => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || islands.length === 0) return;

    const scene = new THREE.Scene();
    const skyTexture = createAnimeSkyTexture();
    scene.background = skyTexture;
    scene.fog = new THREE.FogExp2(0x365f80, 0.009);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 8.0, 15);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    configureAnimeRenderer(renderer);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 8;
    controls.maxDistance = 20;
    controls.minPolarAngle = Math.PI * 0.2;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.target.set(0, 0, 0);

    scene.add(createAnimeLighting());
    const toonGradient = createToonGradient();
    const atmosphere = createAnimeAtmosphere();
    scene.add(atmosphere.root);

    const islandRoots: THREE.Object3D[] = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const loader = new GLTFLoader();
    const modelRequests = new Map<string, ReturnType<GLTFLoader['loadAsync']>>();
    const clock = new THREE.Clock();
    let elapsed = 0;
    let frameId = 0;
    let disposed = false;
    let state: 'islands' | 'entering' = 'islands';
    let hoveredIsland: THREE.Object3D | undefined;
    let pressedAt = { x: 0, y: 0 };
    const enterFromCamPos = new THREE.Vector3();
    const enterFromTarget = new THREE.Vector3();
    const enterWorldPos = new THREE.Vector3();
    const enterTargetPos = new THREE.Vector3();
    let enterIsland: THREE.Object3D | undefined;
    let enterT = 0;
    const focusCameraPosition = new THREE.Vector3();
    const focusTargetPosition = new THREE.Vector3();

    const loadIslandModel = (island: IslandViewModel) => {
      const existingRequest = modelRequests.get(island.modelCacheKey);
      if (existingRequest) return existingRequest;
      const request = loader.loadAsync(island.modelPath);
      modelRequests.set(island.modelCacheKey, request);
      return request;
    };

    Promise.allSettled(islands.map(loadIslandModel))
      .then((results) => {
        if (disposed) {
          results.forEach((result) => {
            if (result.status === 'fulfilled') disposeObject(result.value.scene);
          });
          return;
        }
        results.forEach((result, index) => {
          if (result.status !== 'fulfilled') return;
          const model = result.value;
          const island = islands[index];
          const root = prepareIsland(
            cloneIslandModel(model.scene),
            island,
            index,
            islands.length,
            toonGradient,
          );
          const selectedClip = THREE.AnimationClip.findByName(model.animations, 'Island_Selected');
          if (island.available && selectedClip) {
            const mixer = new THREE.AnimationMixer(root);
            const selectedAction = mixer.clipAction(selectedClip);
            selectedAction.setLoop(THREE.LoopRepeat, Infinity);
            selectedAction.play();
            root.userData.mixer = mixer;
          }
          islandRoots.push(root);
          scene.add(root);
        });
        if (results.some((result) => result.status === 'rejected')) setLoadError(true);
        if (focusedIslandId) focusIslandRef.current?.(focusedIslandId);
      })
      .catch(() => undefined);

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight, false);
    };

    const pickIsland = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      let picked: THREE.Object3D | undefined;
      let nearestDistance = Infinity;
      islandRoots.forEach((island) => {
        const hit = raycaster.intersectObject(island, true)[0];
        if (hit && hit.distance < nearestDistance) {
          picked = island;
          nearestDistance = hit.distance;
        }
      });
      return picked;
    };

    const setHover = (island: THREE.Object3D | undefined) => {
      if (island === hoveredIsland) return;
      if (hoveredIsland) hoveredIsland.userData.hovered = false;
      hoveredIsland = island;
      if (hoveredIsland) {
        hoveredIsland.userData.hovered = true;
      }
      notifyHover(hoveredIsland?.userData.islandId ?? null);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (state !== 'islands') return;
      const island = pickIsland(event);
      renderer.domElement.style.cursor = island?.userData.available
        ? 'pointer'
        : island
          ? 'not-allowed'
          : 'grab';
      setHover(island);
    };
    const handlePointerDown = (event: PointerEvent) => {
      pressedAt = { x: event.clientX, y: event.clientY };
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y) > 6) return;
      const island = pickIsland(event);
      if (!island?.userData.available) return;
      setHover(undefined);
      notifySelect(island.userData.islandId);
    };
    const handlePointerLeave = () => {
      if (state !== 'islands') return;
      renderer.domElement.style.cursor = 'grab';
      setHover(undefined);
    };

    const startEnter = (id: string) => {
      const island = islandRoots.find((root) => root.userData.islandId === id);
      if (!island) return;
      state = 'entering';
      controls.enabled = false;
      setHover(undefined);
      enterIsland = island;
      island.getWorldPosition(enterWorldPos);
      enterTargetPos.set(
        enterWorldPos.x,
        enterWorldPos.y + ENTER_LIFT_OFFSET,
        enterWorldPos.z + ENTER_FLY_OFFSET,
      );
      enterFromCamPos.copy(camera.position);
      enterFromTarget.copy(controls.target);
      enterT = 0;
    };
    startEnterRef.current = startEnter;

    const focusIsland = (id: string) => {
      const island = islandRoots.find((root) => root.userData.islandId === id);
      if (!island || state !== 'islands') return;
      island.getWorldPosition(focusTargetPosition);
      focusCameraPosition.set(focusTargetPosition.x, 8.0, 15);
    };
    focusIslandRef.current = focusIsland;

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const animate = () => {
      const delta = clock.getDelta();
      elapsed += delta;
      updateAnimeAtmosphere(atmosphere, elapsed);
      const smooth = 1 - Math.pow(0.001, delta);
      islandRoots.forEach((root) => {
        const mixer = root.userData.mixer as THREE.AnimationMixer | undefined;
        mixer?.update(delta);
        const hovered = root.userData.hovered as boolean;
        root.position.y = THREE.MathUtils.lerp(
          root.position.y,
          (root.userData.baseY as number) + (hovered ? HOVER_LIFT : 0),
          smooth,
        );

        const ring = root.userData.ring as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
        ring.material.opacity = THREE.MathUtils.lerp(
          ring.material.opacity,
          hovered ? 0.9 : 0,
          smooth,
        );
        ring.rotation.z += delta * 0.9;
      });

      if (state === 'entering' && enterIsland) {
        enterT = Math.min(1, enterT + delta / ENTER_DURATION);
        const eased = easeInQuart(enterT);
        camera.position.lerpVectors(enterFromCamPos, enterTargetPos, eased);
        controls.target.lerpVectors(enterFromTarget, enterWorldPos, eased);
        camera.lookAt(controls.target);
      } else {
        if (focusCameraPosition.lengthSq() > 0) {
          camera.position.lerp(focusCameraPosition, smooth);
          controls.target.lerp(focusTargetPosition, smooth);
        }
        controls.update();
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      startEnterRef.current = null;
      focusIslandRef.current = null;
      notifyHover(null);
      controls.dispose();
      islandRoots.forEach((root) => {
        const mixer = root.userData.mixer as THREE.AnimationMixer | undefined;
        mixer?.stopAllAction();
        mixer?.uncacheRoot(root);
      });
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      disposeObject(scene);
      toonGradient.dispose();
      atmosphere.cloudTexture.dispose();
      skyTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [islands]);

  useEffect(() => {
    if (!departingId) return;
    startEnterRef.current?.(departingId);
  }, [departingId]);

  useEffect(() => {
    if (focusedIslandId) focusIslandRef.current?.(focusedIslandId);
  }, [focusedIslandId]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      aria-label="Mapa 3D de islas de aprendizaje"
    >
      {loadError ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-36 z-20 mx-auto w-fit max-w-md rounded-xl border border-sky-100/25 bg-[#102a45]/80 px-4 py-2 text-center text-xs text-sky-50 shadow-lg backdrop-blur-sm">
          No pudimos cargar una o más islas. Podés reintentar desde las tarjetas inferiores.
        </div>
      ) : null}
    </div>
  );
}
