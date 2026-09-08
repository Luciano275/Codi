import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { config } from '@codi/config';
import { randomUUID } from 'crypto';
import { BoxLeasePool } from '../sandbox/box-lease-pool.service';
import { PlaygroundSession } from './playground-session';

const FINISHED_SESSION_RETENTION_MS = 60_000;

@Injectable()
export class PlaygroundService implements OnApplicationShutdown {
  private readonly sessions = new Map<string, PlaygroundSession>();

  constructor(private readonly leases: BoxLeasePool) {}

  createSession(code: string, language: string): string {
    const sessionId = randomUUID();
    const lease = this.leases.acquire(
      config.eval.playgroundFirstBoxId,
      config.eval.playgroundLastBoxId,
    );

    try {
      const session = new PlaygroundSession(code, language, lease, () => {
        this.expireFinishedSession(sessionId);
      });
      this.sessions.set(sessionId, session);
      session.start(language);
      return sessionId;
    } catch (error) {
      lease.release();
      throw error;
    }
  }

  getSession(sessionId: string): PlaygroundSession | undefined {
    return this.sessions.get(sessionId);
  }

  stopSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.stop();
    this.sessions.delete(sessionId);
  }

  onApplicationShutdown(): void {
    for (const session of this.sessions.values()) session.stop();
    this.sessions.clear();
  }

  private expireFinishedSession(sessionId: string): void {
    const expiration = setTimeout(
      () => this.sessions.delete(sessionId),
      FINISHED_SESSION_RETENTION_MS,
    );
    expiration.unref();
  }
}
