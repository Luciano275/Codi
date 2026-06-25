export interface UserProfile {
  id: string;
  cmsUserId: number;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  xp: number;
  gems: number;
  level: number;
  streak: number;
}

export interface SubmissionResult {
  id: string;
  status: 'PENDING' | 'COMPILING' | 'EVALUATING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'COMPILATION_ERROR';
  score?: number;
  cmsResults?: CmsTestResult[];
}

export interface CmsTestResult {
  codename: string;
  outcome: string;
  time?: number;
  memory?: number;
}

export interface CourseProgress {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  xpEarned: number;
  completed: boolean;
}

export interface LeagueInfo {
  name: string;
  position?: number;
  xpEarned: number;
  promotionZone: boolean;
  demotionZone: boolean;
}
