'use client';

import { useRef, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';

interface LabEditorProps {
  value: string;
  onChange: (val: string) => void;
  language: string;
  fontSize: number;
  tabSize: number;
  caretAnimation: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
}

const PYTHON_KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
  'try', 'while', 'with', 'yield',
];

const PYTHON_BUILTINS = [
  'abs', 'all', 'any', 'bin', 'bool', 'bytearray', 'bytes', 'chr',
  'complex', 'dict', 'dir', 'divmod', 'enumerate', 'eval', 'exec',
  'filter', 'float', 'format', 'frozenset', 'getattr', 'globals',
  'hasattr', 'hash', 'help', 'hex', 'id', 'input', 'int', 'isinstance',
  'issubclass', 'iter', 'len', 'list', 'locals', 'map', 'max',
  'memoryview', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow',
  'print', 'property', 'range', 'repr', 'reversed', 'round', 'set',
  'setattr', 'slice', 'sorted', 'staticmethod', 'str', 'sum', 'super',
  'tuple', 'type', 'vars', 'zip', '__import__',
];

const PYTHON_SNIPPETS: Array<{ label: string; detail: string; insertText: string }> = [
  { label: 'def', detail: 'Define function', insertText: 'def ${1:name}(${2:args}):\n    ${3:pass}' },
  { label: 'class', detail: 'Define class', insertText: 'class ${1:Name}:\n    def __init__(self):\n        ${2:pass}' },
  { label: 'for', detail: 'For loop', insertText: 'for ${1:item} in ${2:items}:\n    ${3:pass}' },
  { label: 'while', detail: 'While loop', insertText: 'while ${1:condition}:\n    ${2:pass}' },
  { label: 'if', detail: 'If statement', insertText: 'if ${1:condition}:\n    ${2:pass}' },
  { label: 'elif', detail: 'Elif statement', insertText: 'elif ${1:condition}:\n    ${2:pass}' },
  { label: 'else', detail: 'Else statement', insertText: 'else:\n    ${1:pass}' },
  { label: 'try', detail: 'Try block', insertText: 'try:\n    ${1:pass}\nexcept ${2:Exception} as e:\n    ${3:pass}' },
  { label: 'with', detail: 'With block', insertText: 'with ${1:open} as ${2:var}:\n    ${3:pass}' },
  { label: 'print', detail: 'Print to console', insertText: 'print(${1:value})' },
  { label: 'ifmain', detail: 'if __name__ block', insertText: 'if __name__ == \'__main__\':\n    ${1:main()}' },
  { label: 'listcomp', detail: 'List comprehension', insertText: '[${1:expr} for ${2:item} in ${3:items}]' },
  { label: 'lambda', detail: 'Lambda function', insertText: 'lambda ${1:args}: ${2:expr}' },
  { label: 'import', detail: 'Import module', insertText: 'import ${1:module}' },
  { label: 'from', detail: 'Import from module', insertText: 'from ${1:module} import ${2:name}' },
];

export default function LabEditor({ value, onChange, language, fontSize, tabSize, caretAnimation }: LabEditorProps) {
  const editorRef = useRef<any>(null);

  const handleMount: OnMount = useCallback((editorInstance, monaco) => {
    editorRef.current = editorInstance;

    if (language === 'python') {
      monaco.languages.registerCompletionItemProvider('python', {
        triggerCharacters: ['.', '(', ' '],
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

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

          return { suggestions };
        },
      });
    }

    if (language === 'cpp') {
      monaco.languages.registerCompletionItemProvider('cpp', {
        triggerCharacters: ['.', '>', ':', ' '],
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions: any[] = [];

          const keywords = [
            'auto', 'bool', 'break', 'case', 'catch', 'char', 'class', 'const',
            'constexpr', 'continue', 'default', 'delete', 'do', 'double', 'else',
            'enum', 'explicit', 'extern', 'false', 'float', 'for', 'friend',
            'goto', 'if', 'include', 'inline', 'int', 'long', 'namespace',
            'new', 'noexcept', 'nullptr', 'operator', 'override', 'private',
            'protected', 'public', 'register', 'return', 'short', 'signed',
            'sizeof', 'static', 'struct', 'switch', 'template', 'this', 'throw',
            'true', 'try', 'typedef', 'typename', 'union', 'unsigned', 'using',
            'virtual', 'void', 'volatile', 'while',
          ];

          for (const kw of keywords) {
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

          const stdlibFunctions = [
            'std::cin', 'std::cout', 'std::cerr', 'std::clog',
            'std::endl', 'std::setw', 'std::setprecision',
            'std::vector', 'std::map', 'std::set', 'std::unordered_map',
            'std::unordered_set', 'std::stack', 'std::queue',
            'std::string', 'std::pair', 'std::tuple',
            'std::sort', 'std::reverse', 'std::find', 'std::binary_search',
            'std::lower_bound', 'std::upper_bound', 'std::min', 'std::max',
            'std::abs', 'std::swap', 'std::accumulate',
            'std::make_pair', 'std::make_tuple',
            'std::to_string', 'std::stoi', 'std::stoll', 'std::stof',
          ];

          for (const fn of stdlibFunctions) {
            suggestions.push({
              label: fn,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: fn,
              range,
            });
          }

          const cppSnippets = [
            { label: 'main', detail: 'int main()', insertText: 'int main() {\n    ${1:return 0;}\n}' },
            { label: 'for', detail: 'For loop', insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:}\n}' },
            { label: 'foreach', detail: 'Range-based for', insertText: 'for (auto ${1:item} : ${2:container}) {\n    ${3:}\n}' },
            { label: 'while', detail: 'While loop', insertText: 'while (${1:condition}) {\n    ${2:}\n}' },
            { label: 'if', detail: 'If statement', insertText: 'if (${1:condition}) {\n    ${2:}\n}' },
            { label: 'else', detail: 'If-else', insertText: 'if (${1:condition}) {\n    ${2:}\n} else {\n    ${3:}\n}' },
            { label: 'vector', detail: 'std::vector', insertText: 'std::vector<${1:int}> ${2:v};' },
            { label: 'cout', detail: 'std::cout <<', insertText: 'std::cout << ${1:value} << std::endl;' },
            { label: 'cin', detail: 'std::cin >>', insertText: 'std::cin >> ${1:variable};' },
            { label: 'struct', detail: 'Struct definition', insertText: 'struct ${1:Name} {\n    ${2:}\n};' },
            { label: 'class', detail: 'Class definition', insertText: 'class ${1:Name} {\npublic:\n    ${2:}\n};' },
            { label: 'include', detail: '#include directive', insertText: '#include <${1:iostream}>' },
            { label: 'using', detail: 'Using namespace std', insertText: 'using namespace std;' },
            { label: 'typedef', detail: 'Type alias', insertText: 'typedef ${1:int} ${2:new_type};' },
            { label: 'auto', detail: 'Auto variable', insertText: 'auto ${1:var} = ${2:value};' },
          ];

          for (const snip of cppSnippets) {
            suggestions.push({
              label: snip.label,
              detail: snip.detail,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: snip.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
            });
          }

          return { suggestions };
        },
      });
    }
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
        fontSize,
        fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        tabSize,
        cursorBlinking: caretAnimation,
        insertSpaces: true,
        automaticLayout: true,
        padding: { top: 12 },
        suggestOnTriggerCharacters: true,
        quickSuggestions: { other: true, comments: true, strings: true },
        tabCompletion: 'on',
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        formatOnPaste: true,
        wordWrap: 'on',
        snippetSuggestions: 'inline',
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
      }}
      loading={
        <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-gray-300" />
        </div>
      }
    />
  );
}
