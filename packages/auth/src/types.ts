import type { CmsUserSource, Role } from '@codi/database';

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  cmsUserId: number;
  cmsSource: CmsUserSource;
  username: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  profileBanner: string;
  role: Role;
  xp: number;
  gems: number;
  level: number;
  streak: number;
}

export interface CmsUserRow {
  id: number;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

export interface CmsAdminRow {
  id: number;
  username: string;
  authentication: string;
  name: string;
  permission_all: boolean;
}
