'use client';

import {
  ArrowLeft,
  BookOpen,
  FlaskConical,
  PanelLeftOpen,
  Play,
  Loader2,
  CheckCircle2,
} from '@/components/ui/Icon';

interface LangInfo {
  id: string;
  label: string;
}

interface LabToolbarProps {
  mode: 'exercise' | 'playground';
  exerciseMode?: {
    onBack: () => void;
    showStatement: boolean;
    onShowStatement: () => void;
    availableLanguages: LangInfo[];
    language: string;
    onLanguageChange: (lang: string) => void;
  };
  playgroundMode?: {
    showOptions: boolean;
    onShowOptions: () => void;
  };
  running: boolean;
  evaluating: boolean;
  onRun: () => void;
  onEvaluate?: () => void;
}

export function LabToolbar({
  mode,
  exerciseMode,
  playgroundMode,
  running,
  evaluating,
  onRun,
  onEvaluate,
}: LabToolbarProps) {
  if (mode === 'exercise' && exerciseMode) {
    return (
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={exerciseMode.onBack}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
            title="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <div className="h-4 w-px bg-gray-200" />
          {!exerciseMode.showStatement && (
            <button
              onClick={exerciseMode.onShowStatement}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-lagos-600 transition-colors hover:bg-lagos-50"
            >
              <BookOpen className="h-4 w-4" />
              Enunciado
            </button>
          )}
          <FlaskConical className="h-4 w-4 text-valle-500" />
          <span className="font-super-pandora text-sm text-gray-700">Laboratorio</span>
          <span className="mx-1.5 text-gray-300">|</span>
          {exerciseMode.availableLanguages.length === 1 ? (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              Solo: {exerciseMode.availableLanguages[0].label}
            </span>
          ) : (
            <div className="flex items-center gap-1">
              {exerciseMode.availableLanguages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => exerciseMode.onLanguageChange(lang.id)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    exerciseMode.language === lang.id
                      ? 'bg-valle-100 text-valle-700'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRun}
            disabled={running}
            className="flex items-center gap-1.5 rounded-lg bg-pradera-500 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-pradera-600 active:scale-95 disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            RUN
          </button>
          <button
            onClick={onEvaluate}
            disabled={evaluating}
            className="flex items-center gap-1.5 rounded-lg bg-bosque-500 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-bosque-600 active:scale-95 disabled:opacity-50"
          >
            {evaluating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Evaluar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex items-center gap-2">
        {playgroundMode && !playgroundMode.showOptions && (
          <button
            onClick={playgroundMode.onShowOptions}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
          >
            <PanelLeftOpen className="h-4 w-4" />
            Opciones
          </button>
        )}
        <FlaskConical className="h-4 w-4 text-valle-500" />
        <span className="font-super-pandora text-sm text-gray-700">Laboratorio</span>
      </div>

      <button
        onClick={onRun}
        disabled={running}
        className="flex items-center gap-1.5 rounded-lg bg-pradera-500 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-pradera-600 active:scale-95 disabled:opacity-50"
      >
        {running ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
        RUN
      </button>
    </div>
  );
}
