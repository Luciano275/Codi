import { Controller, Post, Get, Body, Param, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { User } from '@codi/database';
import { IsString, MaxLength, IsIn } from 'class-validator';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlaygroundService } from './playground.service';

class StartDto {
  @IsString()
  @MaxLength(50000)
  code!: string;

  @IsString()
  @IsIn(['python', 'cpp'])
  language!: string;
}

class InputDto {
  @IsString()
  @MaxLength(10000)
  data!: string;
}

@Controller('playground')
export class PlaygroundController {
  constructor(private readonly playground: PlaygroundService) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async start(@CurrentUser() user: User, @Body() dto: StartDto) {
    const sessionId = await this.playground.createSession(user.id, dto.code, dto.language);
    return { sessionId };
  }

  @Get('stream/:sessionId')
  @UseGuards(JwtAuthGuard)
  stream(@CurrentUser() user: User, @Param('sessionId') sessionId: string, @Res() res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const session = this.playground.getSession(user.id, sessionId);
    if (!session) {
      res.write(`event: error\ndata: Session not found\n\n`);
      res.end();
      return;
    }

    const sub = session.onEvent().subscribe({
      next: (event) => {
        const data = event.data.replace(/\n/g, '\\n');
        const escaped = data.replace(/\0/g, '');
        res.write(`event: ${event.type}\ndata: ${escaped}\n\n`);
      },
      error: () => {
        res.write(`event: error\ndata: Internal error\n\n`);
        res.end();
      },
      complete: () => {
        res.end();
      },
    });

    const request = res.req;
    request?.on('close', () => {
      sub.unsubscribe();
      this.playground.stopSession(user.id, sessionId);
    });
  }

  @Post('input/:sessionId')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  input(@CurrentUser() user: User, @Param('sessionId') sessionId: string, @Body() dto: InputDto) {
    const session = this.playground.getSession(user.id, sessionId);
    if (!session || session.ended) {
      return { ok: false };
    }
    session.writeStdin(dto.data);
    return { ok: true };
  }

  @Post('stop/:sessionId')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  stop(@CurrentUser() user: User, @Param('sessionId') sessionId: string) {
    this.playground.stopSession(user.id, sessionId);
    return { ok: true };
  }
}
