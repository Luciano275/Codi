import { BookOpen, Crown, Gem, Lightbulb, Sparkles, Trophy, Zap } from 'lucide-react';

function GemPile({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`absolute ${className}`}>
      <span className="absolute bottom-0 left-0 h-7 w-7 rotate-45 rounded-[.45rem] border border-cyan-100 bg-linear-to-br from-cyan-100 via-lagos-300 to-lagos-600 shadow-[0_8px_12px_rgba(0,120,210,.28)]" />
      <span className="absolute bottom-1 left-6 h-8 w-8 rotate-45 rounded-[.5rem] border border-cyan-100 bg-linear-to-br from-valle-100 via-valle-300 to-lagos-500 shadow-[0_8px_12px_rgba(0,120,210,.3)]" />
      <span className="absolute bottom-0 left-13 h-6 w-6 rotate-45 rounded-[.4rem] border border-cyan-100 bg-linear-to-br from-cyan-100 via-lagos-300 to-lagos-600 shadow-[0_8px_12px_rgba(0,120,210,.28)]" />
      <span className="absolute bottom-6 left-7 h-6 w-6 rotate-45 rounded-[.4rem] border border-white/80 bg-linear-to-br from-white via-valle-200 to-lagos-500 shadow-[0_6px_10px_rgba(0,120,210,.34)]" />
    </div>
  );
}

export function StoreBag({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`relative h-18 w-17 ${className}`}>
      <div className="absolute left-4 top-0 h-8 w-9 rounded-t-[1.15rem] border-[4px] border-bosque-700 bg-bosque-100" />
      <div className="absolute bottom-0 left-0 h-14 w-17 rounded-[1.15rem] rounded-tr-[1.65rem] border-b-4 border-r-4 border-bosque-700 bg-linear-to-br from-bosque-300 via-bosque-500 to-bosque-700 shadow-[0_12px_18px_rgba(95,79,191,.25)]" />
      <div className="absolute bottom-6 left-2 h-2.5 w-12 rounded-full bg-bosque-200/80" />
      <Gem className="absolute bottom-3 left-1/2 h-7 w-7 -translate-x-1/2 fill-valle-200 text-valle-300 drop-shadow-md" />
      <Sparkles className="absolute -right-3 -top-2 h-6 w-6 text-castillo-400" />
    </div>
  );
}

export function GemChest({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`relative h-31 w-38 ${className}`}>
      <Sparkles className="absolute -left-2 top-3 h-6 w-6 text-lagos-300" />
      <Sparkles className="absolute right-1 top-0 h-5 w-5 text-castillo-400" />
      <GemPile className="bottom-1 left-0 h-13 w-23" />
      <div className="absolute right-2 top-8 h-12 w-22 -rotate-12 rounded-t-[1.15rem] border-3 border-desierto-700 bg-linear-to-b from-castillo-100 via-desierto-300 to-desierto-500 shadow-[0_7px_0_#a05a00,0_16px_18px_rgba(159,88,0,.24)]" />
      <div className="absolute right-2 top-16 h-14 w-22 -rotate-12 rounded-b-[1.15rem] border-3 border-desierto-700 bg-linear-to-b from-desierto-300 to-desierto-500 shadow-[0_7px_0_#a05a00,0_16px_18px_rgba(159,88,0,.24)]" />
      <div className="absolute right-10 top-15 h-8 w-5 -rotate-12 rounded-lg border-2 border-castillo-700 bg-castillo-300 shadow-md" />
      <div className="absolute right-6 top-[2.55rem] h-4 w-10 -rotate-12 rounded-full bg-white/40" />
      <GemPile className="bottom-0 right-0 h-12 w-21 scale-75" />
    </div>
  );
}

const ILLUSTRATIONS = {
  exam: { Icon: Trophy, mark: '+1', icon: 'text-desierto-500', disc: 'from-castillo-50 via-desierto-50 to-castillo-100', ring: 'ring-castillo-200' },
  hint: { Icon: BookOpen, mark: '?', icon: 'text-bosque-500', disc: 'from-bosque-50 via-fuchsia-50 to-bosque-100', ring: 'ring-bosque-200' },
  'double-xp': { Icon: Crown, mark: '2×', icon: 'text-lagos-500', disc: 'from-lagos-50 via-cyan-50 to-valle-100', ring: 'ring-lagos-200' },
} as const;

export function RewardIllustration({ visual }: { visual: 'exam' | 'hint' | 'double-xp' }) {
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
}
