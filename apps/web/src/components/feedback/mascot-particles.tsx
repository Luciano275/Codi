'use client';

import { motion } from 'motion/react';

const PARTICLES = [
  { x: -118, y: -62, delay: 0, rotate: -35, color: 'bg-[#ffc857]' },
  { x: -76, y: -118, delay: 0.05, rotate: 24, color: 'bg-[#ff7b6b]' },
  { x: 2, y: -142, delay: 0.1, rotate: -18, color: 'bg-[#24c9b4]' },
  { x: 82, y: -112, delay: 0.03, rotate: 38, color: 'bg-[#ffc857]' },
  { x: 126, y: -42, delay: 0.08, rotate: 52, color: 'bg-[#ff7b6b]' },
  { x: 86, y: 32, delay: 0.13, rotate: 16, color: 'bg-[#24c9b4]' },
] as const;

interface MascotParticlesProps {
  reducedMotion: boolean;
}

export function MascotParticles({ reducedMotion }: MascotParticlesProps) {
  if (reducedMotion) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {PARTICLES.map((particle, index) => (
        <motion.span
          key={`${particle.x}-${particle.y}`}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, particle.x * 0.65, particle.x],
            y: [0, particle.y * 0.65, particle.y],
            scale: [0, 1.1, 1, 0],
            rotate: particle.rotate,
          }}
          transition={{
            duration: 0.72 + (index % 3) * 0.1,
            delay: 0.35 + particle.delay,
            ease: 'easeOut',
          }}
          className={`absolute left-1/2 top-1/2 block h-3 w-3 rounded-[3px] border-2 border-[#17324d] ${particle.color}`}
        />
      ))}
    </div>
  );
}
