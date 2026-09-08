import { Injectable } from '@nestjs/common';
import { closeSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface BoxLease {
  readonly boxId: number;
  release(): void;
}

@Injectable()
export class BoxLeasePool {
  private readonly lockDirectory = '/tmp';

  acquire(firstBoxId: number, lastBoxId: number): BoxLease {
    for (let boxId = firstBoxId; boxId <= lastBoxId; boxId += 1) {
      const lease = this.tryAcquire(boxId);
      if (lease) return lease;
    }

    throw new Error(`No isolate boxes available in range ${firstBoxId}-${lastBoxId}`);
  }

  private tryAcquire(boxId: number): BoxLease | null {
    const lockPath = join(this.lockDirectory, `codi-isolate-${boxId}.lock`);
    this.removeStaleLock(lockPath);

    try {
      const fileDescriptor = openSync(lockPath, 'wx', 0o600);
      writeFileSync(fileDescriptor, String(process.pid));
      return this.createLease(boxId, lockPath, fileDescriptor);
    } catch (error) {
      if (this.getErrorCode(error) === 'EEXIST') return null;
      throw error;
    }
  }

  private removeStaleLock(lockPath: string): void {
    try {
      const ownerPid = Number(readFileSync(lockPath, 'utf8'));
      if (Number.isInteger(ownerPid) && this.isProcessAlive(ownerPid)) return;
      unlinkSync(lockPath);
    } catch (error) {
      const code = this.getErrorCode(error);
      if (code !== 'ENOENT') throw error;
    }
  }

  private isProcessAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return this.getErrorCode(error) === 'EPERM';
    }
  }

  private createLease(boxId: number, lockPath: string, fileDescriptor: number): BoxLease {
    let released = false;
    return {
      boxId,
      release: () => {
        if (released) return;
        released = true;
        closeSync(fileDescriptor);
        try {
          unlinkSync(lockPath);
        } catch (error) {
          if (this.getErrorCode(error) !== 'ENOENT') throw error;
        }
      },
    };
  }

  private getErrorCode(error: unknown): string | undefined {
    return error instanceof Error && 'code' in error
      ? String((error as NodeJS.ErrnoException).code)
      : undefined;
  }
}
