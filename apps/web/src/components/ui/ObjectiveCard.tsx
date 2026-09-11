import { Trophy } from '@/components/ui/Icon';

interface ObjectiveCardProps {
  title: string;
  progress: number;
  xpReward: number;
}

export default function ObjectiveCard({ title, progress, xpReward }: ObjectiveCardProps) {
  const pct = Math.min(progress, 100);
  const safePct = isNaN(pct) ? 0 : pct;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs transition-all duration-300 hover:shadow-md">
      <div className="bg-linear-to-r from-lagos-500 to-lagos-400 px-4 py-2.5 md:px-5 md:py-3">
        <h3 className="font-super-pandora text-sm text-white drop-shadow-xs md:text-base">
          Próximo Objetivo
        </h3>
      </div>
      <div className="space-y-3 p-4 md:p-5">
        <p className="font-simply-olive text-xs leading-snug text-gray-700 md:text-sm">{title}</p>
        <div className="relative h-2.5 overflow-hidden rounded-full bg-gray-100 shadow-inner md:h-3">
          <div
            className="relative h-full overflow-hidden rounded-full bg-linear-to-r from-lagos-400 to-lagos-500 shadow-xs transition-all duration-700 ease-out"
            style={{ width: `${safePct}%` }}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
        {xpReward > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-50 to-desierto-50 px-3 py-2 shadow-xs">
            <Trophy className="h-4 w-4 shrink-0 text-desierto-500" />
            <span className="font-candy-beans text-sm text-desierto-600">
              +{xpReward.toLocaleString()} XP
            </span>
            <span className="font-simply-olive text-xs text-desierto-400">al completar</span>
          </div>
        )}
      </div>
    </div>
  );
}
