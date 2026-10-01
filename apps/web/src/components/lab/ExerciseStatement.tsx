'use client';

import { BookOpen, X, Zap, FileCode2, CheckCircle2 } from '@/components/ui/Icon';
import { DynamicCodiMascot } from '@/components/mascot/DynamicCodiMascot';

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'text-pradera-600 bg-pradera-50',
  MEDIUM: 'text-desierto-600 bg-desierto-50',
  HARD: 'text-volcan-600 bg-volcan-50',
  EXPERT: 'text-bosque-600 bg-bosque-50',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Medio',
  HARD: 'Difícil',
  EXPERT: 'Experto',
};

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: 'Aceptado',
  WRONG_ANSWER: 'Respuesta incorrecta',
  COMPILATION_ERROR: 'Error de compilación',
  RUNTIME_ERROR: 'Error de ejecución',
  TIME_LIMIT_EXCEEDED: 'Tiempo agotado',
  MEMORY_LIMIT_EXCEEDED: 'Memoria agotada',
};

const submissionTime = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Argentina/Buenos_Aires',
});

interface ExerciseInfo {
  id: string;
  title: string;
  difficulty: string;
  xpReward: number;
  cmsTaskId: number;
}

interface ExerciseStatementProps {
  exercise: ExerciseInfo;
  problemId: string | null;
  showStatement: boolean;
  onClose: () => void;
  submissions: any[];
}

export function ExerciseStatement({
  exercise,
  problemId,
  showStatement,
  onClose,
  submissions,
}: ExerciseStatementProps) {
  if (!showStatement) return null;

  return (
    <aside className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white lg:w-[720px] lg:flex-none">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-lagos-500" />
          <span className="font-simply-olive text-xs font-semibold uppercase text-gray-400">
            Enunciado
          </span>
        </div>
        <button
          onClick={onClose}
          className="hidden items-center justify-center rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 lg:flex"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 lg:p-4">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5">
          <h2 className="font-super-pandora text-sm text-gray-900">{exercise.title}</h2>
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
              DIFFICULTY_COLORS[exercise.difficulty] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {DIFFICULTY_LABELS[exercise.difficulty] || exercise.difficulty}
          </span>
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-400" />+{exercise.xpReward} XP
            </span>
            {exercise.cmsTaskId > 0 && (
              <span className="flex items-center gap-1">
                <FileCode2 className="h-3 w-3" />#{exercise.cmsTaskId}
              </span>
            )}
          </div>
        </div>

        <div className="relative flex-1 bg-gray-50">
          {problemId ? (
            <iframe
              src={`/api/proxy/api/problems/${problemId}/attachment`}
              className="h-full w-full"
              title="Enunciado del ejercicio"
            />
          ) : null}
        </div>

        <div className="border-t border-gray-200 bg-white">
          <details className="group" open={submissions.length > 0}>
            <summary className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-4 py-2.5 text-xs font-semibold uppercase text-gray-400 transition-colors hover:bg-gray-50">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Envíos
              {submissions.length > 0 && (
                <span className="ml-1 rounded-full bg-lagos-100 px-1.5 py-0.5 text-[10px] font-bold text-lagos-700">
                  {submissions.length}
                </span>
              )}
            </summary>
            <div className="max-h-48 overflow-y-auto">
              {submissions.length === 0 ? (
                <div className="flex items-center justify-center gap-2 px-4 py-2 text-center text-xs text-gray-400">
                  <DynamicCodiMascot
                    animation="Codi_Idle"
                    label="Codi espera tu primer envío"
                    className="h-13 w-13 shrink-0"
                  />
                  <span>Aún no realizaste envíos para este ejercicio.</span>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {submissions.map((s, idx) => {
                    const isAccepted = s.status === 'ACCEPTED';
                    const isError = [
                      'WRONG_ANSWER',
                      'COMPILATION_ERROR',
                      'RUNTIME_ERROR',
                      'TIME_LIMIT_EXCEEDED',
                      'MEMORY_LIMIT_EXCEEDED',
                    ].includes(s.status);
                    const statusIcon = isAccepted ? '✅' : isError ? '❌' : '⏳';
                    const statusColor = isAccepted
                      ? 'border-l-pradera-500 bg-pradera-50/30'
                      : isError
                        ? 'border-l-volcan-500 bg-volcan-50/30'
                        : 'border-l-desierto-500 bg-desierto-50/30';
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-3 border-l-2 px-4 py-2.5 text-xs transition-colors hover:bg-gray-50 ${statusColor}`}
                      >
                        <span className="text-base">{statusIcon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">
                              Envío #{submissions.length - idx}
                            </span>
                            {s.score != null && (
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                  s.score >= 100
                                    ? 'bg-pradera-100 text-pradera-700'
                                    : s.score >= 60
                                      ? 'bg-desierto-100 text-desierto-700'
                                      : 'bg-volcan-100 text-volcan-700'
                                }`}
                              >
                                {s.score.toFixed(0)}%
                              </span>
                            )}
                          </div>
                          <span className="text-gray-400">
                            {STATUS_LABELS[s.status] || s.status}
                          </span>
                        </div>
                        <span className="shrink-0 text-gray-400">
                          {submissionTime.format(new Date(s.submittedAt))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    </aside>
  );
}
