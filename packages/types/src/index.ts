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
  status:
    | 'PENDING'
    | 'COMPILING'
    | 'EVALUATING'
    | 'ACCEPTED'
    | 'WRONG_ANSWER'
    | 'RUNTIME_ERROR'
    | 'TIME_LIMIT_EXCEEDED'
    | 'MEMORY_LIMIT_EXCEEDED'
    | 'COMPILATION_ERROR';
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

export type RewardCategory = 'EXAMS' | 'PRACTICE' | 'ADVANTAGES' | 'SPECIALS';
export type RewardType = 'EXAM_BONUS_POINT' | 'SMART_HINT' | 'DOUBLE_XP';
export type UserRewardStatus = 'AVAILABLE' | 'ACTIVE' | 'USED' | 'EXPIRED';
export type RewardIcon =
  | 'badge-check'
  | 'book-open-check'
  | 'calendar-check'
  | 'circle-gauge'
  | 'clipboard-check'
  | 'timer-reset';

export interface StoreReward {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: RewardCategory;
  cost: number;
  type: RewardType;
  visual: 'exam' | 'hint' | 'double-xp';
  color: string;
  icon: RewardIcon;
  imageUrl?: string;
  canRedeem: boolean;
  missingGems: number;
  status: 'AVAILABLE' | 'INSUFFICIENT_GEMS' | 'ACQUIRED' | 'ACTIVE';
  acquiredTrimesters?: number[];
  entitlement?: {
    id: string;
    status: UserRewardStatus;
    expiresAt: string | null;
    trimester?: number;
  };
}

export interface RecentReward {
  id: string;
  name: string;
  type: RewardType;
  status: UserRewardStatus;
  redeemedAt: string;
  expiresAt: string | null;
  trimester?: number;
}

export interface RewardsStoreData {
  gems: number;
  rewards: StoreReward[];
  recentRewards: RecentReward[];
}

export type RewardVisual = 'exam' | 'hint' | 'double-xp';

export interface RewardEditorInput {
  slug: string;
  name: string;
  description: string;
  category: RewardCategory;
  cost: number;
  type: RewardType;
  isActive: boolean;
  visual: RewardVisual;
  color: string;
  icon: RewardIcon;
  imageObjectKey?: string;
  durationHours?: number;
}

export interface AdminReward extends RewardEditorInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  redemptionCount: number;
}
