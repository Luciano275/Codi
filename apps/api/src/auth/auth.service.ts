import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AuthService as CodiAuthService,
  verifyCmsPassword,
} from '@codi/auth';
import type { LoginResult, UserProfile } from '@codi/auth';
import { prisma } from '@codi/database';
import type { CmsUserSource } from '@codi/database';

type CmsUserRow = {
  id: number;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string | null;
};

type CmsAdminRow = {
  id: number;
  username: string;
  authentication: string;
  name: string;
  permission_all: boolean;
};

@Injectable()
export class AuthService {
  private codiAuth: CodiAuthService;

  constructor(private jwtService: JwtService) {
    this.codiAuth = new CodiAuthService((payload) =>
      this.jwtService.sign(payload),
    );
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      return await this.codiAuth.login(username, password);
    } catch {
      throw new UnauthorizedException('Los datos no son correctos');
    }
  }

  async verifyAndSync(username: string, password: string) {
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
        source: 'USER' as CmsUserSource,
        hash: cmsUser.password,
        role: 'STUDENT' as const,
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
        source: 'ADMIN' as CmsUserSource,
        hash: cmsAdmin.authentication,
        role: 'ADMIN' as const,
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
  }) {
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
