'use client';

import { useRef, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { PYTHON_KEYWORDS, PYTHON_BUILTINS, PYTHON_SNIPPETS } from '@/lib/editor/python-completions';
import { CPP_KEYWORDS, CPP_STDLIB_FUNCTIONS, CPP_SNIPPETS } from '@/lib/editor/cpp-completions';

interface LabEditorProps {
  value: string;
  onChange: (val: string) => void;
  language: string;
  fontSize: number;
  tabSize: number;
  caretAnimation: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
}

const EDITOR_DEFAULT_OPTIONS = {
  fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on' as const,
  renderWhitespace: 'selection' as const,
  insertSpaces: true,
  automaticLayout: true,
  padding: { top: 12 },
  suggestOnTriggerCharacters: true,
  quickSuggestions: { other: true, comments: true, strings: true },
  tabCompletion: 'on' as const,
  bracketPairColorization: { enabled: true },
  autoClosingBrackets: 'always' as const,
  autoClosingQuotes: 'always' as const,
  formatOnPaste: true,
  wordWrap: 'on' as const,
  snippetSuggestions: 'inline' as const,
  suggest: {
    showKeywords: true,
    showSnippets: true,
    showMethods: true,
    showFunctions: true,
    showConstructors: true,
    showFields: true,
    showVariables: true,
    showClasses: true,
    showModules: true,
    showProperties: true,
    showOperators: true,
    showValues: true,
    showConstants: true,
    showEnums: true,
    showEnumMembers: true,
    showReferences: true,
    showWords: true,
  },
};

function buildRange(model: any, position: any) {
  const word = model.getWordUntilPosition(position);
  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };
}

function registerPythonCompletion(monaco: any, range: any) {
  const suggestions: any[] = [];

  for (const kw of PYTHON_KEYWORDS) {
    suggestions.push({
      label: kw,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: kw,
      range,
    });
  }

  for (const fn of PYTHON_BUILTINS) {
    suggestions.push({
      label: fn,
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: `${fn}()`,
      range,
    });
  }

  for (const snip of PYTHON_SNIPPETS) {
    suggestions.push({
      label: snip.label,
      detail: snip.detail,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: snip.insertText,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    });
  }

  return suggestions;
}

function registerCppCompletion(monaco: any, range: any) {
  const suggestions: any[] = [];

  for (const kw of CPP_KEYWORDS) {
    suggestions.push({
      label: kw,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: kw === 'include' ? '#include <$1>' : kw,
      insertTextRules: kw === 'include'
        ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        : undefined,
      range,
    });
  }

  for (const fn of CPP_STDLIB_FUNCTIONS) {
    suggestions.push({
      label: fn,
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: fn,
      range,
    });
  }

  for (const snip of CPP_SNIPPETS) {
    suggestions.push({
      label: snip.label,
      detail: snip.detail,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: snip.insertText,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    });
  }

  return suggestions;
}

export default function LabEditor({ value, onChange, language, fontSize, tabSize, caretAnimation }: LabEditorProps) {
  const editorRef = useRef<any>(null);

  const handleMount: OnMount = useCallback((editorInstance, monaco) => {
    editorRef.current = editorInstance;

    const provider = {
      triggerCharacters: language === 'python' ? ['.', '(', ' '] : ['.', '>', ':', ' '],
      provideCompletionItems: (model: any, position: any) => {
        const range = buildRange(model, position);
        const suggestions = language === 'python'
          ? registerPythonCompletion(monaco, range)
          : registerCppCompletion(monaco, range);
        return { suggestions };
      },
    };

    monaco.languages.registerCompletionItemProvider(language, provider);
  }, [language]);

  return (
    <Editor
      height="100%"
      language={language}
      theme="vs-dark"
      value={value}
      onChange={(val) => onChange(val || '')}
      onMount={handleMount}
      options={{
        ...EDITOR_DEFAULT_OPTIONS,
        fontSize,
        tabSize,
        cursorBlinking: caretAnimation,
      }}
      loading={
        <div className="flex h-full w-full items-center justify-center bg-[#1e1e1e]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-gray-300" />
        </div>
      }
    />
  );
}
