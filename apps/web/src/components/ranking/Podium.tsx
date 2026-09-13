import { Trophy } from '@/components/ui/Icon';
import type { RankingEntry } from './types';
import { PodiumCard } from './PodiumCard';
import { useReducedParticleDensity } from './useReducedParticleDensity';

interface PodiumProps {
  students: RankingEntry[];
}

export function Podium({ students }: PodiumProps) {
  const reduceParticleDensity = useReducedParticleDensity();
  const orderedStudents = [
    students.find((student) => student.rank === 2),
    students.find((student) => student.rank === 1),
    students.find((student) => student.rank === 3),
  ].filter((student): student is RankingEntry => Boolean(student));

  if (!orderedStudents.length) return null;

  return (
    <section
      aria-labelledby="podium-heading"
      className="rounded-[1.6rem] border border-castillo-100 bg-linear-to-br from-white via-castillo-50/60 to-white p-3.5 sm:p-5 lg:rounded-[2rem] lg:p-7"
    >
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-7 lg:mb-9">
        <div>
          <h2
            id="podium-heading"
            className="font-super-pandora text-xl text-gray-900 sm:text-2xl lg:text-3xl"
          >
            Estrellas de la tabla
          </h2>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-castillo-100 text-castillo-700 shadow-[0_3px_0_#f9d54d] sm:h-12 sm:w-12 sm:rounded-2xl sm:shadow-[0_4px_0_#f9d54d]">
          <Trophy className="h-5 w-5 fill-castillo-400 sm:h-6 sm:w-6" aria-hidden />
        </span>
      </div>
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-3 md:gap-4">
        {orderedStudents.map((student) => (
          <PodiumCard
            key={student.id}
            student={student}
            reduceParticleDensity={reduceParticleDensity}
          />
        ))}
      </div>
    </section>
  );
}
