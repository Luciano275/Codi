'use client';

import type { StoreReward } from '@codi/types';
import {
  RewardRedemptionCelebration,
  type RewardRedemptionData,
} from '@/components/ui/RewardRedemptionCelebration';

interface RedeemCelebrationProps {
  reward: StoreReward | null;
  onClose: () => void;
}

function toCelebrationData(reward: StoreReward | null): RewardRedemptionData | null {
  if (!reward) return null;

  return {
    name: reward.name,
    description: `Canjeaste ${reward.name}. ¡A usarla en tu próxima aventura!`,
    gems: reward.cost,
    amountPrefix: '-',
    eyebrow: '¡MISIÓN CUMPLIDA!',
    glbLabel: reward.name,
  };
}

export function RedeemCelebration({ reward, onClose }: RedeemCelebrationProps) {
  return <RewardRedemptionCelebration reward={toCelebrationData(reward)} onClose={onClose} />;
}
