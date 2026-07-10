'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Gem, X } from 'lucide-react';

interface GemRewardData {
  amount: number;
  exerciseTitle: string;
}

export function GemRewardPopup({ reward }: { reward: GemRewardData | null }) {
  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          key="gem-reward"
          initial={{ opacity: 0, y: -60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.8 }}
          transition={{ type: 'spring', damping: 18, stiffness: 260 }}
          className="fixed left-1/2 top-8 z-[100] -translate-x-1/2"
        >
          <motion.div
            initial={{ rotate: -8 }}
            animate={{ rotate: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.15 }}
            className="flex items-center gap-4 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 px-6 py-4 shadow-2xl shadow-amber-500/20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 8, stiffness: 220, delay: 0.3 }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/40"
            >
              <Gem className="h-6 w-6 text-white drop-shadow-sm" />
            </motion.div>
            <div className="flex flex-col">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="font-candy-beans text-lg text-amber-900"
              >
                +{reward.amount} gemas
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="font-simply-olive text-xs text-amber-700/80"
              >
                por completar &quot;{reward.exerciseTitle}&quot;
              </motion.span>
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const el = document.getElementById('gem-reward-close');
                el?.click();
              }}
              className="ml-2 rounded-full p-1 text-amber-400/60 transition-colors hover:bg-amber-200/50 hover:text-amber-600"
            >
              <X className="h-4 w-4" />
            </motion.button>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  x: [0, (i % 2 === 0 ? 1 : -1) * (30 + i * 8)],
                  y: [0, -40 - i * 10],
                }}
                transition={{ duration: 1.2, delay: 0.3 + i * 0.12, ease: 'easeOut' }}
                className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-amber-300"
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
