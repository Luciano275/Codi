import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
  });
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy<PrismaClient>({} as PrismaClient, {
  get(_, prop: string | symbol) {
    const client = getPrisma();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', () => {
    if (globalForPrisma.prisma) {
      globalForPrisma.prisma.$disconnect();
    }
  });
}

export { PrismaService } from './prisma.service';
export { PrismaModule } from './prisma.module';
export { GlobalExceptionFilter } from './filters/global-exception.filter';
export * from '@prisma/client';
