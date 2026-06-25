import dotenv from 'dotenv';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

dotenv.config({ path: path.resolve(process.cwd(), '..', '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: DATABASE_URL,
  },
})