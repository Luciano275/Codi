'use client';

import { useState, useCallback, useRef } from 'react';
import type { ConsoleTab } from './types';

export function useSession(addConsoleTab: (tab: ConsoleTab) => void) {
  const [sessionActive, setSessionActive] = useState(false);
  const [running, setRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionActiveRef = useRef(false);
  const consoleOutputRef = useRef('');

  const handleRun = useCallback(
    async (code: string, language: string) => {
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
        await startPlaygroundSession(code, language);
        sessionActiveRef.current = true;
        setSessionActive(true);

        const evtSource = new EventSource('/api/playground/stream');
        eventSourceRef.current = evtSource;
        evtSource.addEventListener('stdout', (e) => {
          consoleOutputRef.current += e.data.replace(/\\n/g, '\n');
          addConsoleTab({
            id: tabId,
            label: 'Run',
            type: 'output',
            content: consoleOutputRef.current,
          });
        });
        evtSource.addEventListener('stderr', (e) => {
          consoleOutputRef.current += `\n⚠ ${e.data.replace(/\\n/g, '\n')}`;
          addConsoleTab({
            id: tabId,
            label: 'Run',
            type: 'output',
            content: consoleOutputRef.current,
          });
        });
        evtSource.addEventListener('timeout', (e) => {
          consoleOutputRef.current += `\n⚠ Error: ${e.data.replace(/\\n/g, '\n')}`;
          addConsoleTab({
            id: tabId,
            label: 'Run',
            type: 'output',
            content: consoleOutputRef.current,
          });
        });
        evtSource.addEventListener('exit', () => {
          finishSession(evtSource);
        });
        evtSource.addEventListener('error', () => {
          finishSession(evtSource);
        });
      } catch (error) {
        sessionActiveRef.current = false;
        setSessionActive(false);
        addConsoleTab({
          id: tabId,
          label: 'Run',
          type: 'output',
          content: '',
          error: error instanceof Error ? error.message : 'No se pudo iniciar la ejecución',
        });
        setRunning(false);
      }

      function finishSession(eventSource: EventSource): void {
        eventSource.close();
        eventSourceRef.current = null;
        sessionActiveRef.current = false;
        setSessionActive(false);
        setRunning(false);
        void stopPlaygroundSession();
      }
    },
    [addConsoleTab],
  );

  const sendStdin = useCallback(async (text: string) => {
    if (!sessionActiveRef.current) return;
    try {
      await fetch('/api/playground/input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: text }),
      });
    } catch {}
  }, []);

  const stopSession = useCallback(async () => {
    if (!sessionActiveRef.current) return;
    sessionActiveRef.current = false;
    await stopPlaygroundSession();
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setSessionActive(false);
    setRunning(false);
  }, []);

  const cleanup = useCallback(() => {
    eventSourceRef.current?.close();
    if (sessionActiveRef.current) {
      sessionActiveRef.current = false;
      void stopPlaygroundSession();
    }
  }, []);

  return {
    sessionActive,
    running,
    handleRun,
    sendStdin,
    stopSession,
    cleanup,
    consoleOutputRef,
    setRunning,
    eventSourceRef,
  };
}

async function startPlaygroundSession(code: string, language: string): Promise<void> {
  const response = await fetch('/api/playground/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });
  if (response.ok) return;

  const payload = (await response.json().catch(() => null)) as { message?: unknown } | null;
  throw new Error(
    typeof payload?.message === 'string' ? payload.message : `HTTP ${response.status}`,
  );
}

async function stopPlaygroundSession(): Promise<void> {
  await fetch('/api/playground/stop', { method: 'POST' }).catch(() => undefined);
}
