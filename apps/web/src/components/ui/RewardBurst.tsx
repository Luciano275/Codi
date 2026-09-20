'use client';

import { motion } from 'motion/react';

type RewardKind = 'xp' | 'gems';

interface RewardBurstProps {
  kind: RewardKind;
  reducedMotion: boolean | null;
}

const PARTICLES = [
  { x: -142, y: -78, rotation: -108, delay: 0.13, size: 'h-2 w-2' },
  { x: -116, y: 34, rotation: -48, delay: 0.19, size: 'h-3 w-3' },
  { x: -54, y: -124, rotation: -68, delay: 0.09, size: 'h-2 w-2' },
  { x: 54, y: -124, rotation: 68, delay: 0.16, size: 'h-3 w-3' },
  { x: 124, y: -55, rotation: 96, delay: 0.12, size: 'h-2 w-2' },
  { x: 140, y: 36, rotation: 144, delay: 0.22, size: 'h-2.5 w-2.5' },
  { x: 80, y: 112, rotation: 192, delay: 0.2, size: 'h-2 w-2' },
  { x: -86, y: 110, rotation: -160, delay: 0.15, size: 'h-3 w-3' },
];

const RAY_ROTATIONS = [-72, -24, 24, 72, 120, 168, 216];

const BURST_COLORS: Record<RewardKind, { particle: string; ring: string; ray: string }> = {
  xp: {
    particle: 'bg-castillo-300 shadow-[0_0_12px_rgba(247,212,74,0.9)]',
    ring: 'border-castillo-300/70 bg-castillo-200/20',
    ray: 'from-castillo-200/0 via-castillo-200/85 to-desierto-400/0',
  },
  gems: {
    particle: 'bg-valle-200 shadow-[0_0_12px_rgba(77,230,233,0.9)]',
    ring: 'border-valle-200/80 bg-lagos-200/20',
    ray: 'from-valle-100/0 via-valle-100/90 to-lagos-400/0',
  },
};

export function RewardBurst({ kind, reducedMotion }: RewardBurstProps) {
  const colors = BURST_COLORS[kind];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
      <motion.div
        initial={{ opacity: 0, scale: 0.2 }}
        animate={
          reducedMotion
            ? { opacity: 0.55, scale: 1 }
            : { opacity: [0, 0.8, 0], scale: [0.2, 1.45, 1.9] }
        }
        transition={{ duration: reducedMotion ? 0.01 : 0.9, delay: 0.12, ease: 'easeOut' }}
        className={`absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border ${colors.ring}`}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.2 }}
        animate={
          reducedMotion
            ? { opacity: 0.35, scale: 1 }
            : { opacity: [0, 0.6, 0], scale: [0.2, 1.1, 1.45] }
        }
        transition={{ duration: reducedMotion ? 0.01 : 0.72, delay: 0.18, ease: 'easeOut' }}
        className={`absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border ${colors.ring}`}
      />

      {RAY_ROTATIONS.map((rotation, index) => (
        <div
          key={rotation}
          style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
          className="absolute left-1/2 top-1/2 w-44 origin-left"
        >
          <motion.div
            initial={{ opacity: 0, scaleX: 0.25 }}
            animate={
              reducedMotion
                ? { opacity: 0.45, scaleX: 1 }
                : { opacity: [0, 0.9, 0], scaleX: [0.25, 1.1, 1.45] }
            }
            transition={{
              duration: reducedMotion ? 0.01 : 0.68,
              delay: 0.08 + index * 0.035,
              ease: 'easeOut',
            }}
            className={`h-1.5 w-full origin-left rounded-full bg-gradient-to-r ${colors.ray}`}
          />
        </div>
      ))}

      {PARTICLES.map((particle, index) => (
        <motion.span
          key={`${particle.x}-${particle.y}`}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
          animate={
            reducedMotion
              ? {
                  opacity: 0.8,
                  scale: 1,
                  x: particle.x * 0.55,
                  y: particle.y * 0.55,
                  rotate: particle.rotation,
                }
              : {
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.3, 0.9, 0],
                  x: [0, particle.x * 0.72, particle.x],
                  y: [0, particle.y * 0.62, particle.y],
                  rotate: [0, particle.rotation * 0.6, particle.rotation],
                }
          }
          transition={{
            duration: reducedMotion ? 0.01 : 1.05,
            delay: particle.delay + index * 0.02,
            ease: 'easeOut',
          }}
          className={`absolute left-1/2 top-1/2 rounded-sm ${particle.size} ${colors.particle}`}
        />
      ))}
    </div>
  );
}
