import { Module } from '@nestjs/common';
import { PlaygroundController } from './playground.controller';
import { PlaygroundService } from './playground.service';
import { PlaygroundTaskLimitsService } from './playground-task-limits.service';

@Module({
  controllers: [PlaygroundController],
  providers: [PlaygroundService, PlaygroundTaskLimitsService],
})
export class PlaygroundModule {}
