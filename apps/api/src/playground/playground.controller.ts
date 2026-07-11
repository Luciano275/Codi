import { Controller, Post, Get, Body, Param, Res, UseGuards } from '@nestjs/common';
import { IsString, MaxLength, IsIn } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { PlaygroundService } from './playground.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Response } from 'express';

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
  start(@Body() dto: StartDto) {
    const sessionId = this.playground.createSession(dto.code, dto.language);
    return { sessionId };
  }

  @Get('stream/:sessionId')
  @UseGuards(JwtAuthGuard)
  stream(@Param('sessionId') sessionId: string, @Res() res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const session = this.playground.getSession(sessionId);
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
    });
  }

  @Post('input/:sessionId')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  input(@Param('sessionId') sessionId: string, @Body() dto: InputDto) {
    const session = this.playground.getSession(sessionId);
    if (!session || session.ended) {
      return { ok: false };
    }
    session.writeStdin(dto.data);
    return { ok: true };
  }

  @Post('stop/:sessionId')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  stop(@Param('sessionId') sessionId: string) {
    this.playground.stopSession(sessionId);
    return { ok: true };
  }
}
