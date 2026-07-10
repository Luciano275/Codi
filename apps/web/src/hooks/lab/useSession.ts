'use client';

import { useState, useCallback, useRef } from 'react';
import { apiPost } from '@/lib/lab-api';
import type { ConsoleTab } from './types';

export function useSession(addConsoleTab: (tab: ConsoleTab) => void) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const consoleOutputRef = useRef('');

  const handleRun = useCallback(async (code: string, language: string) => {
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
  }, [addConsoleTab]);

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

  const cleanup = useCallback(() => {
    eventSourceRef.current?.close();
  }, []);

  return { sessionId, running, handleRun, sendStdin, stopSession, cleanup, consoleOutputRef, setRunning, eventSourceRef };
}
