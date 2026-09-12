'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';

const SAVE_DEBOUNCE_MS = 1_000;

export function useCodePersistence(storageKey: string, defaultCode: string) {
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState('python');
  const [codeReady, setCodeReady] = useState(false);
  const firstSave = useRef(false);
  const initialCodeSet = useRef(false);
  const saveCode = useDebouncedCallback(
    (nextCode: string, nextLanguage: string, nextStorageKey: string) => {
      localStorage.setItem(nextStorageKey, JSON.stringify({ code: nextCode, language: nextLanguage }));
    },
    SAVE_DEBOUNCE_MS,
  );

  useEffect(() => {
    firstSave.current = false;
    setCodeReady(false);
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved.code) {
          setCode(saved.code);
          initialCodeSet.current = true;
        }
        if (saved.language) setLanguage(saved.language);
      } catch {
        setCode(raw);
        initialCodeSet.current = true;
      }
    }
    setCodeReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!codeReady) return;
    if (!firstSave.current) {
      firstSave.current = true;
      return;
    }
    saveCode(code, language, storageKey);
  }, [code, language, storageKey, codeReady, saveCode]);

  useEffect(() => () => saveCode.cancel(), [saveCode]);

  const setCodeFromTemplate = (template: string) => {
    if (!initialCodeSet.current) {
      setCode(template);
    }
  };

  return {
    code,
    setCode,
    language,
    setLanguage,
    codeReady,
    setCodeFromTemplate,
  };
}
