'use client';

import { useState, useCallback } from 'react';
import type { ConsoleTab } from './types';

export function useConsole() {
  const [consoleTabs, setConsoleTabs] = useState<ConsoleTab[]>([]);
  const [activeConsoleTab, setActiveConsoleTab] = useState<string | null>(null);

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

  const clearConsole = useCallback(() => {
    setConsoleTabs([]);
    setActiveConsoleTab(null);
  }, []);

  const activeConsole =
    consoleTabs.find((t) => t.id === activeConsoleTab) || consoleTabs[consoleTabs.length - 1];

  return {
    consoleTabs,
    activeConsoleTab,
    setActiveConsoleTab,
    activeConsole,
    addConsoleTab,
    clearConsole,
  };
}
