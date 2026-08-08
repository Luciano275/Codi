'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface ParticlesProps {
  reducedMotion: boolean;
}

interface Particle {
  id: number;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
  x: number;
  y: number;
  kind: 'orb' | 'spark' | 'ray';
}

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, id) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 105 + Math.random() * 230;

    return {
      id,
      delay: 0.28 + Math.random() * 0.35,
      duration: 0.75 + Math.random() * 0.65,
      rotation: -150 + Math.random() * 300,
      size: 2 + Math.random() * 6,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance * 0.62,
      kind: id % 5 === 0 ? 'ray' : id % 3 === 0 ? 'spark' : 'orb',
    };
  });
}

export function Particles({ reducedMotion }: ParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(createParticles(reducedMotion ? 5 : 22));
  }, [reducedMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {particles.map((particle) => {
        const isRay = particle.kind === 'ray';
        const borderRadius = particle.kind === 'orb' ? '9999px' : '2px';

        return (
          <motion.span
            key={particle.id}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
            animate={
              reducedMotion
                ? { opacity: [0, 0.75, 0], scale: [0, 1, 0.8] }
                : {
                    opacity: [0, 1, 0.9, 0],
                    scale: [0, 1.35, 1, 0.45],
                    x: [0, particle.x * 0.7, particle.x],
                    y: [0, particle.y * 0.7, particle.y],
                    rotate: [0, particle.rotation],
                  }
            }
            transition={{
              duration: reducedMotion ? 0.55 : particle.duration,
              delay: reducedMotion ? 0.12 + particle.id * 0.04 : particle.delay,
              ease: 'easeOut',
            }}
            style={{
              width: isRay ? particle.size * 7 : particle.size,
              height: isRay ? 1.5 : particle.size,
              borderRadius,
            }}
            className="absolute left-1/2 top-1/2 bg-amber-100 shadow-[0_0_12px_rgba(255,224,128,0.95)] will-change-transform"
          />
        );
      })}
    </div>
  );
}
