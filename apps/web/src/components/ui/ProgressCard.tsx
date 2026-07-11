interface ProgressCardProps {
  percentage: number;
  completed: number;
  total: number;
  remaining: number;
}

export default function ProgressCard({ percentage, completed, total, remaining }: ProgressCardProps) {
  const pct = Math.min(percentage, 100);
  const safePct = isNaN(pct) ? 0 : pct;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs transition-all duration-300 hover:shadow-md">
      <div className="bg-linear-to-r from-pradera-500 to-pradera-400 px-4 py-2.5 md:px-5 md:py-3">
        <h3 className="font-super-pandora text-sm text-white drop-shadow-xs md:text-base">Progreso General</h3>
      </div>
      <div className="p-4 md:p-5">
        <div className="mb-1 flex items-end justify-between">
          <span className="font-candy-beans text-3xl text-pradera-500 drop-shadow-xs md:text-4xl">
            {safePct}%
          </span>
          <span className="font-simply-olive text-[10px] text-gray-400 md:text-xs">completado</span>
        </div>
        <div className="relative mb-2 h-3 overflow-hidden rounded-full bg-gray-100 shadow-inner md:mb-3 md:h-4">
          <div
            className="relative h-full overflow-hidden rounded-full bg-linear-to-r from-pradera-400 to-pradera-500 shadow-xs transition-all duration-700 ease-out"
            style={{ width: `${safePct}%` }}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 md:text-xs">
          <span className="font-simply-olive">{completed} de {total} lecciones</span>
          <span className="font-simply-olive">{remaining} restantes</span>
        </div>
      </div>
    </div>
  );
}
