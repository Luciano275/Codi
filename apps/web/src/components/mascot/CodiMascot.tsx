'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const CODI_ANIMATIONS = [
  'Codi_Correct_Small',
  'Codi_Crying',
  'Codi_Excited',
  'Codi_Frustrated',
  'Codi_Happy',
  'Codi_Happy_Alt',
  'Codi_Idle',
  'Codi_Rest',
  'Codi_Thinking',
  'Codi_Wave',
  'Codi_Wrong_Small',
] as const;

export type CodiAnimation = (typeof CODI_ANIMATIONS)[number];

interface CodiMascotProps {
  animation: CodiAnimation;
  loopAfter?: CodiAnimation;
  className?: string;
  label?: string;
}

function disposeModel(model: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value);
      });
      material.dispose();
    });
  });

  textures.forEach((texture) => texture.dispose());
}

export function CodiMascot({
  animation,
  loopAfter,
  className = '',
  label = 'Codi',
}: CodiMascotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failedToLoad, setFailedToLoad] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId = 0;
    let disposed = false;
    let visible = true;
    let mixer: THREE.AnimationMixer | null = null;
    let model: THREE.Object3D | null = null;
    let finishedHandler: THREE.EventListener<
      THREE.AnimationMixerEventMap['finished'],
      'finished',
      THREE.AnimationMixer
    > | null = null;
    const clock = new THREE.Clock();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.1, 7);
    camera.lookAt(0, 0.25, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearAlpha(0);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb7cfb0, 2.5));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
    keyLight.position.set(3, 5, 6);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
    fillLight.position.set(-4, 1, 3);
    scene.add(fillLight);

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      const width = Math.max(clientWidth, 1);
      const height = Math.max(clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) clock.start();
      },
      { threshold: 0.01 },
    );
    visibilityObserver.observe(container);

    new GLTFLoader().load(
      '/anims/Codi.glb',
      (gltf) => {
        if (disposed) {
          disposeModel(gltf.scene);
          return;
        }

        model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const largestDimension = Math.max(size.x, size.y, size.z);
        model.scale.setScalar(3.25 / largestDimension);

        const centeredBounds = new THREE.Box3().setFromObject(model);
        const center = centeredBounds.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.position.y += 0.08;
        scene.add(model);

        const initialClip = THREE.AnimationClip.findByName(gltf.animations, animation);
        if (!initialClip) return;
        mixer = new THREE.AnimationMixer(model);
        const initialAction = mixer.clipAction(initialClip);
        const loopClip = loopAfter
          ? THREE.AnimationClip.findByName(gltf.animations, loopAfter)
          : null;

        if (loopClip && !reducedMotion) {
          const loopAction = mixer.clipAction(loopClip);
          initialAction.setLoop(THREE.LoopOnce, 1);
          initialAction.clampWhenFinished = true;
          initialAction.play();
          finishedHandler = (event) => {
            if (event.action !== initialAction) return;
            loopAction.reset().setLoop(THREE.LoopRepeat, Infinity).play();
            initialAction.crossFadeTo(loopAction, 0.18, false);
            mixer?.removeEventListener('finished', finishedHandler!);
          };
          mixer.addEventListener('finished', finishedHandler);
        } else {
          initialAction.setLoop(THREE.LoopRepeat, Infinity);
          initialAction.play();
        }

        if (reducedMotion) mixer.setTime(0);
      },
      undefined,
      () => {
        if (!disposed) setFailedToLoad(true);
      },
    );

    const render = () => {
      if (!disposed) {
        if (visible) {
          if (!reducedMotion) mixer?.update(clock.getDelta());
          renderer.render(scene, camera);
        }
        frameId = window.requestAnimationFrame(render);
      }
    };
    render();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      if (mixer && model) {
        if (finishedHandler) mixer.removeEventListener('finished', finishedHandler);
        mixer.stopAllAction();
        mixer.uncacheRoot(model);
      }
      if (model) disposeModel(model);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [animation, loopAfter]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={label}
      className={`relative overflow-hidden ${className}`}
    >
      {failedToLoad && (
        <span className="absolute inset-0 grid place-items-center font-super-pandora text-sm text-current/60">
          Codi
        </span>
      )}
    </div>
  );
}
