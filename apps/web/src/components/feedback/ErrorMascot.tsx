'use client';

import { motion } from 'motion/react';
import { CodiMascot } from '@/components/mascot/CodiMascot';

interface ErrorMascotProps {
  title: string;
  description: string;
  score?: number;
  reducedMotion: boolean;
}

export function ErrorMascot({ title, description, score, reducedMotion }: ErrorMascotProps) {
  const hasNoCorrectAnswers = score === 0;

  return (
    <div className="relative flex min-h-[29rem] flex-col items-center justify-end overflow-hidden px-5 pb-8 pt-14 sm:min-h-[32rem] sm:pb-10">
      <div className="relative flex h-64 w-full items-end justify-center sm:h-72">
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : -8, rotate: 0, scale: 1 }}
          animate={
            reducedMotion
              ? { opacity: 1, y: 8, rotate: -1, scale: 0.98 }
              : {
                  opacity: [0, 1, 1, 1],
                  y: [-8, 8, 14, 12],
                  rotate: [0, -1.5, 1, 0],
                  scale: [1, 0.98, 0.97, 0.97],
                }
          }
          transition={{
            duration: reducedMotion ? 0.2 : 1.05,
            times: [0, 0.35, 0.72, 1],
            ease: 'easeInOut',
          }}
          className="relative z-10 h-64 w-[min(19rem,72vw)] origin-bottom sm:h-72"
        >
          <CodiMascot
            animation={hasNoCorrectAnswers ? 'Codi_Frustrated' : 'Codi_Wrong_Small'}
            loopAfter={hasNoCorrectAnswers ? 'Codi_Crying' : undefined}
            label={
              hasNoCorrectAnswers
                ? 'Codi se frustra y acompaña a volver a intentar el ejercicio'
                : 'Codi anima a volver a intentar el ejercicio'
            }
            className="h-full w-full drop-shadow-[0_12px_0_rgba(23,50,77,0.12)]"
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: reducedMotion ? 0.18 : 0.5,
          delay: reducedMotion ? 0.08 : 0.78,
          ease: 'easeOut',
        }}
        className="relative z-20 -mt-4 text-center text-[#17324d]"
      >
        <p className="font-super-pandora text-[clamp(3rem,10vw,5.4rem)] leading-none [text-shadow:0_4px_0_#ffffff]">
          {title}
        </p>
        <p className="mt-3 font-simply-olive text-sm font-semibold sm:text-base">{description}</p>
        {score !== undefined ? (
          <span className="mt-3 inline-flex rounded-full border-2 border-[#17324d] bg-white px-4 py-1 font-super-pandora text-lg shadow-[3px_3px_0_#17324d]">
            {score.toFixed(0)} puntos
          </span>
        ) : null}
      </motion.div>
    </div>
  );
}
