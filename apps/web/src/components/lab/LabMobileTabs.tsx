'use client';

import { BookOpen, FileCode2 } from '@/components/ui/Icon';

export type LabMobileTab = 'statement' | 'code';

export function LabMobileTabs({
  active,
  onChange,
}: {
  active: LabMobileTab;
  onChange: (tab: LabMobileTab) => void;
}) {
  const tabs: { id: LabMobileTab; label: string; icon: typeof BookOpen }[] = [
    { id: 'statement', label: 'Enunciado', icon: BookOpen },
    { id: 'code', label: 'Código', icon: FileCode2 },
  ];

  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-gray-200 bg-white px-3 py-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-valle-100 text-valle-700'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}