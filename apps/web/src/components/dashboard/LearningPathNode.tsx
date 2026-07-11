'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Play, Lock } from 'lucide-react';

interface StageData {
  id: number;
  name: string;
  status: 'completed' | 'available' | 'locked';
  courseId?: string;
}

const nodeStyles = {
  completed: {
    bg: 'from-pradera-400 to-pradera-600',
    border: 'border-pradera-300/50',
    glow: 'rgba(88, 204, 2, 0.35)',
    iconColor: 'text-white',
    shadow: 'shadow-pradera-500/25',
  },
  available: {
    bg: 'from-lagos-400 to-lagos-600',
    border: 'border-lagos-300/50',
    glow: 'rgba(0, 163, 255, 0.35)',
    iconColor: 'text-white',
    shadow: 'shadow-lagos-500/25',
  },
  locked: {
    bg: 'from-slate-300 to-slate-400',
    border: 'border-slate-300/50',
    glow: 'rgba(148, 163, 184, 0.15)',
    iconColor: 'text-white/70',
    shadow: 'shadow-slate-400/10',
  },
} as const;

function NodeIcon({ status }: { status: StageData['status'] }) {
  const size = 'h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 lg:h-5 lg:w-5 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6';
  if (status === 'completed') return <Check className={`${size} drop-shadow-xs`} />;
  if (status === 'available') return <Play className={`${size} drop-shadow-xs ml-0.5`} />;
  return <Lock className={`${size} drop-shadow-xs`} />;
}

function NodeInner({ stage }: { stage: StageData }) {
  const style = nodeStyles[stage.status];

  return (
    <div className="group relative flex flex-col items-center">
      <motion.div
        className={`relative flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br ${style.bg} ${style.border} border-2 shadow-lg ${style.shadow} ${style.iconColor} transition-all duration-300 sm:h-8 sm:w-8 sm:rounded-xl md:h-9 md:w-9 md:rounded-xl lg:h-10 lg:w-10 lg:rounded-xl xl:h-12 xl:w-12 xl:rounded-2xl 2xl:h-14 2xl:w-14 2xl:rounded-2xl`}
        animate={
          stage.status === 'available'
            ? {
                boxShadow: [
                  `0 0 0 0 ${style.glow}`,
                  `0 0 0 8px ${style.glow}`,
                  `0 0 0 0 ${style.glow}`,
                ],
              }
            : {}
        }
        transition={
          stage.status === 'available'
            ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
            : {}
        }
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
      >
        <NodeIcon status={stage.status} />
        <span
          className={`absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full border border-white text-[5px] font-bold text-white shadow-xs sm:h-3.5 sm:w-3.5 sm:text-[6px] md:h-3.5 md:w-3.5 md:text-[6px] lg:h-4 lg:w-4 lg:text-[7px] xl:h-4 xl:w-4 xl:text-[8px] 2xl:h-[18px] 2xl:w-[18px] 2xl:text-[10px] ${
            stage.status === 'completed'
              ? 'bg-pradera-600'
              : stage.status === 'available'
              ? 'bg-lagos-600'
              : 'bg-slate-500'
          }`}
        >
          {stage.id}
        </span>
        <div className="absolute -inset-0.5 rounded-lg bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:-inset-1 sm:rounded-xl md:-inset-1 md:rounded-xl lg:-inset-1 lg:rounded-xl xl:-inset-1.5 xl:rounded-2xl" />
      </motion.div>

      <div
        className={`pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[7px] font-semibold leading-tight text-white shadow-xs opacity-0 transition-all duration-200 group-hover:opacity-100 sm:text-[8px] md:px-2 md:text-[9px] lg:text-[10px] xl:text-[11px] ${
          stage.status === 'completed'
            ? 'bg-pradera-500'
            : stage.status === 'available'
            ? 'bg-lagos-500'
            : 'bg-slate-400'
        }`}
      >
        {stage.name.length > 20 ? stage.name.slice(0, 18) + '…' : stage.name}
      </div>
    </div>
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
  const isClickable = stage.status !== 'locked' && !!stage.courseId;

  const floatDelay = (index % 5) * 0.6;

  return (
    <motion.div
      className="absolute"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      initial={{ opacity: 0, scale: 0.3, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.05, duration: 0.5, ease: 'easeOut' }}
    >
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{
          duration: 3 + (index % 3),
          repeat: Infinity,
          ease: 'easeInOut',
          delay: floatDelay,
        }}
      >
        {isClickable ? (
          <Link href={`/dashboard/courses/${stage.courseId}`} className="block">
            <NodeInner stage={stage} />
          </Link>
        ) : (
          <NodeInner stage={stage} />
        )}
      </motion.div>
    </motion.div>
  );
}

export function MapLegend() {
  return (
    <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-xl bg-white/90 px-2.5 py-1.5 shadow-xs backdrop-blur-sm md:bottom-3 md:left-3 md:gap-3 md:px-3 md:py-2">
      {([
        { status: 'completed' as const, label: 'Completado', color: 'bg-pradera-500' },
        { status: 'available' as const, label: 'Disponible', color: 'bg-lagos-500' },
        { status: 'locked' as const, label: 'Bloqueado', color: 'bg-slate-400' },
      ]).map((item) => (
        <div key={item.status} className="flex items-center gap-1 md:gap-1.5">
          <div className={`h-2 w-2 rounded-full ${item.color} shadow-xs md:h-2.5 md:w-2.5`} />
          <span className="font-simply-olive text-[9px] font-medium text-gray-500 md:text-[10px] lg:text-[11px]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
