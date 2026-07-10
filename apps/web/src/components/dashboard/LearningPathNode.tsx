'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Lock, Play } from 'lucide-react';

interface StageData {
  id: number;
  name: string;
  status: 'completed' | 'available' | 'locked';
  courseId?: string;
}

const statusColors = {
  completed: { bg: '#58CC02', stroke: '#58CC02', glow: 'rgba(88, 204, 2, 0.3)' },
  available: { bg: '#00A3FF', stroke: '#00A3FF', glow: 'rgba(0, 163, 255, 0.3)' },
  locked: { bg: '#CBD5E1', stroke: '#94A3B8', glow: 'rgba(148, 163, 184, 0.2)' },
} as const;

function NodeInner({
  stage,
  colors,
  Icon,
}: {
  stage: StageData;
  colors: { bg: string; stroke: string; glow: string };
  Icon: React.ElementType;
}) {
  return (
    <motion.div
      className="group relative flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
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
        <span className="md:hidden">{stage.id}. {stage.name.split(' ').slice(0, 2).join(' ')}</span>
      </div>

      <div
        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold shadow-xs"
        style={{ color: colors.bg }}
      >
        {stage.id}
      </div>
    </motion.div>
  );
}

export function Node({
  stage,
  position,
  index,
}: {
  stage: StageData;
  position: { x: number; y: number };
  index: number;
}) {
  const colors = statusColors[stage.status];
  const Icon = stage.status === 'completed' ? Check : stage.status === 'available' ? Play : Lock;
  const isClickable = stage.status !== 'locked' && !!stage.courseId;

  return (
    <motion.div
      className="absolute"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      initial={{ opacity: 0, scale: 0.5, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06, duration: 0.4, ease: 'easeOut' }}
    >
      {isClickable ? (
        <Link href={`/dashboard/courses/${stage.courseId}`} className="block">
          <NodeInner stage={stage} colors={colors} Icon={Icon} />
        </Link>
      ) : (
        <NodeInner stage={stage} colors={colors} Icon={Icon} />
      )}
    </motion.div>
  );
}

export function MapLegend() {
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
