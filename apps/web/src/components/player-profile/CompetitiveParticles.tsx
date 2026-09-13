import type { CSSProperties } from 'react';
import { competitiveParticles } from './competitive-particle-data';
import styles from './competitive-player.module.css';

function visibleParticleCount(rank: number) {
  if (rank === 1) return 28;
  if (rank === 2) return 24;
  if (rank === 3) return 20;
  return 8;
}

export function CompetitiveParticles({ rank }: { rank: number | null }) {
  if (rank === null) return null;

  const isPodium = rank <= 3;

  return (
    <div
      aria-hidden="true"
      className={`${styles.particleField} ${isPodium ? styles.podiumParticleField : styles.rankedParticleField}`}
    >
      {competitiveParticles.slice(0, visibleParticleCount(rank)).map((particle, index) => (
        <i
          key={index}
          className={`${styles.particle} ${styles[particle.shape]}`}
          style={
            {
              '--particle-left': particle.left,
              '--particle-top': particle.top,
              '--particle-size': particle.size,
              '--particle-delay': particle.delay,
              '--particle-duration': particle.duration,
              '--particle-color': particle.color,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
