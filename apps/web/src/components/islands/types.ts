export interface IslandViewModel {
  id: string;
  title: string;
  description: string;
  modelPath: string;
  modelCacheKey: string;
  available: boolean;
  accent: string;
  href: string;
  courseCount: number;
  moduleCount: number;
  progress: number;
}
