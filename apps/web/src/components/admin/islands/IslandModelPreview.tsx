'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  applyAnimeMaterials,
  configureAnimeRenderer,
  createAnimeLighting,
  createToonGradient,
} from '@/components/islands/anime-rendering';
import { observeRenderVisibility } from '@/lib/render-visibility';
import { getWebGlRenderQuality } from '@/lib/webgl-performance';

interface IslandModelPreviewProps {
  sourceUrl: string;
  fileName?: string | null;
}

export function IslandModelPreview({ sourceUrl, fileName }: IslandModelPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eaf2e4');
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(3.8, 2.8, 5.2);

    const renderQuality = getWebGlRenderQuality();
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    configureAnimeRenderer(renderer, renderQuality);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minDistance = 2;
    controls.maxDistance = 12;

    scene.add(createAnimeLighting(renderQuality));
    const toonGradient = createToonGradient();

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(3.5, 48),
      new THREE.MeshStandardMaterial({ color: '#d4e9c6', roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.35;
    ground.receiveShadow = true;
    scene.add(ground);

    let model: THREE.Object3D | null = null;
    let animationFrame = 0;
    let disposed = false;
    let canRender = true;
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    new GLTFLoader()
      .loadAsync(sourceUrl)
      .then((gltf) => {
        if (disposed) return disposeModel(gltf.scene);
        model = centerModel(gltf.scene);
        applyAnimeMaterials(model, toonGradient);
        scene.add(model);
        setError(false);
      })
      .catch(() => !disposed && setError(true));

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const scheduleRender = () => {
      if (!disposed && canRender && animationFrame === 0) {
        animationFrame = requestAnimationFrame(render);
      }
    };
    const render = () => {
      animationFrame = 0;
      controls.update();
      renderer.render(scene, camera);
      scheduleRender();
    };
    const stopObservingVisibility = observeRenderVisibility(container, (visible) => {
      canRender = visible;
      if (visible) scheduleRender();
      else if (animationFrame !== 0) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    });

    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
      stopObservingVisibility();
      controls.dispose();
      if (model) disposeModel(model);
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      toonGradient.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [sourceUrl]);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-[#eaf2e4]">
      <div className="flex items-center justify-between border-b border-[#d4e4ca] bg-white/70 px-3 py-2 text-xs">
        <span className="font-medium text-gray-600">Vista previa 3D</span>
        <span className="max-w-48 truncate text-gray-400">{fileName ?? 'Modelo de isla'}</span>
      </div>
      <div ref={containerRef} className="relative h-64 touch-none sm:h-80" />
      {error && (
        <p className="border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          No se pudo previsualizar este archivo GLB.
        </p>
      )}
    </div>
  );
}

function centerModel(model: THREE.Object3D) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 2.7 / Math.max(size.x, size.y, size.z, 0.01);
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return model;
}

function disposeModel(model: THREE.Object3D) {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}
