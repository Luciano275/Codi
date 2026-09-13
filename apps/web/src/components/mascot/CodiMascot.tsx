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
  const animationRef = useRef(animation);
  const loopAfterRef = useRef(loopAfter);
  const playAnimationRef = useRef<(() => void) | null>(null);
  const [failedToLoad, setFailedToLoad] = useState(false);

  useEffect(() => {
    animationRef.current = animation;
    loopAfterRef.current = loopAfter;
    playAnimationRef.current?.();
  }, [animation, loopAfter]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId = 0;
    let disposed = false;
    let visible = true;
    let mixer: THREE.AnimationMixer | null = null;
    let model: THREE.Object3D | null = null;
    let clips: THREE.AnimationClip[] = [];
    let activeAction: THREE.AnimationAction | null = null;
    let finishedHandler: THREE.EventListener<
      THREE.AnimationMixerEventMap['finished'],
      'finished',
      THREE.AnimationMixer
    > | null = null;
    const timer = new THREE.Timer();
    timer.connect(document);
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
        if (visible) timer.reset();
      },
      { threshold: 0.01 },
    );
    visibilityObserver.observe(container);

    const playAnimation = () => {
      if (!mixer || clips.length === 0) return;

      if (finishedHandler) mixer.removeEventListener('finished', finishedHandler);
      finishedHandler = null;
      const nextClip = THREE.AnimationClip.findByName(clips, animationRef.current);
      if (!nextClip) return;

      const previousAction = activeAction;
      const nextAction = mixer.clipAction(nextClip);
      const loopClip = loopAfterRef.current
        ? THREE.AnimationClip.findByName(clips, loopAfterRef.current)
        : null;
      const transitionDuration = previousAction ? 0.14 : 0;

      previousAction?.fadeOut(transitionDuration);
      nextAction.reset().setEffectiveWeight(1).fadeIn(transitionDuration);
      activeAction = nextAction;

      if (loopClip && !reducedMotion) {
        const loopAction = mixer.clipAction(loopClip);
        nextAction.setLoop(THREE.LoopOnce, 1);
        nextAction.clampWhenFinished = true;
        finishedHandler = (event) => {
          if (event.action !== nextAction) return;
          loopAction.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.18).play();
          nextAction.fadeOut(0.18);
          mixer?.removeEventListener('finished', finishedHandler!);
          finishedHandler = null;
          activeAction = loopAction;
        };
        mixer.addEventListener('finished', finishedHandler);
      } else {
        nextAction.setLoop(THREE.LoopRepeat, Infinity);
      }

      nextAction.play();
      if (reducedMotion) mixer.setTime(0);
    };
    playAnimationRef.current = playAnimation;

    new GLTFLoader().load(
      '/anims/Codi.glb',
      (gltf) => {
        if (disposed) {
          disposeModel(gltf.scene);
          return;
        }

        model = gltf.scene;
        clips = gltf.animations;
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const largestDimension = Math.max(size.x, size.y, size.z);
        model.scale.setScalar(3.25 / largestDimension);

        const centeredBounds = new THREE.Box3().setFromObject(model);
        const center = centeredBounds.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.position.y += 0.08;
        scene.add(model);

        mixer = new THREE.AnimationMixer(model);
        playAnimation();
      },
      undefined,
      () => {
        if (!disposed) setFailedToLoad(true);
      },
    );

    const render = () => {
      if (!disposed) {
        if (visible) {
          timer.update();
          if (!reducedMotion) mixer?.update(timer.getDelta());
          renderer.render(scene, camera);
        }
        frameId = window.requestAnimationFrame(render);
      }
    };
    render();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      playAnimationRef.current = null;
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      timer.dispose();
      if (mixer && finishedHandler) mixer.removeEventListener('finished', finishedHandler);
      if (mixer) mixer.stopAllAction();
      if (mixer && model) mixer.uncacheRoot(model);
      if (model) disposeModel(model);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

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
