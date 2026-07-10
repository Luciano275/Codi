'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import horizontalMap from '@/assets/horizontal_map.png';
import verticalMap from '@/assets/vertical_map.png';
import { BASE_DESKTOP, BASE_MOBILE, extendPositions, buildPath, buildLockedPath } from '@/lib/learning-path/positions';
import { Node, MapLegend } from './LearningPathNode';

export interface StageData {
  id: number;
  name: string;
  status: 'completed' | 'available' | 'locked';
  courseId?: string;
}

interface LearningPathProps {
  stages: StageData[];
}

function MapSection({
  positions,
  stages,
  activeStageIds,
  activeCount,
  totalCount,
  isMobile,
}: {
  positions: { x: number; y: number }[];
  stages: StageData[];
  activeStageIds: number[];
  activeCount: number;
  totalCount: number;
  isMobile: boolean;
}) {
  const path = buildPath(positions, activeStageIds);
  const lockedPath =
    activeCount > 0 && activeCount < totalCount
      ? buildLockedPath(positions, activeCount + 1)
      : '';

  return (
    <div className="relative h-full w-full" style={{ overflow: 'visible' }}>
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <Image
          src={isMobile ? verticalMap : horizontalMap}
          alt="Mapa de ruta de aprendizaje"
          fill={!isMobile}
          priority
          className={isMobile ? 'h-auto w-full' : 'object-contain'}
          sizes="100vw"
        />
      </div>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        {path && (
          <path d={path} stroke="#58CC02" strokeWidth={isMobile ? '0.8' : '0.6'} fill="none" strokeLinecap="round" strokeDasharray="2 1.5" opacity="0.6" />
        )}
        {lockedPath && (
          <path d={lockedPath} stroke="#CBD5E1" strokeWidth={isMobile ? '0.8' : '0.6'} fill="none" strokeLinecap="round" strokeDasharray="1.5 2" opacity="0.4" />
        )}
      </svg>
      {stages.map((stage, i) => (
        <Node key={stage.id} stage={stage} position={positions[stage.id - 1] || { x: 50, y: 50 }} index={i} />
      ))}
    </div>
  );
}

export default function LearningPath({ stages }: LearningPathProps) {
  const activeStages = stages.filter((s) => s.status !== 'locked');
  const activeStageIds = useMemo(() => activeStages.map((s) => s.id), [activeStages]);

  const dPositions = useMemo(() => extendPositions(BASE_DESKTOP, stages.length), [stages.length]);
  const mPositions = useMemo(() => extendPositions(BASE_MOBILE, stages.length), [stages.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative flex w-full items-center justify-center"
      style={{ overflow: 'visible' }}
    >
      <div className="relative hidden aspect-[16/9] w-full md:block" style={{ overflow: 'visible' }}>
        <MapSection
          positions={dPositions}
          stages={stages}
          activeStageIds={activeStageIds}
          activeCount={activeStages.length}
          totalCount={stages.length}
          isMobile={false}
        />
        <MapLegend />
      </div>

      <div className="relative w-full md:hidden" style={{ overflow: 'visible' }}>
        <div className="relative" style={{ overflow: 'visible' }}>
          <MapSection
            positions={mPositions}
            stages={stages}
            activeStageIds={activeStageIds}
            activeCount={activeStages.length}
            totalCount={stages.length}
            isMobile
          />
        </div>
        <MapLegend />
      </div>
    </motion.div>
  );
}
