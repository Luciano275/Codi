'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const problemId = searchParams.get('problemId');
  const STORAGE_KEY = problemId ? `codi_lab_code_${problemId}` : 'codi_lab_code';

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

  // Load code from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setCode(saved);
    setCodeReady(true);
  }, [STORAGE_KEY]);

  // Save on every change (skip until loaded to avoid overwriting on mount)
  useEffect(() => {
    if (!codeReady) return;
    localStorage.setItem(STORAGE_KEY, code);
  }, [code, STORAGE_KEY, codeReady]);

  useEffect(() => {
    if (problemId) {
      setLoadingExercise(true);
      apiGet<ExerciseInfo>(`/api/problems/${problemId}`)
        .then((data) => {
          setExercise(data);
          const langs = data.availableLanguages ?? ALL_LANGUAGES;
          if (!langs.some((l) => l.id === language)) {
            setLanguage(langs[0]?.id ?? 'python');
          }
          const saved = localStorage.getItem(STORAGE_KEY);
          if (!saved) {
            setCode(`# ${data.title}\n# Resolvé el ejercicio aquí\n\n`);
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

  const attachmentUrl = exercise?.attachmentUrl;

  // ─── Exercise mode: statement (left) + editor (right) ───
  if (exercise) {
    return (
      <div className="flex h-[calc(100vh-5rem)] -m-6 overflow-hidden">
        {/* Left: Statement panel */}
        {showStatement && (
          <aside className="flex w-[420px] flex-shrink-0 flex-col border-r border-gray-200 bg-white">
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

            <div className="flex-1 overflow-y-auto p-4">
              {/* Problem header */}
              <div className="mb-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-super-pandora text-lg text-gray-900">
                    {exercise.title}
                  </h2>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                      DIFFICULTY_COLORS[exercise.difficulty] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {DIFFICULTY_LABELS[exercise.difficulty] || exercise.difficulty}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
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

              {/* Problem content / description */}
              {exercise.content?.description ? (
                <div className="prose prose-sm max-w-none text-gray-700">
                  {(exercise.content.description as string).split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-xs text-gray-400">
                    El enunciado de este ejercicio está disponible como PDF.
                  </p>
                </div>
              )}

              {/* PDF attachment link */}
              {attachmentUrl && (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-lagos-600 transition-colors hover:bg-lagos-50"
                >
                  <FileText className="h-5 w-5 shrink-0" />
                  <span className="flex-1 font-medium">Descargar enunciado (PDF)</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              {/* Previous submissions */}
              {submissions.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-2 font-simply-olive text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Mis envíos ({submissions.length})
                  </h4>
                  <div className="space-y-1">
                    {submissions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            s.status === 'ACCEPTED'
                              ? 'bg-pradera-500'
                              : s.status === 'WRONG_ANSWER' || s.status === 'COMPILATION_ERROR'
                                ? 'bg-volcan-500'
                                : 'bg-desierto-500'
                          }`}
                        />
                        <span className="flex-1">
                          {s.score != null ? `${s.score.toFixed(1)} pts` : STATUS_LABELS[s.status] || s.status}
                        </span>
                        <span className="text-gray-400">
                          {new Date(s.submittedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Right: Editor + Console */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
            <div className="flex items-center gap-2">
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
                      onClick={() => setLanguage(lang.id)}
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
    );
  }

  // ─── Playground mode: 3 columns ───
  return (
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
                  onClick={() => setLanguage(lang.id)}
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
  );
}
