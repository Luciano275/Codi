'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { MascotParticles } from './mascot-particles';

interface SuccessMascotProps {
  title: string;
  description: string;
  score?: number;
  reducedMotion: boolean;
}

export function SuccessMascot({ title, description, score, reducedMotion }: SuccessMascotProps) {
  return (
    <div className="relative flex min-h-[29rem] flex-col items-center justify-end px-5 pb-8 pt-14 sm:min-h-[32rem] sm:pb-10">
      <div className="relative flex h-64 w-full items-end justify-center sm:h-72">
        <MascotParticles reducedMotion={reducedMotion} />

        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 22, scaleX: 1.04, scaleY: 0.92 }}
          animate={{
            opacity: 1,
            y: reducedMotion ? 0 : [22, 28, -32, -24, -28],
            scaleX: reducedMotion ? 1 : [1.04, 1.08, 0.97, 1, 1],
            scaleY: reducedMotion ? 1 : [0.92, 0.86, 1.06, 0.98, 1],
            rotate: reducedMotion ? 0 : [0, -2, 4, 1, 0],
          }}
          transition={{
            duration: reducedMotion ? 0.18 : 0.78,
            times: [0, 0.18, 0.46, 0.72, 1],
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative z-10 w-[min(19rem,72vw)] drop-shadow-[0_12px_0_rgba(23,50,77,0.14)]"
        >
          <Image
            src="/mascot-success.png"
            alt="Mascota de Codi celebrando con el puño en alto"
            width={1254}
            height={1254}
            className="h-auto w-full"
            priority
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: reducedMotion ? 6 : 28, scale: reducedMotion ? 1 : 0.62 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: reducedMotion ? 'tween' : 'spring',
          stiffness: 420,
          damping: 17,
          delay: reducedMotion ? 0.08 : 0.38,
        }}
        className="relative z-20 -mt-4 text-center text-[#17324d]"
      >
        <p className="font-super-pandora text-[clamp(3rem,10vw,5.8rem)] leading-[0.9] [text-shadow:0_4px_0_#ffffff]">
          {title}
        </p>
        <p className="mt-3 font-simply-olive text-sm font-bold sm:text-base">{description}</p>
        {score !== undefined ? (
          <span className="mt-3 inline-flex rounded-full border-2 border-[#17324d] bg-white px-4 py-1 font-super-pandora text-lg shadow-[3px_3px_0_#17324d]">
            {score.toFixed(0)} puntos
          </span>
        ) : null}
      </motion.div>
    </div>
  );
}
