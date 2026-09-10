export type IconName =
  | 'map'
  | 'code'
  | 'trophy'
  | 'flask'
  | 'podium'
  | 'calendar'
  | 'graduationCap'
  | 'gear'
  | 'shield'
  | 'store'
  | 'palmTree';

interface SidebarIconProps {
  name: IconName;
  active?: boolean;
}

const gradients: Record<IconName, string> = {
  map: 'from-pradera-400 to-pradera-600',
  code: 'from-lagos-400 to-lagos-600',
  trophy: 'from-castillo-400 to-castillo-600',
  flask: 'from-valle-400 to-valle-600',
  podium: 'from-bosque-400 to-bosque-600',
  calendar: 'from-desierto-400 to-desierto-600',
  graduationCap: 'from-pradera-400 to-pradera-600',
  gear: 'from-slate-400 to-slate-600',
  shield: 'from-montana-400 to-montana-600',
  store: 'from-valle-400 to-lagos-600',
  palmTree: 'from-pradera-400 to-pradera-600',
};

const inactiveGradients: Record<IconName, string> = {
  map: 'from-gray-100 to-gray-200',
  code: 'from-gray-100 to-gray-200',
  trophy: 'from-gray-100 to-gray-200',
  flask: 'from-gray-100 to-gray-200',
  podium: 'from-gray-100 to-gray-200',
  calendar: 'from-gray-100 to-gray-200',
  graduationCap: 'from-gray-100 to-gray-200',
  gear: 'from-gray-100 to-gray-200',
  shield: 'from-gray-100 to-gray-200',
  store: 'from-gray-100 to-gray-200',
  palmTree: 'from-gray-100 to-gray-200',
};

const paths: Record<IconName, string> = {
  map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6zM9 3v15M15 6v15',
  code: 'M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14',
  trophy:
    'M8 5h8v4a4 4 0 01-8 0V5zM8 7H5v2a4 4 0 004 4M16 7h3v2a4 4 0 01-4 4M12 13v4M8 19h8M9 17h6',
  flask: 'M9 4v5l-4 10h10l-4-10V4M9 4h4',
  podium: 'M4 19h16M6 17v-5h3v5M10.5 17V7h3v10M15 17v-3h3v3',
  calendar: 'M5 6h14v14H5zM8 4v4M16 4v4M5 10h14M8 14h3M13 14h3M8 17h3',
  graduationCap: 'M3 9l9-4 9 4-9 4-9-4zM7 11v4c2.8 2 7.2 2 10 0v-4M21 9v5',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6z',
  shield: 'M12 5l-5 2v4c0 3.5 2.5 6.5 5 7 2.5-.5 5-3.5 5-7V7l-5-2z',
  store:
    'M4 10h16l-1.5-5h-13L4 10zM5 10v9h14v-9M4 10c0 1.5 1.2 2.5 2.5 2.5S9 11.5 9 10c0 1.5 1.2 2.5 2.5 2.5S14 11.5 14 10c0 1.5 1.2 2.5 2.5 2.5S19 11.5 20 10M10 19v-4h4v4',
  palmTree:
    'M12 20V10M12 11C10 8 7 7 4 8c2-3 5-4 8-1M12 11c2-3 5-4 8-3-2-3-5-4-8-1M12 10c0-3-2-5-5-6 0 3 2 5 5 6M12 10c0-3 2-5 5-6 0 3-2 5-5 6M8 20h8',
};

const whiteStrokes: Record<IconName, { d: string; closed?: boolean }[]> = {
  map: [{ d: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z' }, { d: 'M9 3v15' }, { d: 'M15 6v15' }],
  code: [{ d: 'M7 8l-4 4 4 4' }, { d: 'M17 8l4 4-4 4' }, { d: 'M14 6l-4 12' }],
  trophy: [
    { d: 'M8 5v4a4 4 0 008 0V5' },
    { d: 'M8 7H5v2a4 4 0 004 4' },
    { d: 'M16 7h3v2a4 4 0 01-4 4' },
    { d: 'M12 13v4' },
    { d: 'M8 19h8' },
    { d: 'M9 17h6' },
  ],
  flask: [{ d: 'M9 4v4l-5 12h10l-5-12V4' }, { d: 'M9 4h4' }, { d: 'M7 14h8' }],
  podium: [
    { d: 'M4 19h16' },
    { d: 'M6 17v-5h3v5' },
    { d: 'M10.5 17V7h3v10' },
    { d: 'M15 17v-3h3v3' },
  ],
  calendar: [
    { d: 'M5 6h14v14H5z' },
    { d: 'M8 4v4' },
    { d: 'M16 4v4' },
    { d: 'M5 10h14' },
    { d: 'M8 14h3' },
    { d: 'M13 14h3' },
    { d: 'M8 17h3' },
  ],
  graduationCap: [
    { d: 'M3 9l9-4 9 4-9 4-9-4z' },
    { d: 'M7 11v4c2.8 2 7.2 2 10 0v-4' },
    { d: 'M21 9v5' },
  ],
  gear: [
    { d: 'M12 15a3 3 0 100-6 3 3 0 000 6z' },
    {
      d: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
    },
  ],
  shield: [
    { d: 'M12 5l-6 3v4c0 3.5 2.5 6.5 6 7 3.5-.5 6-3.5 6-7V8l-6-3z' },
    { d: 'M9 12l2 2 4-4' },
  ],
  store: [
    { d: 'M4 10h16l-1.5-5h-13L4 10z' },
    { d: 'M5 10v9h14v-9' },
    {
      d: 'M4 10c0 1.5 1.2 2.5 2.5 2.5S9 11.5 9 10c0 1.5 1.2 2.5 2.5 2.5S14 11.5 14 10c0 1.5 1.2 2.5 2.5 2.5S19 11.5 20 10',
    },
    { d: 'M10 19v-4h4v4' },
  ],
  palmTree: [
    { d: 'M12 20V10' },
    { d: 'M12 11C10 8 7 7 4 8c2-3 5-4 8-1' },
    { d: 'M12 11c2-3 5-4 8-3-2-3-5-4-8-1' },
    { d: 'M12 10c0-3-2-5-5-6 0 3 2 5 5 6' },
    { d: 'M12 10c0-3 2-5 5-6 0 3-2 5-5 6' },
    { d: 'M8 20h8' },
  ],
};

export default function SidebarIcon({ name, active }: SidebarIconProps) {
  const gradClass = active ? gradients[name] : inactiveGradients[name];
  const iconColor = active ? 'text-white' : 'text-gray-400';
  const mainPath = paths[name] ? (
    <path
      d={paths[name]}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ) : null;

  const strokes = whiteStrokes[name];

  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${gradClass} shadow-xs transition-all duration-300`}
    >
      <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${iconColor}`} aria-hidden>
        {mainPath}
        {strokes?.map((s, i) => (
          <path
            key={i}
            d={s.d}
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </svg>
    </div>
  );
}
