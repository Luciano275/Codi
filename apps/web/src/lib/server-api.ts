import { cookies } from 'next/headers';
import type { RewardRedemptionStatus, RewardType, UserRewardStatus } from '@codi/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export async function serverFetch<T>(
  path: string,
  options: Pick<RequestInit, 'method' | 'body'> = {},
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method,
    body: options.body,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) throw new UnauthorizedError();
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API error: ${res.status}`);
  }

  return res.json();
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  level: number;
  region: string;
  xpReward: number;
  order: number;
  islandId: string | null;
  modules: Module[];
}

export interface IslandSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  modelPath: string;
  available: boolean;
  accent: string;
  order: number;
  courses: {
    id: string;
    title: string;
    order: number;
    _count: { modules: number };
  }[];
}

export interface IslandPath {
  id: string;
  title: string;
  slug: string;
  description: string;
  available: boolean;
  accent: string;
  order: number;
  courses: {
    id: string;
    title: string;
    order: number;
    level: number;
    region: string;
    xpReward: number;
    _count: { modules: number };
  }[];
}

export interface CoursePath {
  id: string;
  title: string;
  order: number;
  island: { slug: string; title: string } | null;
  modules: {
    id: string;
    title: string;
    order: number;
    lessons: {
      id: string;
      title: string;
      order: number;
      type: string;
      xpReward: number;
      gemsReward: number;
    }[];
  }[];
}

export interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  type: string;
  xpReward: number;
  gemsReward: number;
  content: Record<string, unknown>;
  resources: {
    image: SignedResource | null;
    pdf: SignedResource | null;
    video: SignedResource | null;
  };
  problems: Problem[];
  solvedProblemIds: string[];
  smartHint: { canUnlock: boolean; content: string | null } | null;
  module: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
      slug: string;
      island: { slug: string; title: string } | null;
    };
    lessons: { id: string; title: string; order: number; type: string }[];
  };
}

export interface SignedResource {
  url: string;
  fileName: string | null;
  contentType: string | null;
  expiresAt: string;
}

export interface Problem {
  id: string;
  cmsTaskId: number;
  title: string;
  difficulty: string;
  xpReward: number;
  gemsReward: number;
}

export interface ProgressData {
  totalLessons: number;
  completedLessons: number;
  completedLessonIds: string[];
  courses: {
    courseId: string;
    courseTitle: string;
    completedLessons: number;
    totalLessons: number;
    completed: boolean;
  }[];
}

export interface RankingUser {
  rank: number;
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  gems: number;
  level: number;
  totalXp: number;
  completedLessons: number;
  streak: number;
}

export interface RankingPageData {
  items: RankingUser[];
  podium: RankingUser[];
  rewards: RankingRewardForViewer[];
  page: number;
  pageSize: number;
  totalStudents: number;
  totalPages: number;
  currentUser: {
    rank: number;
    xp: number;
    totalXp: number;
    level: number;
    completedLessons: number;
    streak: number;
    xpToNextRank: number;
  } | null;
}

export interface RankingReward {
  position: 1 | 2 | 3;
  title: string;
  gems: number;
}

export interface RankingRewardForViewer extends RankingReward {
  claimed: boolean;
}

export interface CompetitivePlayerProfile extends Omit<RankingUser, 'rank' | 'totalXp'> {
  rank: number | null;
  isRanked: boolean;
  profileBanner: string;
  streak: number;
  createdAt: string;
  totalStudents: number;
  completedLessons: number;
  acceptedSubmissions: number;
  totalSubmissions: number;
  achievements: {
    code: string;
    title: string;
    description: string;
    iconUrl: string | null;
    unlockedAt: string;
  }[];
  rewards: {
    id: string;
    rewardName: string;
    type: RewardType;
    redemptionStatus: RewardRedemptionStatus;
    entitlementStatus: UserRewardStatus | null;
    redeemedAt: string;
    expiresAt: string | null;
    trimester?: number;
  }[];
}

export interface AdminIslandCourse {
  id: string;
  title: string;
  slug: string;
  level: number;
  region: string;
  xpReward: number;
  order: number;
  modules: {
    id: string;
    title: string;
    order: number;
    _count: { lessons: number };
  }[];
}

export interface AdminIsland {
  id: string;
  title: string;
  slug: string;
  description: string;
  accent: string;
  order: number;
  available: boolean;
  hasCustomModel: boolean;
  modelPath: string;
  createdAt: string;
  updatedAt: string;
  _count: { courses: number };
  courses?: AdminIslandCourse[];
}

export interface AdminIslandMutationData {
  title: string;
  description: string;
  accent: string;
  order: number;
  available: boolean;
  modelUploadKey?: string;
}

export async function fetchCourses(): Promise<Course[]> {
  return serverFetch<Course[]>('/api/courses');
}

export async function fetchIslands(): Promise<IslandSummary[]> {
  return serverFetch<IslandSummary[]>('/api/courses/islands');
}

export async function fetchIslandPath(slug: string): Promise<IslandPath> {
  return serverFetch<IslandPath>(`/api/courses/islands/${slug}/path`);
}

export async function fetchCoursePath(id: string): Promise<CoursePath> {
  return serverFetch<CoursePath>(`/api/courses/${id}/path`);
}

export async function fetchLesson(id: string): Promise<Lesson> {
  return serverFetch<Lesson>(`/api/lessons/${id}`);
}

export async function fetchProgress(): Promise<ProgressData> {
  return serverFetch<ProgressData>('/api/courses/progress/me');
}

export async function fetchGlobalRanking(limit = 10): Promise<RankingUser[]> {
  const ranking = await serverFetch<RankingPageData>('/api/ranking/global?page=1');
  return ranking.items.slice(0, limit);
}

export async function fetchRankingPage(
  page = 1,
  period: 'WEEK' | 'MONTH' | 'ALL_TIME' = 'ALL_TIME',
  scope: 'GLOBAL' | 'SCHOOL' | 'FRIENDS' | 'COURSE' = 'GLOBAL',
): Promise<RankingPageData> {
  return serverFetch<RankingPageData>(
    `/api/ranking/global?page=${page}&period=${period}&scope=${scope}`,
  );
}

export async function fetchAdminRankingRewards(): Promise<RankingReward[]> {
  return serverFetch<RankingReward[]>('/api/ranking/rewards/admin');
}

export async function fetchCompetitivePlayer(id: string): Promise<CompetitivePlayerProfile> {
  return serverFetch<CompetitivePlayerProfile>(`/api/ranking/players/${id}`);
}

export async function fetchAdminIslands(): Promise<AdminIsland[]> {
  return serverFetch<AdminIsland[]>('/api/admin/islands');
}

export async function fetchAdminIsland(id: string): Promise<AdminIsland> {
  return serverFetch<AdminIsland>(`/api/admin/islands/${id}`);
}

export async function createAdminIsland(data: AdminIslandMutationData): Promise<AdminIsland> {
  return serverFetch<AdminIsland>('/api/admin/islands', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminIsland(
  id: string,
  data: Partial<AdminIslandMutationData>,
): Promise<AdminIsland> {
  return serverFetch<AdminIsland>(`/api/admin/islands/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminIsland(id: string): Promise<{ deleted: true }> {
  return serverFetch<{ deleted: true }>(`/api/admin/islands/${id}`, { method: 'DELETE' });
}
