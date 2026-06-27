import { Controller, Post, Body, Logger } from '@nestjs/common';
import { CmsAdapterService } from './cms-adapter.service';

@Controller('cms-adapter')
export class CmsAdapterController {
  private readonly logger = new Logger(CmsAdapterController.name);

  constructor(private readonly cmsAdapter: CmsAdapterService) {}

  @Post('sync-tasks')
  async syncTasks() {
    return this.cmsAdapter.syncTasks();
  }

  @Post('poll-submission')
  async pollSubmission(
    @Body() body: { cmsSubmissionId: number },
  ) {
    if (!body.cmsSubmissionId) {
      return { error: 'cmsSubmissionId is required' };
    }
    return this.cmsAdapter.pollSubmissionResult(body.cmsSubmissionId);
  }
}
