import type { CSSProperties } from 'react';
import styles from './ranking.module.css';

type PodiumRank = 1 | 2 | 3;

interface ParticleDefinition {
  x: string;
  y: string;
  size: string;
  duration: string;
  delay: string;
  driftX: string;
  driftY: string;
  opacity: number;
  sparkle?: boolean;
}

const particlesByRank: Record<PodiumRank, ParticleDefinition[]> = {
  1: [
    {
      x: '12%',
      y: '24%',
      size: '5px',
      duration: '5.8s',
      delay: '-1.8s',
      driftX: '13px',
      driftY: '-25px',
      opacity: 0.62,
    },
    {
      x: '25%',
      y: '72%',
      size: '4px',
      duration: '6.4s',
      delay: '-3.5s',
      driftX: '-9px',
      driftY: '-30px',
      opacity: 0.5,
    },
    {
      x: '72%',
      y: '22%',
      size: '6px',
      duration: '5.2s',
      delay: '-2.2s',
      driftX: '-12px',
      driftY: '24px',
      opacity: 0.58,
      sparkle: true,
    },
    {
      x: '85%',
      y: '50%',
      size: '4px',
      duration: '6.8s',
      delay: '-4.7s',
      driftX: '8px',
      driftY: '-22px',
      opacity: 0.45,
    },
    {
      x: '64%',
      y: '78%',
      size: '5px',
      duration: '5.6s',
      delay: '-0.8s',
      driftX: '14px',
      driftY: '-18px',
      opacity: 0.6,
    },
    {
      x: '39%',
      y: '15%',
      size: '3px',
      duration: '7.1s',
      delay: '-5.1s',
      driftX: '-12px',
      driftY: '18px',
      opacity: 0.42,
    },
    {
      x: '13%',
      y: '49%',
      size: '4px',
      duration: '6s',
      delay: '-2.9s',
      driftX: '11px',
      driftY: '17px',
      opacity: 0.48,
      sparkle: true,
    },
    {
      x: '80%',
      y: '83%',
      size: '3px',
      duration: '7.4s',
      delay: '-1.3s',
      driftX: '-10px',
      driftY: '-19px',
      opacity: 0.4,
    },
  ],
  2: [
    {
      x: '16%',
      y: '30%',
      size: '4px',
      duration: '7.2s',
      delay: '-2.4s',
      driftX: '9px',
      driftY: '-20px',
      opacity: 0.46,
    },
    {
      x: '73%',
      y: '22%',
      size: '5px',
      duration: '6.5s',
      delay: '-4.1s',
      driftX: '-11px',
      driftY: '18px',
      opacity: 0.48,
      sparkle: true,
    },
    {
      x: '81%',
      y: '64%',
      size: '3px',
      duration: '7.8s',
      delay: '-1.1s',
      driftX: '7px',
      driftY: '-22px',
      opacity: 0.38,
    },
    {
      x: '31%',
      y: '76%',
      size: '4px',
      duration: '6.9s',
      delay: '-5.5s',
      driftX: '-9px',
      driftY: '-18px',
      opacity: 0.42,
    },
    {
      x: '52%',
      y: '18%',
      size: '3px',
      duration: '8.1s',
      delay: '-3.2s',
      driftX: '8px',
      driftY: '16px',
      opacity: 0.35,
    },
    {
      x: '12%',
      y: '58%',
      size: '3px',
      duration: '7.5s',
      delay: '-6.3s',
      driftX: '10px',
      driftY: '13px',
      opacity: 0.35,
    },
  ],
  3: [
    {
      x: '17%',
      y: '34%',
      size: '4px',
      duration: '7.8s',
      delay: '-2.8s',
      driftX: '8px',
      driftY: '-18px',
      opacity: 0.43,
    },
    {
      x: '76%',
      y: '29%',
      size: '4px',
      duration: '7.1s',
      delay: '-4.6s',
      driftX: '-9px',
      driftY: '16px',
      opacity: 0.46,
      sparkle: true,
    },
    {
      x: '69%',
      y: '76%',
      size: '3px',
      duration: '8.4s',
      delay: '-1.5s',
      driftX: '10px',
      driftY: '-17px',
      opacity: 0.36,
    },
    {
      x: '27%',
      y: '72%',
      size: '3px',
      duration: '8s',
      delay: '-5.7s',
      driftX: '-7px',
      driftY: '-15px',
      opacity: 0.34,
    },
  ],
};

interface PodiumParticlesProps {
  rank: PodiumRank;
  reduceDensity: boolean;
}

export function PodiumParticles({ rank, reduceDensity }: PodiumParticlesProps) {
  return (
    <span
      className={`${styles.particleField} ${styles[`particleFieldRank${rank}`]} ${
        reduceDensity ? styles.reducedParticleDensity : ''
      }`}
      aria-hidden="true"
    >
      {particlesByRank[rank].map((particle, index) => (
        <span
          key={index}
          className={`${styles.particle} ${particle.sparkle ? styles.particleSparkle : ''}`}
          style={
            {
              '--particle-x': particle.x,
              '--particle-y': particle.y,
              '--particle-size': particle.size,
              '--particle-duration': particle.duration,
              '--particle-delay': particle.delay,
              '--particle-drift-x': particle.driftX,
              '--particle-drift-y': particle.driftY,
              '--particle-opacity': particle.opacity,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
