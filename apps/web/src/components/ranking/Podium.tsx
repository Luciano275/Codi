import { Trophy } from 'lucide-react';
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
      className="rounded-[2rem] border border-castillo-100 bg-linear-to-br from-white via-castillo-50/60 to-white p-5 lg:p-7"
    >
      <div className="mb-9 flex items-center justify-between gap-3">
        <div>
          <h2 id="podium-heading" className="font-super-pandora text-2xl text-gray-900 lg:text-3xl">
            Estrellas de la tabla
          </h2>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-castillo-100 text-castillo-700 shadow-[0_4px_0_#f9d54d]">
          <Trophy className="h-6 w-6 fill-castillo-400" aria-hidden />
        </span>
      </div>
      <div className="flex items-end gap-2.5 md:gap-4">
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
