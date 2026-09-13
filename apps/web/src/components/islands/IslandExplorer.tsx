'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@bprogress/next';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Map as MapIcon,
  TreePalm,
  Trophy,
} from '@/components/ui/Icon';
import type { RankingUser } from '@/lib/server-api';
import type { IslandViewModel } from './types';

const IslandWorld = dynamic(() => import('./IslandWorld'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[#1c3550]" />,
});

interface IslandExplorerProps {
  islands: IslandViewModel[];
  ranking: RankingUser[];
  completedLessons: number;
  totalLessons: number;
}

export default function IslandExplorer({
  islands,
  ranking,
  completedLessons,
  totalLessons,
}: IslandExplorerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [departingId, setDepartingId] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [focusedIslandId, setFocusedIslandId] = useState<string | null>(islands[0]?.id ?? null);
  const islandCarouselRef = useRef<HTMLDivElement>(null);
  const titleOverlayRef = useRef<HTMLElement>(null);
  const carouselOverlayRef = useRef<HTMLDivElement>(null);
  const islandCardRefs = useRef(new Map<string, HTMLAnchorElement | HTMLDivElement>());
  const router = useRouter();
  const hoveredIsland = islands.find((island) => island.id === hoveredId);

  useEffect(() => {
    if (!departingId) return;
    const island = islands.find((candidate) => candidate.id === departingId);
    if (!island) return;

    const flashTimeout = window.setTimeout(() => setShowFlash(true), 250);
    const navigationTimeout = window.setTimeout(() => router.push(island.href), 850);

    return () => {
      window.clearTimeout(flashTimeout);
      window.clearTimeout(navigationTimeout);
    };
  }, [departingId, islands, router]);

  function enterIsland(island: IslandViewModel) {
    if (!island.available || departingId) return;
    setDepartingId(island.id);
  }

  function moveIslandCarousel(direction: -1 | 1) {
    if (!islands.length) return;
    const nextIndex = (carouselIndex + direction + islands.length) % islands.length;
    const nextIsland = islands[nextIndex];
    islandCardRefs.current.get(nextIsland.id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
    setCarouselIndex(nextIndex);
    setFocusedIslandId(nextIsland.id);
    setHoveredId(nextIsland.id);
  }

  return (
    <section className="relative h-full overflow-hidden bg-[#22344e] text-white">
      <IslandWorld
        islands={islands}
        departingId={departingId}
        focusedIslandId={focusedIslandId}
        topOverlayRef={titleOverlayRef}
        bottomOverlayRef={carouselOverlayRef}
        onHover={setHoveredId}
        onSelect={(islandId) => {
          const island = islands.find((candidate) => candidate.id === islandId);
          if (island) enterIsland(island);
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_68%,transparent_5%,rgba(5,17,31,0.15)_57%,rgba(5,17,31,0.65)_100%)]" />
      <div
        className={`pointer-events-none absolute inset-0 z-30 bg-white transition-opacity duration-500 ${showFlash ? 'opacity-100' : 'opacity-0'}`}
      />
      <header
        ref={titleOverlayRef}
        className="pointer-events-none absolute inset-x-0 top-18 z-10 px-4 text-center lg:top-24"
      >
        <h1 className="font-super-pandora mx-auto max-w-3xl text-2xl leading-tight text-white drop-shadow-[0_4px_0_#2b7d03] md:text-4xl">
          {hoveredIsland?.title ?? 'Seleccioná una isla de aprendizaje'}
        </h1>
        <p className="font-simply-olive mx-auto mt-2 max-w-xl text-xs text-sky-100/70 md:text-sm">
          {hoveredIsland?.description ??
            'Cada isla guarda una ruta, nuevos desafíos y otra forma de avanzar.'}
        </p>
      </header>

      <aside className="absolute left-3 top-28 z-10 hidden w-52 rounded-[1.35rem] border border-slate-200/90 bg-white/94 p-3.5 shadow-[0_5px_0_rgba(15,23,42,0.08)] backdrop-blur-sm lg:block">
        <div className="flex items-center gap-2 text-slate-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pradera-50 text-pradera-700">
            <MapIcon className="h-4 w-4" />
          </span>
          <span className="font-super-pandora text-sm">Tu expedición</span>
        </div>
        <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-slate-100 p-0.5">
          <div
            className="h-full rounded-full bg-pradera-400 transition-[width] duration-700"
            style={{ width: `${totalLessons ? (completedLessons / totalLessons) * 100 : 0}%` }}
          />
        </div>
        <p className="font-simply-olive mt-2.5 text-xs text-slate-500">
          {completedLessons} de {totalLessons} lecciones
        </p>
      </aside>

      <aside className="absolute right-3 top-28 z-10 hidden w-56 rounded-[1.35rem] border border-slate-200/90 bg-white/94 p-3.5 shadow-[0_5px_0_rgba(15,23,42,0.08)] backdrop-blur-sm xl:block">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-castillo-50 text-castillo-600">
              <Trophy className="h-4 w-4" />
            </span>
            <span className="font-super-pandora text-sm">Ranking</span>
          </div>
          <Link
            href="/dashboard/ranking"
            className="font-simply-olive rounded-lg px-1 py-1 text-[11px] font-semibold text-castillo-700 transition-colors hover:bg-castillo-50 hover:text-castillo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-castillo-500"
          >
            Ver tabla
          </Link>
        </div>
        {ranking.length === 0 ? (
          <p className="font-simply-olive py-4 text-center text-xs text-slate-500">
            El ranking se llena con tus primeros desafíos.
          </p>
        ) : (
          <ol className="mt-3 space-y-1.5">
            {ranking.slice(0, 3).map((player) => (
              <li
                key={player.id}
                className="flex items-center gap-2 rounded-xl border border-transparent px-1.5 py-1.5 transition-colors hover:border-slate-100 hover:bg-slate-50/80"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-candy-beans text-[11px] ${
                    player.rank === 1
                      ? 'bg-castillo-100 text-castillo-700'
                      : player.rank === 2
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-desierto-50 text-desierto-700'
                  }`}
                >
                  {player.rank}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">
                  {player.displayName}
                </span>
                <span className="font-candy-beans text-[11px] text-castillo-700">
                  {player.xp.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        )}
      </aside>

      <div ref={carouselOverlayRef} className="absolute inset-x-0 bottom-16 z-10 px-3 md:bottom-28">
        <button
          type="button"
          onClick={() => moveIslandCarousel(-1)}
          aria-label="Ver islas anteriores"
          className="absolute left-0 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 cursor-pointer items-center justify-center text-white transition hover:scale-110 hover:text-lagos-300"
        >
          <ChevronLeft className="h-10 w-10" strokeWidth={3} />
        </button>
        <button
          type="button"
          onClick={() => moveIslandCarousel(1)}
          aria-label="Ver más islas"
          className="absolute right-0 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 cursor-pointer items-center justify-center text-white transition hover:scale-110 hover:text-lagos-300"
        >
          <ChevronRight className="h-10 w-10" strokeWidth={3} />
        </button>
        <div ref={islandCarouselRef} className="overflow-x-auto scroll-smooth px-12 pb-2">
          <div className="flex min-w-max justify-center gap-2 md:gap-3">
            {islands.map((island) => {
              const content = (
                <>
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${island.available ? 'bg-pradera-100 text-pradera-700' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {island.available ? (
                      <TreePalm className="h-4 w-4" />
                    ) : (
                      <LockKeyhole className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="font-super-pandora block truncate text-xs text-gray-800 md:text-sm">
                      {island.title}
                    </span>
                    <span className="font-simply-olive block text-[10px] text-gray-500 md:text-xs">
                      {island.available ? `${island.moduleCount} módulos` : 'Próximamente'}
                    </span>
                  </span>
                </>
              );

              const className = `flex w-48 shrink-0 items-center gap-2 rounded-[1.2rem] border bg-white/94 px-2.5 py-2 shadow-[0_4px_0_rgba(15,23,42,0.1)] transition-all duration-200 md:w-56 md:px-3 ${
                island.available
                  ? 'cursor-pointer border-slate-200 hover:-translate-y-0.5 hover:border-pradera-300 hover:shadow-[0_6px_0_rgba(15,23,42,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pradera-400'
                  : 'cursor-not-allowed border-slate-200 opacity-75 grayscale'
              }`;

              return island.available ? (
                <a
                  key={island.id}
                  ref={(element) => {
                    if (element) islandCardRefs.current.set(island.id, element);
                  }}
                  href={island.href}
                  className={className}
                  onClick={(event) => {
                    event.preventDefault();
                    enterIsland(island);
                  }}
                  onMouseEnter={() => setHoveredId(island.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {content}
                </a>
              ) : (
                <div
                  key={island.id}
                  ref={(element) => {
                    if (element) islandCardRefs.current.set(island.id, element);
                  }}
                  className={className}
                  aria-disabled="true"
                  onMouseEnter={() => setHoveredId(island.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
