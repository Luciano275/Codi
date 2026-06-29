import { prisma } from '@codi/database';
import type { User, CmsUserSource } from '@codi/database';
import { verifyCmsPassword } from './crypto.js';
import type { CmsUserRow, CmsAdminRow, LoginResult, UserProfile } from './types.js';

export { verifyCmsPassword };
export type { LoginResult, UserProfile };

export function toProfile(user: User): UserProfile {
  return {
    id: user.id,
    cmsUserId: user.cmsUserId,
    cmsSource: user.cmsSource as CmsUserSource,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    xp: user.xp,
    gems: user.gems,
    level: user.level,
    streak: user.streak,
  };
}

export class AuthService {
  constructor(
    private readonly jwtSign: (payload: { sub: string; role: string }) => string,
  ) {}

  async login(username: string, password: string): Promise<LoginResult> {
    const user = await this.verifyAndSync(username, password);
    if (!user) {
      throw new Error('Los datos no son correctos');
    }

    const token = this.jwtSign({ sub: user.id, role: user.role });
    return { token, user: toProfile(user) };
  }

  async verifyAndSync(username: string, password: string): Promise<User | null> {
    const existing = await prisma.user.findUnique({ where: { username } });

    if (existing?.passwordHash) {
      if (verifyCmsPassword(existing.passwordHash, password)) {
        return existing;
      }
    }

    const [cmsUser] = await prisma.$queryRawUnsafe<CmsUserRow[]>(
      `SELECT id, username, password, first_name, last_name, email
       FROM public.users WHERE username = $1`,
      username,
    );

    if (cmsUser && verifyCmsPassword(cmsUser.password, password)) {
      return this.upsertUser({
        id: cmsUser.id,
        username: cmsUser.username,
        first_name: cmsUser.first_name,
        last_name: cmsUser.last_name,
        email: cmsUser.email,
        source: 'USER',
        hash: cmsUser.password,
        role: 'STUDENT',
      });
    }

    const [cmsAdmin] = await prisma.$queryRawUnsafe<CmsAdminRow[]>(
      `SELECT id, username, authentication, name, permission_all
       FROM public.admins WHERE username = $1 AND enabled = true`,
      username,
    );

    if (cmsAdmin && verifyCmsPassword(cmsAdmin.authentication, password)) {
      return this.upsertUser({
        id: cmsAdmin.id,
        username: cmsAdmin.username,
        first_name: cmsAdmin.name,
        last_name: '',
        email: null,
        source: 'ADMIN',
        hash: cmsAdmin.authentication,
        role: 'ADMIN',
      });
    }

    return null;
  }

  private async upsertUser(params: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string | null;
    source: CmsUserSource;
    hash: string;
    role: 'STUDENT' | 'ADMIN';
  }): Promise<User> {
    return prisma.user.upsert({
      where: { username: params.username },
      create: {
        cmsUserId: params.id,
        cmsSource: params.source,
        username: params.username,
        displayName: `${params.first_name} ${params.last_name}`.trim(),
        email: params.email,
        role: params.role,
        passwordHash: params.hash,
      },
      update: {
        displayName: `${params.first_name} ${params.last_name}`.trim(),
        email: params.email,
        passwordHash: params.hash,
      },
    });
  }
}
