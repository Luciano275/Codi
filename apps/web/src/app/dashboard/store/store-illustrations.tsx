import { memo } from 'react';
import { BookOpen, Crown, Lightbulb, Trophy, Zap } from 'lucide-react';

const ILLUSTRATIONS = {
  exam: { Icon: Trophy, mark: '+1', icon: 'text-desierto-500', disc: 'from-castillo-50 via-desierto-50 to-castillo-100', ring: 'ring-castillo-200' },
  hint: { Icon: BookOpen, mark: '?', icon: 'text-bosque-500', disc: 'from-bosque-50 via-fuchsia-50 to-bosque-100', ring: 'ring-bosque-200' },
  'double-xp': { Icon: Crown, mark: '2×', icon: 'text-lagos-500', disc: 'from-lagos-50 via-cyan-50 to-valle-100', ring: 'ring-lagos-200' },
} as const;

export const RewardIllustration = memo(function RewardIllustration({
  visual,
}: {
  visual: 'exam' | 'hint' | 'double-xp';
}) {
  const { Icon, mark, icon, disc, ring } = ILLUSTRATIONS[visual];
  return (
    <div className={`relative flex h-35 items-center justify-center overflow-hidden rounded-[1.55rem] bg-linear-to-br ring-1 ${disc} ${ring}`}>
      <span className="absolute left-5 top-4 font-candy-beans text-xl text-white/90">✦</span>
      <span className="absolute right-5 top-8 font-candy-beans text-lg text-white/90">✦</span>
      <span className="absolute bottom-4 left-8 font-candy-beans text-base text-white/80">✦</span>
      <div className="absolute h-20 w-20 rounded-full bg-white/70 shadow-inner" />
      <Icon className={`relative h-15 w-15 ${icon} drop-shadow-md`} strokeWidth={1.7} />
      {visual === 'hint' && <Lightbulb className="absolute bottom-5 right-8 h-7 w-7 fill-castillo-200 text-castillo-500 drop-shadow-sm" />}
      {visual === 'double-xp' && <Zap className="absolute bottom-5 right-8 h-7 w-7 fill-castillo-200 text-castillo-500 drop-shadow-sm" />}
      <span className="absolute bottom-3 right-4 rounded-xl border border-white/70 bg-white/80 px-2 py-0.5 font-candy-beans text-xl leading-none text-gray-800 shadow-sm">{mark}</span>
    </div>
  );
});
