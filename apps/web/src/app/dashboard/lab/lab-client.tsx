'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LabEditor from './editor';
import {
  OperationResultMascot,
  type OperationResultStatus,
} from '@/components/feedback/OperationResultMascot';
import { GemRewardPopup } from '@/components/lab/GemRewardPopup';
import { ExerciseStatement } from '@/components/lab/ExerciseStatement';
import { LabToolbar } from '@/components/lab/LabToolbar';
import { OptionsPanel } from '@/components/lab/OptionsPanel';
import { ConsolePanel } from '@/components/lab/ConsolePanel';
import { useCodePersistence } from '@/hooks/lab/useCodePersistence';
import { useExercise } from '@/hooks/lab/useExercise';
import { useConsole } from '@/hooks/lab/useConsole';
import { useSession } from '@/hooks/lab/useSession';
import { useEvaluation } from '@/hooks/lab/useEvaluation';
import { useResizable } from '@/hooks/lab/useResizable';
import { apiGet } from '@/lib/lab-api';

const DEFAULT_CODE = `# Laboratorio de Python
# Escribí tu código aquí y presioná RUN

print("¡Hola, Codi!")`;

const ALL_LANGUAGES = [
  { id: 'python', label: 'Python 3', extension: 'py' },
  { id: 'cpp', label: 'C++', extension: 'cpp' },
];

interface EvaluationFeedback {
  id: number;
  status: OperationResultStatus;
  score: number;
}

export default function LabClient({
  user,
}: {
  user: { id: string; username: string; displayName: string };
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const problemId = searchParams.get('problemId');
  const lessonId = searchParams.get('lessonId');
  const STORAGE_KEY = problemId ? `codi_lab_code_${user.id}_${problemId}` : 'codi_lab_code';

  const { code, setCode, language, setLanguage, setCodeFromTemplate } = useCodePersistence(
    STORAGE_KEY,
    DEFAULT_CODE,
  );
  const { exercise, submissions } = useExercise(
    problemId,
    language,
    setLanguage,
    setCodeFromTemplate,
  );

  const {
    consoleTabs,
    activeConsoleTab,
    setActiveConsoleTab,
    activeConsole,
    addConsoleTab,
    clearConsole,
  } = useConsole();
  const { sessionId, running, handleRun, sendStdin, stopSession, cleanup, consoleOutputRef } =
    useSession(addConsoleTab);
  const { evaluating, handleEvaluate } = useEvaluation(addConsoleTab);

  const { height: consoleHeight, startResize } = useResizable(280);

  const [showOptions, setShowOptions] = useState(true);
  const [showConsole, setShowConsole] = useState(true);
  const [showStatement, setShowStatement] = useState(true);
  const [consoleInput, setConsoleInput] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [caretAnimation, setCaretAnimation] = useState<
    'blink' | 'smooth' | 'phase' | 'expand' | 'solid'
  >('smooth');
  const [tabSize, setTabSize] = useState(4);
  const [gemReward, setGemReward] = useState<{ amount: number; exerciseTitle: string } | null>(
    null,
  );
  const [evaluationFeedback, setEvaluationFeedback] = useState<EvaluationFeedback | null>(null);
  const pendingGemRewardRef = useRef<{ amount: number; exerciseTitle: string } | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun(code, language);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun, code, language]);

  useEffect(() => cleanup, [cleanup]);

  const handleLanguageChange = useCallback(
    (newLang: string) => {
      setLanguage(newLang);
      if (problemId) {
        apiGet<{ template: string | null }>(
          `/api/problems/${problemId}/template?language=${newLang}`,
        )
          .then((tmpl) => {
            if (tmpl.template) setCodeFromTemplate(tmpl.template);
          })
          .catch(() => {});
      }
    },
    [problemId, setLanguage, setCodeFromTemplate],
  );

  const handleConsoleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (consoleInput && sessionId) {
          sendStdin(consoleInput);
          consoleOutputRef.current += consoleInput + '\n';
          setConsoleInput('');
          const runTab = consoleTabs.filter((t) => t.type === 'output').pop();
          if (runTab) {
            addConsoleTab({
              id: runTab.id,
              label: 'Run',
              type: 'output',
              content: consoleOutputRef.current,
            });
          }
        }
      }
    },
    [consoleInput, sessionId, sendStdin, consoleTabs, addConsoleTab, consoleOutputRef],
  );

  const evaluateAndReward = useCallback(
    () =>
      handleEvaluate(
        exercise!,
        code,
        language,
        (reward) => {
          pendingGemRewardRef.current = reward;
        },
        ({ score }) => {
          setEvaluationFeedback({
            id: Date.now(),
            status: score >= 60 ? 'success' : 'error',
            score,
          });
        },
      ),
    [exercise, code, language, handleEvaluate],
  );

  const dismissEvaluationFeedback = useCallback(() => {
    setEvaluationFeedback(null);

    if (pendingGemRewardRef.current) {
      setGemReward(pendingGemRewardRef.current);
      pendingGemRewardRef.current = null;
    }
  }, []);

  const returnToLesson = useCallback(() => {
    if (!lessonId) {
      router.back();
      return;
    }

    router.replace(`/dashboard/lessons/${lessonId}`);
    router.refresh();
  }, [lessonId, router]);

  return (
    <>
      <div className="flex h-[calc(100vh-5rem)] -m-6 overflow-hidden">
        {exercise && (
          <ExerciseStatement
            exercise={exercise}
            problemId={problemId}
            showStatement={showStatement}
            onClose={() => setShowStatement(false)}
            submissions={submissions}
          />
        )}

        {!exercise && (
          <OptionsPanel
            showOptions={showOptions}
            onClose={() => setShowOptions(false)}
            language={language}
            onLanguageChange={handleLanguageChange}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            tabSize={tabSize}
            onTabSizeChange={setTabSize}
            caretAnimation={caretAnimation}
            onCaretAnimationChange={(anim) =>
              setCaretAnimation(anim as 'blink' | 'smooth' | 'phase' | 'expand' | 'solid')
            }
          />
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <LabToolbar
            mode={exercise ? 'exercise' : 'playground'}
            exerciseMode={
              exercise
                ? {
                    onBack: returnToLesson,
                    showStatement,
                    onShowStatement: () => setShowStatement(true),
                    availableLanguages: exercise.availableLanguages ?? ALL_LANGUAGES,
                    language,
                    onLanguageChange: handleLanguageChange,
                  }
                : undefined
            }
            playgroundMode={
              !exercise
                ? {
                    showOptions,
                    onShowOptions: () => setShowOptions(true),
                  }
                : undefined
            }
            running={running}
            evaluating={evaluating}
            onRun={() => handleRun(code, language)}
            onEvaluate={exercise ? evaluateAndReward : undefined}
          />

          <div className="flex-1 overflow-hidden">
            <LabEditor
              value={code}
              onChange={setCode}
              language={language === 'python' ? 'python' : language}
              fontSize={fontSize}
              tabSize={tabSize}
              caretAnimation={caretAnimation}
            />
          </div>

          <ConsolePanel
            showConsole={showConsole}
            onToggle={() => setShowConsole(!showConsole)}
            consoleHeight={consoleHeight}
            onStartResize={startResize}
            consoleTabs={consoleTabs}
            activeConsoleTab={activeConsoleTab}
            onActiveTabChange={setActiveConsoleTab}
            activeConsole={activeConsole}
            sessionId={sessionId}
            consoleInput={consoleInput}
            onConsoleInputChange={setConsoleInput}
            onConsoleKeyDown={handleConsoleKeyDown}
            onStopSession={stopSession}
            onClearConsole={clearConsole}
          />
        </div>
      </div>
      <OperationResultMascot
        status={evaluationFeedback?.status ?? null}
        resultKey={evaluationFeedback?.id}
        title={evaluationFeedback?.status === 'success' ? '¡VAMOOOS!' : '¡Oh no!'}
        description={
          evaluationFeedback?.status === 'success'
            ? '¡Lo lograste! Tu código superó el desafío.'
            : 'No salió esta vez. Ajustá tu código y volvé a intentarlo.'
        }
        score={evaluationFeedback?.score}
        onDismiss={dismissEvaluationFeedback}
      />
      <GemRewardPopup reward={gemReward} onDismiss={() => setGemReward(null)} />
    </>
  );
}
