import { Controller, Post, Get, Body, Param, Res, UseGuards } from '@nestjs/common';
import { PlaygroundService } from './playground.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response, Request } from 'express';

class StartDto {
  code!: string;
  language!: string;
}

class InputDto {
  data!: string;
}

@Controller('playground')
export class PlaygroundController {
  constructor(private readonly playground: PlaygroundService) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  start(@Body() dto: StartDto) {
    const sessionId = this.playground.createSession(dto.code, dto.language);
    return { sessionId };
  }

  @Get('stream/:sessionId')
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
        res.write(`event: ${event.type}\ndata: ${data}\n\n`);
      },
      error: (err) => {
        res.write(`event: error\ndata: ${err.message}\n\n`);
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
  stop(@Param('sessionId') sessionId: string) {
    this.playground.stopSession(sessionId);
    return { ok: true };
  }
}
