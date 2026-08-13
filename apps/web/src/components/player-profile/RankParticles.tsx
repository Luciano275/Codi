import type { CSSProperties } from 'react';
import styles from './competitive-player.module.css';

const rankParticleColors = {
  1: '#f7d44a',
  2: '#cbd5e1',
  3: '#c47b2b',
} as const;

type ParticleStyle = CSSProperties & Record<`--particle-${string}`, string>;

interface RankParticlesProps {
  rank: number;
}

export function RankParticles({ rank }: RankParticlesProps) {
  const color = rankParticleColors[rank as keyof typeof rankParticleColors];
  if (!color) return null;

  return (
    <div aria-hidden className={styles.particleField}>
      {Array.from({ length: 22 }, (_, index) => {
        const particleStyle: ParticleStyle = {
          '--particle-color': color,
          '--particle-delay': `${(index % 8) * -0.7}s`,
          '--particle-duration': `${4 + (index % 5) * 0.7}s`,
          '--particle-left': `${(index * 29) % 100}%`,
          '--particle-size': `${4 + (index % 4) * 2}px`,
        };
        return <span key={index} className={styles.particle} style={particleStyle} />;
      })}
    </div>
  );
}
