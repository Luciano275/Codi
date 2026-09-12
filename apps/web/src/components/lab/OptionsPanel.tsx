'use client';

import { X, FileCode2 } from '@/components/ui/Icon';

const ALL_LANGUAGES = [
  { id: 'python', label: 'Python 3', extension: 'py' },
  { id: 'cpp', label: 'C++', extension: 'cpp' },
];

interface OptionsPanelProps {
  showOptions: boolean;
  onClose: () => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  tabSize: number;
  onTabSizeChange: (size: number) => void;
  caretAnimation: string;
  onCaretAnimationChange: (anim: string) => void;
}

export function OptionsPanel({
  showOptions,
  onClose,
  language,
  onLanguageChange,
  fontSize,
  onFontSizeChange,
  tabSize,
  onTabSizeChange,
  caretAnimation,
  onCaretAnimationChange,
}: OptionsPanelProps) {
  if (!showOptions) return null;

  return (
    <aside className="absolute inset-0 z-30 flex flex-shrink-0 flex-col border-r border-gray-200 bg-gray-50 lg:static lg:z-auto lg:w-56">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <span className="font-simply-olive text-xs font-semibold uppercase text-gray-400">
          Opciones
        </span>
        <button onClick={onClose} className="rounded p-0.5 text-gray-400 hover:text-gray-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="border-b border-gray-200 p-3">
        <p className="mb-1.5 font-simply-olive text-[10px] font-semibold uppercase text-gray-400">
          Lenguaje
        </p>
        <div className="space-y-1">
          {ALL_LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => onLanguageChange(lang.id)}
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

      <div className="border-b border-gray-200 p-3 space-y-3">
        <p className="font-simply-olive text-[10px] font-semibold uppercase text-gray-400">
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
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="flex-1 h-1 accent-valle-500"
            />
            <span className="w-5 text-center text-[10px] font-medium text-gray-600">
              {fontSize}
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-gray-500">Tab size</label>
          <div className="flex gap-1">
            {[2, 4, 6, 8].map((n) => (
              <button
                key={n}
                onClick={() => onTabSizeChange(n)}
                className={`flex-1 rounded-md py-1 text-[10px] font-medium transition-colors ${
                  tabSize === n
                    ? 'bg-valle-100 text-valle-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
            onChange={(e) => onCaretAnimationChange(e.target.value)}
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
        <p className="mb-1.5 font-simply-olive text-[10px] font-semibold uppercase text-gray-400">
          Atajos
        </p>
        <div className="space-y-1 text-[10px] text-gray-500">
          <p>
            <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-[9px]">Ctrl+Space</kbd>{' '}
            Autocompletado
          </p>
          <p>
            <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-[9px]">Ctrl+S</kbd>{' '}
            Guardar
          </p>
          <p>
            <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-[9px]">Ctrl+Enter</kbd>{' '}
            Ejecutar
          </p>
        </div>
      </div>
    </aside>
  );
}
