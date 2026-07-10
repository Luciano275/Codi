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
  const size = 'h-5 w-5 md:h-6 md:w-6';
  if (status === 'completed') return <Check className={`${size} drop-shadow-xs`} />;
  if (status === 'available') return <Play className={`${size} drop-shadow-xs ml-0.5`} />;
  return <Lock className={`${size} drop-shadow-xs`} />;
}

function NodeInner({ stage }: { stage: StageData }) {
  const style = nodeStyles[stage.status];

  return (
    <div className="group relative flex flex-col items-center">
      <motion.div
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${style.bg} ${style.border} border-2 shadow-lg ${style.shadow} ${style.iconColor} transition-all duration-300 md:h-14 md:w-14 md:rounded-2xl`}
        animate={
          stage.status === 'available'
            ? {
                boxShadow: [
                  `0 0 0 0 ${style.glow}`,
                  `0 0 0 12px ${style.glow}`,
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
        <div className="absolute -inset-1 rounded-xl bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:-inset-1.5 md:rounded-2xl" />
      </motion.div>

      <div className="mt-1 flex items-center gap-1 md:mt-1.5">
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-xs md:h-6 md:w-6 md:text-[11px] ${
            stage.status === 'completed'
              ? 'bg-pradera-500'
              : stage.status === 'available'
              ? 'bg-lagos-500'
              : 'bg-slate-400'
          }`}
        >
          {stage.id}
        </span>
        <span
          className={`hidden whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-semibold leading-tight text-white shadow-xs opacity-0 transition-all duration-200 group-hover:opacity-100 md:inline md:text-[11px] ${
            stage.status === 'completed'
              ? 'bg-pradera-500'
              : stage.status === 'available'
              ? 'bg-lagos-500'
              : 'bg-slate-400'
          }`}
        >
          {stage.name.length > 20 ? stage.name.slice(0, 18) + '…' : stage.name}
        </span>
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
    <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-xl bg-white/90 px-3 py-2 shadow-xs backdrop-blur-sm">
      {([
        { status: 'completed' as const, label: 'Completado', color: 'bg-pradera-500' },
        { status: 'available' as const, label: 'Disponible', color: 'bg-lagos-500' },
        { status: 'locked' as const, label: 'Bloqueado', color: 'bg-slate-400' },
      ]).map((item) => (
        <div key={item.status} className="flex items-center gap-1.5">
          <div className={`h-3 w-3 rounded-full ${item.color} shadow-xs`} />
          <span className="font-simply-olive text-[11px] font-medium text-gray-500">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
