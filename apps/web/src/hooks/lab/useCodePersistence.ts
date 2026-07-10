'use client';

import { useState, useEffect, useRef } from 'react';

export function useCodePersistence(storageKey: string, defaultCode: string) {
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState('python');
  const [codeReady, setCodeReady] = useState(false);
  const firstSave = useRef(false);
  const initialCodeSet = useRef(false);

  useEffect(() => {
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
    localStorage.setItem(storageKey, JSON.stringify({ code, language }));
  }, [code, language, storageKey, codeReady]);

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
