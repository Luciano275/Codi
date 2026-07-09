'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  CheckCircle2,
  FileCode2,
  FileText,
  Terminal,
  FlaskConical,
  PanelLeftOpen,
  PanelLeftClose,
  PanelBottomOpen,
  PanelBottomClose,
  X,
  Loader2,
  ExternalLink,
  BookOpen,
  Zap,
  Gem,
  ArrowLeft,
} from 'lucide-react';
import LabEditor from './editor';

const DEFAULT_CODE = `# Laboratorio de Python
# Escribí tu código aquí y presioná RUN

print("¡Hola, Codi!")`;

const ALL_LANGUAGES = [
  { id: 'python', label: 'Python 3', extension: 'py' },
  { id: 'cpp', label: 'C++', extension: 'cpp' },
];

interface ConsoleTab {
  id: string;
  label: string;
  type: 'output' | 'evaluation';
  content: string;
  error?: string;
  score?: number;
  status?: string;
}

interface LangInfo {
  id: string;
  label: string;
  extension: string;
}

interface ExerciseInfo {
  id: string;
  title: string;
  difficulty: string;
  xpReward: number;
  gemsReward: number;
  cmsTaskId: number;
  cmsTaskName?: string;
  attachmentUrl?: string;
  content?: Record<string, unknown>;
  availableLanguages?: LangInfo[];
}

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

function GemRewardPopup({ reward }: { reward: { amount: number; exerciseTitle: string } | null }) {
  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          key="gem-reward"
          initial={{ opacity: 0, y: -60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.8 }}
          transition={{ type: 'spring', damping: 18, stiffness: 260 }}
          className="fixed left-1/2 top-8 z-[100] -translate-x-1/2"
        >
          <motion.div
            initial={{ rotate: -8 }}
            animate={{ rotate: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.15 }}
            className="flex items-center gap-4 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 px-6 py-4 shadow-2xl shadow-amber-500/20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 8, stiffness: 220, delay: 0.3 }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/40"
            >
              <Gem className="h-6 w-6 text-white drop-shadow-sm" />
            </motion.div>
            <div className="flex flex-col">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="font-candy-beans text-lg text-amber-900"
              >
                +{reward.amount} gemas
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="font-simply-olive text-xs text-amber-700/80"
              >
                por completar &quot;{reward.exerciseTitle}&quot;
              </motion.span>
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const el = document.getElementById('gem-reward-close');
                el?.click();
              }}
              className="ml-2 rounded-full p-1 text-amber-400/60 transition-colors hover:bg-amber-200/50 hover:text-amber-600"
            >
              <X className="h-4 w-4" />
            </motion.button>
            {/* Floating sparkle particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  x: [0, (i % 2 === 0 ? 1 : -1) * (30 + i * 8)],
                  y: [0, -40 - i * 10],
                }}
                transition={{ duration: 1.2, delay: 0.3 + i * 0.12, ease: 'easeOut' }}
                className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-amber-300"
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const PROXY = '/api/proxy';

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${PROXY}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${PROXY}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export default function LabClient({ user }: { user: { id: string; username: string; displayName: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const problemId = searchParams.get('problemId');
  const STORAGE_KEY = problemId ? `codi_lab_code_${user.id}_${problemId}` : 'codi_lab_code';

  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_CODE);
  const [consoleTabs, setConsoleTabs] = useState<ConsoleTab[]>([]);
  const [activeConsoleTab, setActiveConsoleTab] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const [showConsole, setShowConsole] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(280);
  const resizing = useRef(false);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    const startY = e.clientY;
    const startH = consoleHeight;
    const onMouseMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      setConsoleHeight(Math.max(120, startH - (ev.clientY - startY)));
    };
    const onMouseUp = () => { resizing.current = false; window.removeEventListener('mousemove', onMouseMove); };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp, { once: true });
  }, [consoleHeight]);
  const [showStatement, setShowStatement] = useState(true);
  const [exercise, setExercise] = useState<ExerciseInfo | null>(null);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [consoleInput, setConsoleInput] = useState('');
  const consoleOutputRef = useRef('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const [codeReady, setCodeReady] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [caretAnimation, setCaretAnimation] = useState<'blink' | 'smooth' | 'phase' | 'expand' | 'solid'>('smooth');
  const [tabSize, setTabSize] = useState(4);
  const gemRewardClaimedRef = useRef(false);
  const [gemReward, setGemReward] = useState<{ amount: number; exerciseTitle: string } | null>(null);
  const codeInitialized = useRef(false);

  // Load code + language from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved.code) setCode(saved.code);
        if (saved.language) setLanguage(saved.language);
        codeInitialized.current = true;
      } catch {
        // Legacy plain-text fallback
        setCode(raw);
        codeInitialized.current = true;
      }
    }
    setCodeReady(true);
    // Playground mode: always mark as initialized (no template to wait for)
    if (!problemId) {
      codeInitialized.current = true;
    }
  }, [STORAGE_KEY]);

  // Save on every change (only after code has been explicitly initialized)
  useEffect(() => {
    if (!codeReady) return;
    if (!codeInitialized.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, language }));
  }, [code, language, STORAGE_KEY, codeReady]);

  useEffect(() => {
    if (problemId) {
      setLoadingExercise(true);
      apiGet<ExerciseInfo>(`/api/problems/${problemId}`)
        .then((data) => {
           setExercise(data);
           const langs = data.availableLanguages ?? ALL_LANGUAGES;
           const effectiveLang = langs.some((l) => l.id === language) ? language : (langs[0]?.id ?? 'python');
           if (effectiveLang !== language) setLanguage(effectiveLang);
          const saved = localStorage.getItem(STORAGE_KEY);
          if (!saved) {
            apiGet<{ template: string | null; templateFilename: string | null; language: string | null }>(
              `/api/problems/${problemId}/template?language=${effectiveLang}`,
            )
              .then((tmpl) => {
                if (tmpl.template) {
                  setCode(tmpl.template);
                }
                codeInitialized.current = true;
              })
              .catch(() => {
                codeInitialized.current = true;
              });
          } else {
            codeInitialized.current = true;
          }
          apiGet<any[]>(`/api/submissions`).then((subs) => {
            setSubmissions(subs.filter((s: any) => s.problemId === problemId));
          }).catch(() => {});
        })
        .catch(() => {
          setExercise({
            id: problemId,
            title: `Ejercicio #${problemId}`,
            difficulty: 'EASY',
            xpReward: 50,
            gemsReward: 0,
            cmsTaskId: 0,
          });
        })
        .finally(() => setLoadingExercise(false));
    } else {
      setExercise(null);
      setSubmissions([]);
    }
  }, [problemId]);

  useEffect(() => {
    if (!problemId) return;
    const interval = setInterval(() => {
      apiGet<any[]>(`/api/submissions`).then((subs) => {
        setSubmissions((prev) => {
          const updated = subs.filter((s: any) => s.problemId === problemId);
          return updated.length ? updated : prev;
        });
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [problemId]);

  const addConsoleTab = useCallback((tab: ConsoleTab) => {
    setConsoleTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === tab.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = tab;
        return next;
      }
      return [...prev, tab];
    });
    setActiveConsoleTab(tab.id);
  }, []);

  const handleRun = useCallback(async () => {
    setRunning(true);
    const tabId = `run_${Date.now()}`;
    consoleOutputRef.current = '';
    addConsoleTab({
      id: tabId,
      label: 'Run',
      type: 'output',
      content: 'Ejecutando...',
    });

    try {
      const { sessionId: sid } = await apiPost<{ sessionId: string }>('/api/playground/start', {
        code,
        language,
      });
      setSessionId(sid);

      // Connect SSE stream
      const evtSource = new EventSource(`/api/proxy/api/playground/stream/${sid}?_sse=1`);
      eventSourceRef.current = evtSource;
      evtSource.addEventListener('stdout', (e) => {
        consoleOutputRef.current += e.data.replace(/\\n/g, '\n');
        addConsoleTab({ id: tabId, label: 'Run', type: 'output', content: consoleOutputRef.current });
      });
      evtSource.addEventListener('stderr', (e) => {
        consoleOutputRef.current += `\n⚠ ${e.data.replace(/\\n/g, '\n')}`;
        addConsoleTab({ id: tabId, label: 'Run', type: 'output', content: consoleOutputRef.current });
      });
      evtSource.addEventListener('timeout', (e) => {
        consoleOutputRef.current += `\n⚠ Error: ${e.data.replace(/\\n/g, '\n')}`;
        addConsoleTab({ id: tabId, label: 'Run', type: 'output', content: consoleOutputRef.current });
      });
      evtSource.addEventListener('exit', () => {
        evtSource.close();
        eventSourceRef.current = null;
        setSessionId(null);
        setRunning(false);
      });
      evtSource.addEventListener('error', () => {
        evtSource.close();
        eventSourceRef.current = null;
        setSessionId(null);
        setRunning(false);
      });
    } catch (err: any) {
      setSessionId(null);
      addConsoleTab({ id: tabId, label: 'Run', type: 'output', content: '', error: err.message });
      setRunning(false);
    }
  }, [code, language, addConsoleTab]);

  const handleEvaluate = useCallback(async () => {
    if (!exercise) return;
    setEvaluating(true);
    const tabId = `eval_${Date.now()}`;
    addConsoleTab({
      id: tabId,
      label: 'Evaluación',
      type: 'evaluation',
      content: 'Enviando para evaluación...',
    });

    try {
      const result = await apiPost<any>('/api/submissions/evaluate', {
        problemId: exercise.id,
        code,
        language,
      });
      addConsoleTab({
        id: tabId,
        label: 'Evaluación',
        type: 'evaluation',
        content: 'Evaluación enviada. Esperando resultados...',
        status: 'EVALUATING',
      });

      const pollInterval = setInterval(async () => {
        try {
          const submission = await apiGet<any>(`/api/submissions/${result.id}`);
          if (
            submission.status !== 'PENDING' &&
            submission.status !== 'EVALUATING' &&
            submission.status !== 'COMPILING'
          ) {
            clearInterval(pollInterval);
            const score = submission.score ?? 0;
            const label = STATUS_LABELS[submission.status] || submission.status;
            const icon = submission.status === 'ACCEPTED' ? '✅' : '❌';
            addConsoleTab({
              id: tabId,
              label: 'Evaluación',
              type: 'evaluation',
              content:
                `${icon} ${label}\n` +
                `Puntaje: ${score}/100\n\n` +
                `Resultados:\n${JSON.stringify(submission.cmsResults, null, 2)}`,
              score,
              status: submission.status,
            });
            setEvaluating(false);

            if (
              submission.status === 'ACCEPTED' &&
              exercise?.gemsReward &&
              exercise.gemsReward > 0 &&
              !gemRewardClaimedRef.current
            ) {
              gemRewardClaimedRef.current = true;
              setGemReward({ amount: exercise.gemsReward, exerciseTitle: exercise.title });
              window.dispatchEvent(new CustomEvent('user-updated'));
              setTimeout(() => setGemReward(null), 5000);
            }
          }
        } catch {
          // continue polling
        }
      }, 1500);

      setTimeout(() => {
        clearInterval(pollInterval);
        setEvaluating(false);
      }, 60000);
    } catch (err: any) {
      addConsoleTab({
        id: tabId,
        label: 'Evaluación',
        type: 'evaluation',
        content: '',
        error: err.message,
      });
      setEvaluating(false);
    }
  }, [exercise, code, language, addConsoleTab]);

  const sendStdin = useCallback(async (text: string) => {
    if (!sessionId) return;
    try {
      await fetch(`/api/proxy/api/playground/input/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: text }),
      });
    } catch {}
  }, [sessionId]);

  const stopSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      await fetch(`/api/proxy/api/playground/stop/${sessionId}`, { method: 'POST' });
    } catch {}
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setSessionId(null);
    setRunning(false);
  }, [sessionId]);

  const handleLanguageChange = useCallback((newLang: string) => {
    setLanguage(newLang);
    if (problemId) {
      apiGet<{ template: string | null; templateFilename: string | null; language: string | null }>(
        `/api/problems/${problemId}/template?language=${newLang}`,
      )
        .then((tmpl) => {
          if (tmpl.template) {
            setCode(tmpl.template);
          }
        })
        .catch(() => {});
    }
  }, [problemId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const handleConsoleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (consoleInput && sessionId) {
        sendStdin(consoleInput);
        consoleOutputRef.current += consoleInput + '\n';
        setConsoleInput('');
        // Find the last Run tab to update
        const runTab = consoleTabs.filter(t => t.type === 'output').pop();
        if (runTab) {
          addConsoleTab({ id: runTab.id, label: 'Run', type: 'output', content: consoleOutputRef.current });
        }
      }
    }
  }, [consoleInput, sessionId, sendStdin, consoleTabs, addConsoleTab]);

  const clearConsole = useCallback(() => {
    setConsoleTabs([]);
    setActiveConsoleTab(null);
  }, []);

  // Ctrl+Enter → RUN
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun]);

  const activeConsole =
    consoleTabs.find((t) => t.id === activeConsoleTab) || consoleTabs[consoleTabs.length - 1];

  // ─── Exercise mode: statement (left) + editor (right) ───
  if (exercise) {
    return (
      <>
      <div className="flex h-[calc(100vh-5rem)] -m-6 overflow-hidden">
        {/* Left: Statement panel */}
        {showStatement && (
          <aside className="flex w-[720px] flex-shrink-0 flex-col border-r border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-lagos-500" />
                <span className="font-simply-olive text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Enunciado
                </span>
              </div>
              <button
                onClick={() => setShowStatement(false)}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Problem info bar */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5">
                <h2 className="font-super-pandora text-sm text-gray-900">
                  {exercise.title}
                </h2>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    DIFFICULTY_COLORS[exercise.difficulty] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {DIFFICULTY_LABELS[exercise.difficulty] || exercise.difficulty}
                </span>
                <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-400" />
                    +{exercise.xpReward} XP
                  </span>
                  {exercise.cmsTaskId > 0 && (
                    <span className="flex items-center gap-1">
                      <FileCode2 className="h-3 w-3" />
                      #{exercise.cmsTaskId}
                    </span>
                  )}
                </div>
              </div>

              {/* PDF viewer */}
              <div className="relative flex-1 bg-gray-50">
                <iframe
                  src={`/api/proxy/api/problems/${problemId}/attachment`}
                  className="h-full w-full"
                  title="Enunciado del ejercicio"
                />
              </div>

              {/* Submissions section */}
              <div className="border-t border-gray-200 bg-white">
                <details className="group" open={submissions.length > 0}>
                  <summary className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400 transition-colors hover:bg-gray-50">
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
                      <div className="px-4 py-3 text-center text-xs text-gray-400">
                        Aún no realizaste envíos para este ejercicio.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {submissions.map((s, idx) => {
                          const isAccepted = s.status === 'ACCEPTED';
                          const isError = ['WRONG_ANSWER', 'COMPILATION_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED'].includes(s.status);
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
                                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                      s.score >= 100
                                        ? 'bg-pradera-100 text-pradera-700'
                                        : s.score >= 60
                                          ? 'bg-desierto-100 text-desierto-700'
                                          : 'bg-volcan-100 text-volcan-700'
                                    }`}>
                                      {s.score.toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                                <span className="text-gray-400">
                                  {STATUS_LABELS[s.status] || s.status}
                                </span>
                              </div>
                              <span className="shrink-0 text-gray-400">
                                {new Date(s.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        )}

        {/* Right: Editor + Console */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
                title="Volver"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
              <div className="h-4 w-px bg-gray-200" />
              {!showStatement && (
                <button
                  onClick={() => setShowStatement(true)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-lagos-600 transition-colors hover:bg-lagos-50"
                >
                  <BookOpen className="h-4 w-4" />
                  Enunciado
                </button>
              )}
              <FlaskConical className="h-4 w-4 text-valle-500" />
              <span className="font-super-pandora text-sm text-gray-700">Laboratorio</span>
              <span className="mx-1.5 text-gray-300">|</span>
              {(exercise.availableLanguages ?? ALL_LANGUAGES).length === 1 ? (
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                  Solo: {(exercise.availableLanguages ?? ALL_LANGUAGES)[0].label}
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  {(exercise.availableLanguages ?? ALL_LANGUAGES).map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id)}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        language === lang.id
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
                onClick={handleRun}
                disabled={running}
                className="flex items-center gap-1.5 rounded-lg bg-pradera-500 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-pradera-600 active:scale-95 disabled:opacity-50"
              >
                {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                RUN
              </button>
              <button
                onClick={handleEvaluate}
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

          {/* Editor */}
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

          {/* Console */}
          {showConsole ? (
            <>
              <div
                onMouseDown={startResize}
                className="h-1.5 cursor-row-resize bg-[#2d2d2d] transition-colors hover:bg-[#0e639c]"
              />
              <div
                style={{ height: consoleHeight }}
                className="flex flex-shrink-0 flex-col border-t border-gray-200 bg-[#1e1e1e]"
              >
                <div className="flex items-center justify-between border-b border-gray-700 bg-[#252526] px-2">
                <div className="flex items-center gap-0.5 overflow-x-auto">
                  {consoleTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveConsoleTab(tab.id)}
                      className={`flex items-center gap-1 rounded-t px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                        activeConsoleTab === tab.id
                          ? 'bg-[#1e1e1e] text-white'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {tab.type === 'evaluation' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Terminal className="h-3 w-3" />
                      )}
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={clearConsole}
                    className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-200"
                    title="Limpiar consola"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setShowConsole(false)}
                    className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-200"
                    title="Cerrar consola"
                  >
                    <PanelBottomClose className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed text-[#d4d4d4]">
                {activeConsole ? (
                  activeConsole.error ? (
                    <div className="text-volcan-400">
                      <span className="font-semibold">Error:</span> {activeConsole.error}
                    </div>
                  ) : activeConsole.score !== undefined ? (
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <span className="text-gray-400">Puntaje:</span>
                        <span
                          className={`text-base font-bold ${
                            activeConsole.score >= 100
                              ? 'text-pradera-400'
                              : activeConsole.score >= 50
                                ? 'text-desierto-400'
                                : 'text-volcan-400'
                          }`}
                        >
                          {activeConsole.score}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap text-gray-300">{activeConsole.content}</pre>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap">{activeConsole.content}</pre>
                  )
                ) : (
                  <span className="text-gray-500">Presioná RUN para ver la salida de tu código.</span>
                )}
              </div>
              {/* Interactive terminal input */}
              <div className="border-t border-gray-700 bg-[#252526] px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-gray-500">{sessionId ? '>' : '$'}</span>
                  <input
                    value={consoleInput}
                    onChange={(e) => setConsoleInput(e.target.value)}
                    onKeyDown={handleConsoleKeyDown}
                    placeholder={sessionId ? 'Escribí entrada y presioná Enter...' : 'Presioná RUN para ejecutar'}
                    disabled={!sessionId}
                    className="flex-1 bg-transparent px-2 py-1 font-mono text-[11px] text-gray-300 outline-none placeholder:text-gray-600 disabled:opacity-40"
                  />
                  {sessionId && (
                    <button
                      onClick={stopSession}
                      className="rounded px-1.5 py-0.5 text-[10px] text-volcan-400 transition-colors hover:bg-volcan-500/10"
                    >
                      Detener
                    </button>
                  )}
                </div>
              </div>
            </div>
            </>
          ) : (
            <button
              onClick={() => setShowConsole(true)}
              className="flex items-center gap-1.5 border-t border-gray-200 bg-[#252526] px-4 py-1.5 text-[11px] font-medium text-gray-400 transition-colors hover:text-gray-200"
            >
              <PanelBottomOpen className="h-3.5 w-3.5" />
              Mostrar consola
            </button>
          )}
        </div>
      </div>
      <GemRewardPopup reward={gemReward} />
    </>
  );
  }

  // ─── Playground mode: 3 columns ───
  return (
    <>
    <div className="flex h-[calc(100vh-5rem)] -m-6 overflow-hidden">
      {/* LEFT: Options panel */}
      {showOptions && (
        <aside className="flex w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
            <span className="font-simply-olive text-xs font-semibold uppercase tracking-wider text-gray-400">
              Opciones
            </span>
            <button
              onClick={() => setShowOptions(false)}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="border-b border-gray-200 p-3">
            <p className="mb-1.5 font-simply-olive text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Lenguaje
            </p>
            <div className="space-y-1">
              {ALL_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    language === lang.id
                      ? 'bg-valle-100 text-valle-700'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FileCode2 className="h-3.5 w-3.5" />
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editor settings */}
          <div className="border-b border-gray-200 p-3 space-y-3">
            <p className="font-simply-olive text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Editor
            </p>
            <div>
              <label className="mb-1 block text-[10px] text-gray-500">Tamaño fuente</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="28"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="flex-1 h-1 accent-valle-500"
                />
                <span className="w-5 text-center text-[10px] font-medium text-gray-600">{fontSize}</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-gray-500">Tab size</label>
              <div className="flex gap-1">
                {[2, 4, 6, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTabSize(n)}
                    className={`flex-1 rounded-md py-1 text-[10px] font-medium transition-colors ${
                      tabSize === n ? 'bg-valle-100 text-valle-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-gray-500">Cursor</label>
              <select
                value={caretAnimation}
                onChange={(e) => setCaretAnimation(e.target.value as any)}
                className="w-full rounded-md border-0 bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600"
              >
                <option value="blink">Parpadeo</option>
                <option value="smooth">Suave</option>
                <option value="phase">Fase</option>
                <option value="expand">Expandir</option>
                <option value="solid">Sólido</option>
              </select>
            </div>
          </div>
          <div className="p-3">
            <p className="mb-1.5 font-simply-olive text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Atajos
            </p>
            <div className="space-y-1 text-[10px] text-gray-500">
              <p><kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-[9px]">Ctrl+Space</kbd> Autocompletado</p>
              <p><kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-[9px]">Ctrl+S</kbd> Guardar</p>
              <p><kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-[9px]">Ctrl+Enter</kbd> Ejecutar</p>
            </div>
          </div>
        </aside>
      )}

      {/* RIGHT: Editor + Console */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
          <div className="flex items-center gap-2">
            {!showOptions && (
              <button
                onClick={() => setShowOptions(true)}
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
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 rounded-lg bg-pradera-500 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-pradera-600 active:scale-95 disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            RUN
          </button>
        </div>

        {/* Editor */}
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

        {/* Console */}
        {showConsole ? (
          <>
            <div
              onMouseDown={startResize}
              className="h-1.5 cursor-row-resize bg-[#2d2d2d] transition-colors hover:bg-[#0e639c]"
            />
            <div
              style={{ height: consoleHeight }}
              className="flex flex-shrink-0 flex-col border-t border-gray-200 bg-[#1e1e1e]"
            >
              <div className="flex items-center justify-between border-b border-gray-700 bg-[#252526] px-2">
              <div className="flex items-center gap-0.5 overflow-x-auto">
                {consoleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveConsoleTab(tab.id)}
                    className={`flex items-center gap-1 rounded-t px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                      activeConsoleTab === tab.id
                        ? 'bg-[#1e1e1e] text-white'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {tab.type === 'evaluation' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Terminal className="h-3 w-3" />
                    )}
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearConsole}
                  className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setShowConsole(false)}
                  className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-200"
                >
                  <PanelBottomClose className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed text-[#d4d4d4]">
              {activeConsole ? (
                activeConsole.error ? (
                  <div className="text-volcan-400">
                    <span className="font-semibold">Error:</span> {activeConsole.error}
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap">{activeConsole.content}</pre>
                )
              ) : (
                <span className="text-gray-500">Presioná RUN para ver la salida de tu código.</span>
              )}
            </div>
            {/* Interactive terminal input */}
            <div className="border-t border-gray-700 bg-[#252526] px-2 py-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-gray-500">{sessionId ? '>' : '$'}</span>
                <input
                  value={consoleInput}
                  onChange={(e) => setConsoleInput(e.target.value)}
                  onKeyDown={handleConsoleKeyDown}
                  placeholder={sessionId ? 'Escribí entrada y presioná Enter...' : 'Presioná RUN para ejecutar'}
                  disabled={!sessionId}
                  className="flex-1 bg-transparent px-2 py-1 font-mono text-[11px] text-gray-300 outline-none placeholder:text-gray-600 disabled:opacity-40"
                />
                {sessionId && (
                  <button
                    onClick={stopSession}
                    className="rounded px-1.5 py-0.5 text-[10px] text-volcan-400 transition-colors hover:bg-volcan-500/10"
                  >
                    Detener
                  </button>
                )}
              </div>
            </div>
          </div>
          </>
        ) : (
          <button
            onClick={() => setShowConsole(true)}
            className="flex items-center gap-1.5 border-t border-gray-200 bg-[#252526] px-4 py-1.5 text-[11px] font-medium text-gray-400 transition-colors hover:text-gray-200"
          >
            <PanelBottomOpen className="h-3.5 w-3.5" />
            Mostrar consola
          </button>
        )}
      </div>
    </div>
    <GemRewardPopup reward={gemReward} />
    </>
  );
}
