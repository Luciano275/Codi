import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface LangInfo {
  id: string;
  label: string;
  extension: string;
}

const ALL_LANGUAGES: LangInfo[] = [
  { id: 'python', label: 'Python 3', extension: 'py' },
  { id: 'cpp', label: 'C++', extension: 'cpp' },
];

const GRADER_TO_LANG: Record<string, string> = {
  'grader.py': 'python',
  'grader.cpp': 'cpp',
};

@Controller('problems')
export class ProblemsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: {
        lesson: {
          select: { id: true, title: true },
        },
      },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const rows = await this.prisma.$queryRaw<{ filename: string }[]>`
      SELECT m.filename
      FROM public.managers m
      JOIN public.datasets d ON d.id = m.dataset_id
      WHERE d.task_id = ${problem.cmsTaskId}
        AND d.description = 'Default'
        AND m.filename IN ('grader.py', 'grader.cpp')
    `;

    const graderLangIds = rows
      .map((r) => GRADER_TO_LANG[r.filename])
      .filter(Boolean) as string[];

    const availableLanguages: LangInfo[] =
      graderLangIds.length > 0
        ? ALL_LANGUAGES.filter((l) => graderLangIds.includes(l.id))
        : ALL_LANGUAGES;

    return { ...problem, availableLanguages };
  }
}
