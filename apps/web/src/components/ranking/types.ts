import type { RankingPageData, RankingUser } from '@/lib/server-api';

export type RankingPeriod = 'WEEK' | 'MONTH' | 'ALL_TIME';
export type RankingScope = 'GLOBAL' | 'SCHOOL' | 'FRIENDS' | 'COURSE';
export type RankingEntry = RankingUser;
export type CurrentRankingPosition = RankingPageData['currentUser'];

export interface PodiumRewardClaim {
  position: number;
  title: string;
  gems: number;
}
