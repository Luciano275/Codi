'use client';

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LabEditor from './editor';
import {
  OperationResultMascot,
  type OperationResultStatus,
} from '@/components/feedback/OperationResultMascot';
import { GemRewardPopup } from '@/components/lab/GemRewardPopup';
import { ExerciseStatement } from '@/components/lab/ExerciseStatement';
import { LabMobileTabs, type LabMobileTab } from '@/components/lab/LabMobileTabs';
import { LabToolbar } from '@/components/lab/LabToolbar';
import { OptionsPanel } from '@/components/lab/OptionsPanel';
import { ConsolePanel } from '@/components/lab/ConsolePanel';
import { useCodePersistence } from '@/hooks/lab/useCodePersistence';
import { useExercise } from '@/hooks/lab/useExercise';
import { useConsole } from '@/hooks/lab/useConsole';
import { useSession } from '@/hooks/lab/useSession';
import { useEvaluation } from '@/hooks/lab/useEvaluation';
import { useResizable } from '@/hooks/lab/useResizable';
import { useIsMobile } from '@/hooks/lab/useIsMobile';
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

  const mobileTab: LabMobileTab = searchParams.get('tab') === 'statement' ? 'statement' : 'code';

  const setMobileTab = useCallback(
    (tab: LabMobileTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.replace(`/dashboard/lab?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

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
  const { sessionActive, running, handleRun, sendStdin, stopSession, cleanup, consoleOutputRef } =
    useSession(addConsoleTab);
  const { evaluating, handleEvaluate } = useEvaluation(addConsoleTab);

  const { height: consoleHeight, startResize } = useResizable(280);
  const isMobile = useIsMobile(1024);

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
        handleRun(code, language, problemId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun, code, language, problemId]);

  useEffect(() => cleanup, [cleanup]);

  useLayoutEffect(() => {
    if (isMobile) setShowOptions(false);
  }, [isMobile]);

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
        if (consoleInput && sessionActive) {
          sendStdin(consoleInput);
          setConsoleInput('');
        }
      }
    },
    [consoleInput, sessionActive, sendStdin],
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
      <div className="relative flex h-[calc(100dvh-4rem)] -m-3 flex-col overflow-hidden md:h-[calc(100vh-5rem)] md:-m-5 lg:-m-6 lg:flex-row">
        {exercise && isMobile && <LabMobileTabs active={mobileTab} onChange={setMobileTab} />}

        {exercise && (isMobile ? mobileTab === 'statement' : showStatement) && (
          <ExerciseStatement
            exercise={exercise}
            problemId={problemId}
            showStatement={isMobile ? true : showStatement}
            onClose={() => setShowStatement(false)}
            submissions={submissions}
          />
        )}

        {!exercise && showOptions && (
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

        <div
          className={`flex min-w-0 flex-1 flex-col overflow-hidden ${
            isMobile && exercise && mobileTab === 'statement' ? 'hidden' : ''
          }`}
        >
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
            onRun={() => handleRun(code, language, problemId)}
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
            sessionActive={sessionActive}
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
