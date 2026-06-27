import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '@codi/database';
import { config } from '@codi/config';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async submit(userId: string, problemId: string, code: string, language: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { submissions: false },
    });
    if (!user) throw new NotFoundException('User not found');

    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const submission = await this.prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        language,
        status: 'PENDING',
      },
    });

    this.submitToCms(user, problem, submission, code, language).catch((err) => {
      this.logger.error(`CMS submission failed: ${err.message}`);
    });

    return submission;
  }

  private async submitToCms(
    user: { username: string; cmsUserId: number },
    problem: { cmsTaskName: string },
    submission: { id: string },
    code: string,
    language: string,
  ) {
    const tmpFile = path.join(os.tmpdir(), `codi_${submission.id}.${language}`);
    try {
      fs.writeFileSync(tmpFile, code, 'utf-8');

      const FormData = (await import('form-data')).default;
      const form = new FormData();
      const filename = `source.${language}`;
      form.append(filename, fs.createReadStream(tmpFile), filename);
      form.append('admin_token', config.cms.adminToken);
      form.append('username', user.username);
      form.append('language', language);

      const response = await firstValueFrom(
        this.httpService.post(
          `${config.cms.apiUrl}/api/admin-submit/${problem.cmsTaskName}`,
          form,
          { headers: { ...form.getHeaders() }, timeout: 30000 },
        ),
      );

      const cmsSubmissionId = response.data.submission_id;

      await this.prisma.submission.update({
        where: { id: submission.id },
        data: { cmsSubmissionId, status: 'EVALUATING' },
      });

      this.logger.log(`Submitted to CMS: id=${cmsSubmissionId}`);

      this.pollForResult(submission.id, cmsSubmissionId);
    } catch (err: any) {
      this.logger.error(`Submit to CMS failed: ${err.message}`);
      await this.prisma.submission.update({
        where: { id: submission.id },
        data: { status: 'COMPILATION_ERROR' },
      }).catch(() => {});
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  }

  private async pollForResult(
    submissionId: string,
    cmsSubmissionId: number,
  ) {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const result = await firstValueFrom(
          this.httpService.post(
            `http://localhost:${config.cmsAdapterPort}/cms-adapter/poll-submission`,
            { cmsSubmissionId },
          ),
        );
        if (result.data.done) {
          this.logger.log(
            `Submission ${submissionId} evaluated: ${result.data.status}`,
          );
          return;
        }
      } catch {
        // poll failed, retry
      }
    }
    this.logger.warn(`Submission ${submissionId} polling timed out`);
  }

  async findById(id: string) {
    return this.prisma.submission.findUnique({
      where: { id },
      include: { problem: true },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.submission.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      include: { problem: true },
    });
  }
}
