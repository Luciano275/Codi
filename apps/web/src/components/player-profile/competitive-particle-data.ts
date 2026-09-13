export type CompetitiveParticleShape = 'dot' | 'diamond' | 'ribbon';

interface CompetitiveParticle {
  left: string;
  top: string;
  size: string;
  delay: string;
  duration: string;
  color: string;
  shape: CompetitiveParticleShape;
}

const particleData = [
  ['5%', '14%', '0.55rem', '-1.2s', '3.8s', '#fff4b5', 'diamond'],
  ['92%', '12%', '0.5rem', '-2.6s', '4.4s', '#ffffff', 'dot'],
  ['13%', '76%', '0.42rem', '-0.8s', '3.4s', '#ffd6e5', 'dot'],
  ['85%', '80%', '0.65rem', '-1.8s', '4.7s', '#fff4b5', 'diamond'],
  ['30%', '8%', '1.2rem', '-2.1s', '5.2s', '#ffffff', 'ribbon'],
  ['69%', '9%', '0.46rem', '-0.4s', '3.7s', '#ffd6e5', 'dot'],
  ['4%', '48%', '0.75rem', '-3.1s', '4.1s', '#ffffff', 'diamond'],
  ['96%', '52%', '0.55rem', '-1.6s', '3.5s', '#fff4b5', 'dot'],
  ['19%', '32%', '0.55rem', '-2.3s', '4.8s', '#ffd6e5', 'diamond'],
  ['77%', '30%', '1.05rem', '-0.9s', '5.3s', '#ffffff', 'ribbon'],
  ['41%', '18%', '0.45rem', '-2.8s', '3.9s', '#fff4b5', 'dot'],
  ['59%', '83%', '0.65rem', '-1.1s', '4.5s', '#ffd6e5', 'diamond'],
  ['9%', '91%', '1rem', '-3.4s', '5.5s', '#ffffff', 'ribbon'],
  ['91%', '91%', '0.42rem', '-0.3s', '3.6s', '#fff4b5', 'dot'],
  ['25%', '60%', '0.52rem', '-2.5s', '4.2s', '#ffffff', 'diamond'],
  ['73%', '63%', '0.56rem', '-1.5s', '3.8s', '#ffd6e5', 'dot'],
  ['48%', '6%', '0.6rem', '-3s', '4.6s', '#fff4b5', 'diamond'],
  ['51%', '94%', '1.1rem', '-0.6s', '5s', '#ffffff', 'ribbon'],
  ['35%', '88%', '0.45rem', '-2.7s', '3.5s', '#ffd6e5', 'dot'],
  ['65%', '43%', '0.7rem', '-1.9s', '4.3s', '#fff4b5', 'diamond'],
  ['17%', '51%', '0.42rem', '-0.5s', '3.9s', '#ffffff', 'dot'],
  ['83%', '48%', '0.98rem', '-3.3s', '5.1s', '#ffd6e5', 'ribbon'],
  ['56%', '28%', '0.48rem', '-1.4s', '4.4s', '#fff4b5', 'dot'],
  ['44%', '74%', '0.63rem', '-2.4s', '3.7s', '#ffffff', 'diamond'],
  ['28%', '42%', '0.44rem', '-0.7s', '4.1s', '#ffd6e5', 'dot'],
  ['71%', '73%', '0.6rem', '-3.2s', '4.9s', '#fff4b5', 'diamond'],
  ['38%', '49%', '0.94rem', '-1.7s', '5.4s', '#ffffff', 'ribbon'],
  ['62%', '55%', '0.46rem', '-2.9s', '3.6s', '#ffd6e5', 'dot'],
] as const satisfies readonly (readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  CompetitiveParticleShape,
])[];

export const competitiveParticles: CompetitiveParticle[] = particleData.map(
  ([left, top, size, delay, duration, color, shape]) => ({
    left,
    top,
    size,
    delay,
    duration,
    color,
    shape,
  }),
);
