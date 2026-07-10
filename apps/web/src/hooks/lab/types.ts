export interface ConsoleTab {
  id: string;
  label: string;
  type: 'output' | 'evaluation';
  content: string;
  error?: string;
  score?: number;
  status?: string;
}

export interface LangInfo {
  id: string;
  label: string;
  extension: string;
}

export interface ExerciseInfo {
  id: string;
  title: string;
  difficulty: string;
  xpReward: number;
  gemsReward: number;
  cmsTaskId: number;
  cmsTaskName?: string;
  attachmentUrl?: string;
  content?: Record<string, unknown>;
  availableLanguages?: LangInfo[];
}
