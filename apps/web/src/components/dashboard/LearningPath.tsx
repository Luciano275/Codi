'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, Lock, Play } from 'lucide-react';
import horizontalMap from '@/assets/horizontal_map.png';
import verticalMap from '@/assets/vertical_map.png';

export interface StageData {
  id: number;
  name: string;
  status: 'completed' | 'available' | 'locked';
  courseId?: string;
}

interface LearningPathProps {
  stages: StageData[];
}

const statusColors = {
  completed: {
    bg: '#58CC02',
    stroke: '#58CC02',
    glow: 'rgba(88, 204, 2, 0.3)',
  },
  available: {
    bg: '#00A3FF',
    stroke: '#00A3FF',
    glow: 'rgba(0, 163, 255, 0.3)',
  },
  locked: {
    bg: '#CBD5E1',
    stroke: '#94A3B8',
    glow: 'rgba(148, 163, 184, 0.2)',
  },
} as const;

const desktopPositions = [
  { x: 5, y: 50 },
  { x: 30, y: 38 },
  { x: 45, y: 28 },
  { x: 58, y: 38 },
  { x: 70, y: 50 },
  { x: 58, y: 62 },
  { x: 45, y: 72 },
  { x: 30, y: 62 },
  { x: 45, y: 88 },
  { x: 70, y: 88 },
];

const mobilePositions = [
  { x: 50, y: 92 },
  { x: 30, y: 82 },
  { x: 50, y: 72 },
  { x: 70, y: 62 },
  { x: 50, y: 52 },
  { x: 30, y: 42 },
  { x: 50, y: 32 },
  { x: 70, y: 22 },
  { x: 50, y: 12 },
  { x: 50, y: 3 },
];

function buildPath(positions: { x: number; y: number }[], stageIds: number[]) {
  return stageIds
    .map((id, i) => {
      const pos = positions[id - 1];
      if (i === 0) return `M ${pos.x} ${pos.y}`;
      const prev = positions[stageIds[i - 1] - 1];
      const cx = (prev.x + pos.x) / 2;
      return `C ${cx} ${prev.y}, ${cx} ${pos.y}, ${pos.x} ${pos.y}`;
    })
    .join(' ');
}

function buildLockedPath(positions: { x: number; y: number }[], fromIdx: number) {
  const ids = [];
  for (let i = fromIdx; i < positions.length; i++) {
    ids.push(i + 1);
  }
  return buildPath(positions, ids);
}

function Node({
  stage,
  position,
  index,
  router,
}: {
  stage: StageData;
  position: { x: number; y: number };
  index: number;
  router: ReturnType<typeof useRouter>;
}) {
  const colors = statusColors[stage.status];
  const Icon = stage.status === 'completed' ? Check : stage.status === 'available' ? Play : Lock;

  return (
    <motion.div
      className="absolute"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      initial={{ opacity: 0, scale: 0.5, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06, duration: 0.4, ease: 'easeOut' }}
    >
      <motion.div
        className="group relative flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
        onClick={() => {
          if (stage.status !== 'locked' && stage.courseId) {
            router.push(`/dashboard/courses/${stage.courseId}`);
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && stage.status !== 'locked' && stage.courseId) {
            e.preventDefault();
            router.push(`/dashboard/courses/${stage.courseId}`);
          }
        }}
        role="button"
        tabIndex={stage.status !== 'locked' ? 0 : -1}
        animate={
          stage.status === 'available'
            ? { boxShadow: [`0 0 0 0 ${colors.glow}`, `0 0 0 10px ${colors.glow}`, `0 0 0 0 ${colors.glow}`] }
            : {}
        }
        transition={stage.status === 'available' ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : {}}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg md:h-12 md:w-12"
          style={{ backgroundColor: colors.bg }}
        >
          <Icon className={`h-4 w-4 md:h-5 md:w-5 ${stage.status === 'locked' ? 'text-slate-500' : 'text-white'}`} />
        </div>

        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white opacity-0 shadow-xs transition-all duration-200 group-hover:opacity-100 md:text-xs"
          style={{ backgroundColor: colors.bg }}
        >
          <span className="hidden md:inline">{stage.name}</span>
          <span className="md:hidden">
            {stage.id}. {stage.name.split(' ').slice(0, 2).join(' ')}
          </span>
        </div>

        <div
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold shadow-xs"
          style={{ color: colors.bg }}
        >
          {stage.id}
        </div>
      </motion.div>
    </motion.div>
  );
}

function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 flex items-center gap-4 rounded-xl bg-white/80 px-3 py-1.5 shadow-xs backdrop-blur-sm">
      {(['completed', 'available', 'locked'] as const).map((status) => (
        <div key={status} className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[status].bg }} />
          <span className="font-simply-olive text-[10px] capitalize text-gray-500">
            {status === 'completed' ? 'Completado' : status === 'available' ? 'Disponible' : 'Bloqueado'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function LearningPath({ stages }: LearningPathProps) {
  const router = useRouter();
  const activeStages = stages.filter((s) => s.status !== 'locked');
  const activeStageIds = activeStages.map((s) => s.id);

  const desktopPath = buildPath(desktopPositions, activeStageIds);
  const desktopLockedPath =
    activeStages.length > 0 && activeStages.length < stages.length
      ? buildLockedPath(desktopPositions, activeStages.length + 1)
      : '';

  const mobilePath = buildPath(mobilePositions, activeStageIds);
  const mobileLockedPath =
    activeStages.length > 0 && activeStages.length < stages.length
      ? buildLockedPath(mobilePositions, activeStages.length + 1)
      : '';

  return (
    <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl">
      {/* ── Desktop ── */}
      <div className="relative hidden aspect-[16/9] w-full md:block">
        <Image src={horizontalMap} alt="Mapa de ruta de aprendizaje" fill priority className="object-contain" sizes="100vw" />

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {desktopPath && (
            <path d={desktopPath} stroke="#58CC02" strokeWidth="0.6" fill="none" strokeLinecap="round" strokeDasharray="2 1.5" opacity="0.5" />
          )}
          {desktopLockedPath && (
            <path d={desktopLockedPath} stroke="#CBD5E1" strokeWidth="0.6" fill="none" strokeLinecap="round" strokeDasharray="1.5 2" opacity="0.5" />
          )}
        </svg>

        {stages.map((stage, i) => (
          <Node key={stage.id} stage={stage} position={desktopPositions[stage.id - 1] || { x: 50, y: 50 }} index={i} router={router} />
        ))}

        <MapLegend />
      </div>

      {/* ── Mobile ── */}
      <div className="relative w-full md:hidden">
        <div className="relative">
          <Image src={verticalMap} alt="Mapa de ruta de aprendizaje" priority className="h-auto w-full" sizes="100vw" />

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {mobilePath && (
              <path d={mobilePath} stroke="#58CC02" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeDasharray="2 1.5" opacity="0.5" />
            )}
            {mobileLockedPath && (
              <path d={mobileLockedPath} stroke="#CBD5E1" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeDasharray="1.5 2" opacity="0.5" />
            )}
          </svg>

          {stages.map((stage, i) => (
            <Node key={stage.id} stage={stage} position={mobilePositions[stage.id - 1] || { x: 50, y: 50 }} index={i} router={router} />
          ))}
        </div>

        <MapLegend />
      </div>
    </div>
  );
}
