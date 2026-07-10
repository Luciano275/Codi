'use client';

import { CheckCircle2, Terminal, X, PanelBottomClose, PanelBottomOpen } from 'lucide-react';
import type { ConsoleTab } from '@/hooks/lab/types';

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'text-pradera-600 bg-pradera-50',
  MEDIUM: 'text-desierto-600 bg-desierto-50',
  HARD: 'text-volcan-600 bg-volcan-50',
  EXPERT: 'text-bosque-600 bg-bosque-50',
};

interface ConsolePanelProps {
  showConsole: boolean;
  onToggle: () => void;
  consoleHeight: number;
  onStartResize: (e: React.MouseEvent) => void;
  consoleTabs: ConsoleTab[];
  activeConsoleTab: string | null;
  onActiveTabChange: (id: string) => void;
  activeConsole: ConsoleTab | undefined;
  sessionId: string | null;
  consoleInput: string;
  onConsoleInputChange: (val: string) => void;
  onConsoleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onStopSession: () => void;
  onClearConsole: () => void;
}

export function ConsolePanel({
  showConsole,
  onToggle,
  consoleHeight,
  onStartResize,
  consoleTabs,
  activeConsoleTab,
  onActiveTabChange,
  activeConsole,
  sessionId,
  consoleInput,
  onConsoleInputChange,
  onConsoleKeyDown,
  onStopSession,
  onClearConsole,
}: ConsolePanelProps) {
  if (!showConsole) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 border-t border-gray-200 bg-[#252526] px-4 py-1.5 text-[11px] font-medium text-gray-400 transition-colors hover:text-gray-200"
      >
        <PanelBottomOpen className="h-3.5 w-3.5" />
        Mostrar consola
      </button>
    );
  }

  return (
    <>
      <div
        onMouseDown={onStartResize}
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
                onClick={() => onActiveTabChange(tab.id)}
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
              onClick={onClearConsole}
              className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-200"
              title="Limpiar consola"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onToggle}
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

        <div className="border-t border-gray-700 bg-[#252526] px-2 py-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-gray-500">{sessionId ? '>' : '$'}</span>
            <input
              value={consoleInput}
              onChange={(e) => onConsoleInputChange(e.target.value)}
              onKeyDown={onConsoleKeyDown}
              placeholder={sessionId ? 'Escribí entrada y presioná Enter...' : 'Presioná RUN para ejecutar'}
              disabled={!sessionId}
              className="flex-1 bg-transparent px-2 py-1 font-mono text-[11px] text-gray-300 outline-none placeholder:text-gray-600 disabled:opacity-40"
            />
            {sessionId && (
              <button
                onClick={onStopSession}
                className="rounded px-1.5 py-0.5 text-[10px] text-volcan-400 transition-colors hover:bg-volcan-500/10"
              >
                Detener
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
