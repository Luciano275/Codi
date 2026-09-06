import { cookies } from 'next/headers';

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

export interface Island {
  id: string;
  title: string;
  slug: string;
  description: string;
  modelPath: string;
  available: boolean;
  accent: string;
  order: number;
  courses: Course[];
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
  content: Record<string, unknown>;
  resources: {
    image: SignedResource | null;
    pdf: SignedResource | null;
    video: SignedResource | null;
  };
  problems: Problem[];
  solvedProblemIds: string[];
  module: {
    id: string;
    title: string;
    course: { id: string; title: string; slug: string };
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
}

export interface CompetitivePlayerProfile extends Omit<RankingUser, 'rank'> {
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
}

export async function fetchCourses(): Promise<Course[]> {
  return serverFetch<Course[]>('/api/courses');
}

export async function fetchIslands(): Promise<Island[]> {
  return serverFetch<Island[]>('/api/courses/islands');
}

export async function fetchLesson(id: string): Promise<Lesson> {
  return serverFetch<Lesson>(`/api/lessons/${id}`);
}

export async function fetchProgress(): Promise<ProgressData> {
  return serverFetch<ProgressData>('/api/courses/progress/me');
}

export async function fetchGlobalRanking(limit = 10): Promise<RankingUser[]> {
  return serverFetch<RankingUser[]>(`/api/ranking/global?limit=${limit}`);
}

export async function fetchCompetitivePlayer(id: string): Promise<CompetitivePlayerProfile> {
  return serverFetch<CompetitivePlayerProfile>(`/api/ranking/players/${id}`);
}
