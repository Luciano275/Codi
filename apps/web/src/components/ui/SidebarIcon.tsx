export type IconName =
  | 'map' | 'code' | 'trophy' | 'flask' | 'chart'
  | 'calendar' | 'badge' | 'gear' | 'shield';

interface SidebarIconProps {
  name: IconName;
  active?: boolean;
}

const gradients: Record<IconName, string> = {
  map: 'from-pradera-400 to-pradera-600',
  code: 'from-lagos-400 to-lagos-600',
  trophy: 'from-castillo-400 to-castillo-600',
  flask: 'from-valle-400 to-valle-600',
  chart: 'from-bosque-400 to-bosque-600',
  calendar: 'from-desierto-400 to-desierto-600',
  badge: 'from-pradera-400 to-pradera-600',
  gear: 'from-slate-400 to-slate-600',
  shield: 'from-montana-400 to-montana-600',
};

const inactiveGradients: Record<IconName, string> = {
  map: 'from-gray-100 to-gray-200',
  code: 'from-gray-100 to-gray-200',
  trophy: 'from-gray-100 to-gray-200',
  flask: 'from-gray-100 to-gray-200',
  chart: 'from-gray-100 to-gray-200',
  calendar: 'from-gray-100 to-gray-200',
  badge: 'from-gray-100 to-gray-200',
  gear: 'from-gray-100 to-gray-200',
  shield: 'from-gray-100 to-gray-200',
};

const paths: Record<IconName, string> = {
  map: 'M4 20c2-5 6-8 8-8s4 2 6 0c2-2 0-7 0-7',
  code: 'M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14',
  trophy: 'M8 5h8v4a4 4 0 01-8 0V5zM6 5h12M7 17h10',
  flask: 'M9 4v5l-4 10h10l-4-10V4M9 4h4',
  chart: 'M7 15v-2M12 15V8M17 15v-5',
  calendar: 'M8 6V4m8 2V4M6 9h12M9 13l1.5 1.5L15 11',
  badge: 'M12 5l1.5 4.5H18l-3.5 3 1.5 5L12 14l-4 3.5 1.5-5L6 9.5h4.5z',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6z',
  shield: 'M12 5l-5 2v4c0 3.5 2.5 6.5 5 7 2.5-.5 5-3.5 5-7V7l-5-2z',
};

const whiteStrokes: Record<IconName, { d: string; closed?: boolean }[]> = {
  map: [
    { d: 'M3 20c3-6 8-10 10-10s4 3 6 1 2-6 2-6' },
  ],
  code: [
    { d: 'M7 8l-4 4 4 4' },
    { d: 'M17 8l4 4-4 4' },
    { d: 'M14 6l-4 12' },
  ],
  trophy: [
    { d: 'M8 5v4a4 4 0 008 0V5' },
    { d: 'M6 5h12' },
    { d: 'M7 17h10' },
    { d: 'M12 17v2' },
  ],
  flask: [
    { d: 'M9 4v4l-5 12h10l-5-12V4' },
    { d: 'M9 4h4' },
    { d: 'M7 14h8' },
  ],
  chart: [
    { d: 'M7 16v-4' },
    { d: 'M12 16V7' },
    { d: 'M17 16v-6' },
  ],
  calendar: [
    { d: 'M8 6V4' },
    { d: 'M16 6V4' },
    { d: 'M6 10h12' },
    { d: 'M10 14l1 1 3-3' },
  ],
  badge: [
    { d: 'M12 4l1.8 5.5H19l-4.6 3.5 1.7 5.5L12 15l-4.1 3.5 1.7-5.5L5 9.5h5.2z' },
  ],
  gear: [
    { d: 'M12 15a3 3 0 100-6 3 3 0 000 6z' },
    { d: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' },
  ],
  shield: [
    { d: 'M12 5l-6 3v4c0 3.5 2.5 6.5 6 7 3.5-.5 6-3.5 6-7V8l-6-3z' },
    { d: 'M9 12l2 2 4-4' },
  ],
};

export default function SidebarIcon({ name, active }: SidebarIconProps) {
  const gradClass = active ? gradients[name] : inactiveGradients[name];
  const iconColor = active ? 'text-white' : 'text-gray-400';
  const mainPath = paths[name] ? (
    <path d={paths[name]} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  ) : null;

  const strokes = whiteStrokes[name];

  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${gradClass} shadow-xs transition-all duration-300`}>
      <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${iconColor}`} aria-hidden>
        {mainPath}
        {strokes?.map((s, i) => (
          <path key={i} d={s.d} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ))}
      </svg>
    </div>
  );
}
