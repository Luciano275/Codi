import dotenv from 'dotenv';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

dotenv.config({ path: path.resolve(process.cwd(), '..', '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  experimental: {
    externalTables: true,
  },
  tables: {
    external: [
      'public.admins', 'public.announcements', 'public.attachments', 'public.contests', 'public.datasets',
      'public.evaluations', 'public.executables', 'public.files', 'public.fsobjects', 'public.managers',
      'public.messages', 'public.participations', 'public.printjobs', 'public.questions', 'public.statements',
      'public.submission_results', 'public.submissions', 'public.tasks', 'public.teams', 'public.testcases',
      'public.tokens', 'public.user_test_executables', 'public.user_test_files', 'public.user_test_managers',
      'public.user_test_results', 'public.user_tests', 'public.users',
    ],
  },
  enums: {
    external: [
      'public.compilation_outcome', 'public.evaluation_outcome', 'public.feedback_level',
      'public.score_mode', 'public.token_mode',
    ],
  },
  datasource: {
    url: DATABASE_URL,
  },
})