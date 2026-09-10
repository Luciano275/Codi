import { Medal } from 'lucide-react';

export function RankingHeader() {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.5rem] border-2 border-castillo-300 bg-castillo-100 text-castillo-700 shadow-[0_6px_0_#d4b43a] lg:h-18 lg:w-18">
          <Medal
            className="h-8 w-8 fill-castillo-400 lg:h-9 lg:w-9"
            strokeWidth={2.3}
            aria-hidden
          />
        </span>
        <div>
          <h1 className="font-super-pandora text-4xl leading-none text-gray-900 sm:text-5xl lg:text-6xl">
            Ranking
          </h1>
          <p className="mt-2 font-simply-olive text-base font-medium text-gray-500 lg:mt-3 lg:text-lg">
            Competí con otros estudiantes y subí en la tabla.
          </p>
        </div>
      </div>
    </header>
  );
}
