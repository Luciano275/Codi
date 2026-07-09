import { Controller, Get, Param, Query, UseGuards, NotFoundException, Res } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

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

const TEMPLATE_EXTENSIONS = ['.py', '.cpp', '.c', '.java', '.txt'];
const EXCLUDED_FILENAMES = ['grader.py', 'grader.cpp', 'grader.c', 'grader.java'];

const EXT_TO_LANG: Record<string, string> = {
  '.py': 'python',
  '.cpp': 'cpp',
  '.c': 'c',
  '.java': 'java',
  '.txt': 'text',
};

const LANG_TO_EXT: Record<string, string> = {
  python: '.py',
  cpp: '.cpp',
  c: '.c',
  java: '.java',
  text: '.txt',
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

  @Get(':id/attachment')
  @UseGuards(JwtAuthGuard)
  async getAttachment(@Param('id') id: string, @Res() res: Response) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      select: { cmsTaskId: true },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const rows = await this.prisma.$queryRaw<{ digest: string }[]>`
      SELECT s.digest
      FROM public.statements s
      WHERE s.task_id = ${problem.cmsTaskId}
      ORDER BY s.language
      LIMIT 1
    `;

    if (!rows.length) {
      res.status(404).json({ error: 'No attachment found' });
      return;
    }

    const pdfRows = await this.prisma.$queryRaw<{ data: Buffer }[]>`
      SELECT lo_get(f.loid) as data
      FROM public.fsobjects f
      WHERE f.digest = ${rows[0].digest}
    `;

    if (!pdfRows.length || !pdfRows[0].data) {
      res.status(404).json({ error: 'PDF data not found' });
      return;
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Content-Length': String(pdfRows[0].data.length),
    });
    res.send(pdfRows[0].data);
  }

  @Get(':id/template')
  @UseGuards(JwtAuthGuard)
  async getTemplate(@Param('id') id: string, @Query('language') language?: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      select: { cmsTaskId: true },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const rows = await this.prisma.$queryRaw<{ filename: string; digest: string }[]>`
      SELECT a.filename, a.digest
      FROM public.attachments a
      WHERE a.task_id = ${problem.cmsTaskId}
      ORDER BY a.filename
    `;

    // Filter by language if specified, otherwise pick the first template
    const targetExt = language ? LANG_TO_EXT[language] : null;
    const template = targetExt
      ? rows.find((r) => {
          const ext = r.filename.substring(r.filename.lastIndexOf('.'));
          return ext === targetExt && !EXCLUDED_FILENAMES.includes(r.filename);
        })
      : rows.find((r) => {
          const ext = r.filename.substring(r.filename.lastIndexOf('.'));
          return TEMPLATE_EXTENSIONS.includes(ext) && !EXCLUDED_FILENAMES.includes(r.filename);
        });

    if (!template) {
      return { template: null, templateFilename: null, language: null };
    }

    const contentRows = await this.prisma.$queryRaw<{ data: string }[]>`
      SELECT convert_from(lo_get(f.loid), 'UTF8') as data
      FROM public.fsobjects f
      WHERE f.digest = ${template.digest}
    `;

    if (!contentRows.length || !contentRows[0].data) {
      return { template: null, templateFilename: null, language: null };
    }

    const ext = template.filename.substring(template.filename.lastIndexOf('.'));

    return {
      template: contentRows[0].data,
      templateFilename: template.filename,
      language: EXT_TO_LANG[ext] || null,
    };
  }
}
