import { ClipboardList } from '@/components/ui/Icon';
import type { RankingEntry } from './types';
import { RankingRow } from './RankingRow';

interface RankingTableProps {
  students: RankingEntry[];
  currentUserId: string;
  page: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function RankingTable({
  students,
  currentUserId,
  page,
  totalPages,
  isLoading,
  onPageChange,
}: RankingTableProps) {
  return (
    <section
      aria-labelledby="ranking-list-heading"
      className="rounded-[1.6rem] border border-gray-100 bg-white p-3 sm:p-4 md:rounded-[2rem] md:p-5 lg:p-7"
    >
      <div className="mb-3 flex items-center justify-between gap-2 px-1 sm:mb-4 sm:gap-3">
        <div>
          <h2
            id="ranking-list-heading"
            className="font-super-pandora text-xl text-gray-900 sm:text-2xl lg:text-3xl"
          >
            Todos los estudiantes
          </h2>
        </div>
        <span className="shrink-0 rounded-full bg-gray-50 px-2.5 py-1.5 font-simply-olive text-xs font-bold text-gray-500 sm:px-3 sm:py-2 sm:text-sm">
          Página {page} de {totalPages}
        </span>
      </div>
      <div
        className={`space-y-2 transition-opacity ${isLoading ? 'opacity-55' : 'opacity-100'}`}
        aria-busy={isLoading}
      >
        <div className="hidden grid-cols-[3.5rem_minmax(12rem,1.8fr)_minmax(5rem,.65fr)_minmax(6rem,.75fr)_minmax(6rem,.8fr)_minmax(5rem,.65fr)] gap-3 px-5 font-simply-olive text-sm font-bold text-gray-400 md:grid">
          <span>#</span>
          <span>Estudiante</span>
          <span>Nivel</span>
          <span>XP</span>
          <span>Lecciones</span>
          <span>Racha</span>
        </div>
        {students.length ? (
          students.map((student) => (
            <RankingRow
              key={student.id}
              student={student}
              isCurrentUser={student.id === currentUserId}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <ClipboardList className="h-12 w-12 text-gray-300" aria-hidden />
            <p className="font-super-pandora text-lg text-gray-700">
              Todavía no hay estudiantes aquí
            </p>
            <p className="font-simply-olive text-base text-gray-400">
              Probá otro filtro para encontrar competencia.
            </p>
          </div>
        )}
      </div>
      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1 || isLoading}
            className="min-h-11 cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 font-super-pandora text-sm text-gray-600 transition hover:-translate-y-0.5 hover:border-lagos-300 hover:text-lagos-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="font-candy-beans text-base text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages || isLoading}
            className="min-h-11 cursor-pointer rounded-xl bg-lagos-500 px-4 py-2 font-super-pandora text-sm text-white shadow-[0_3px_0_#0082cc] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </section>
  );
}
