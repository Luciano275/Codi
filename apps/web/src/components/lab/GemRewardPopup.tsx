'use client';

import { RewardCelebration } from '@/components/ui/RewardCelebration';

interface GemRewardData {
  amount: number;
  exerciseTitle: string;
}

interface GemRewardPopupProps {
  reward: GemRewardData | null;
  onDismiss: () => void;
}

export function GemRewardPopup({ reward, onDismiss }: GemRewardPopupProps) {
  return (
    <RewardCelebration
      reward={
        reward
          ? {
              kind: 'gems',
              amount: reward.amount,
              title: '¡Desafío superado!',
              detail: `Por completar “${reward.exerciseTitle}”`,
            }
          : null
      }
      onDismiss={onDismiss}
    />
  );
}
