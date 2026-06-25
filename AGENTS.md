# Codi — Monorepo Instructions

## Quick start

```sh
pnpm install                # install all workspace deps
pnpm dev                    # turbo dev (all apps in parallel)
pnpm build                  # turbo build
pnpm lint                   # turbo lint
pnpm format                 # prettier --write **/*.{ts,tsx,md}
```

## Workspace layout

```
apps/
  api/          @codi/api          — NestJS v11 (JWT auth, WebSockets, Socket.io)
  cms-adapter/  @codi/cms-adapter  — NestJS v11 (proxies CMS webhooks to Prisma)
  web/          @codi/web          — Next.js v16 (standalone output, app router)
packages/
  auth/         @codi/auth         — re-exports prisma + types from @codi/database
  config/       @codi/config       — env-read config object (port, JWT, CMS, Redis, S3)
  database/     @codi/database     — Prisma v7 + pg client singleton (build step: tsc)
  types/        @codi/types        — shared TS type definitions
  ui/           @codi/ui           — React v19 component library
  validators/   @codi/validators   — Zod v4 schemas
```

## Prisma (v7 — critical differences from v6)

- **`schema.prisma`** has NO `url` field in `datasource db` — that belongs in `prisma.config.ts`.
- **`prisma.config.ts`** at `packages/database/prisma.config.ts` provides the datasource URL.
  - Loads `.env` from repo root via `dotenv.config({ path: ... })`.
  - Uses `defineConfig` from `prisma/config` (not `@prisma/config`).
- **PrismaClient** requires a **driver adapter**:
  ```ts
  import { PrismaPg } from '@prisma/adapter-pg';
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter, log: [...] });
  ```
- All Prisma commands must run from `packages/database/` or via `pnpm --filter @codi/database` (scripts in `turbo.json` or root `package.json`).

```sh
pnpm db:generate                       # prisma generate
pnpm db:migrate --name <name>          # prisma migrate dev
pnpm db:push                           # prisma db push
pnpm db:studio                         # prisma studio
```

- Migration files commit to `packages/database/prisma/migrations/`.
- The `codi` PG user needs `CREATEDB` privilege for shadow database (`ALTER USER codi CREATEDB`).

## Architecture notes

- **`@codi/database/src/index.ts`** is the single PrismaClient entrypoint — exports a cached singleton via `globalThis` plus `export * from '@prisma/client'`.
- **`@codi/auth`** re-exports `prisma` from `@codi/database` — do not instantiate PrismaClient elsewhere.
- **`@codi/config`** reads from `process.env` at import time (no runtime env reloading).
- Next.js standalone output means the Docker image copies only `.next/standalone/`, not the full monorepo.
- Next.js web only has an `app/` directory (App Router, pages/ not used).

## Key commands

| Goal | Command |
|------|---------|
| Dev all apps | `pnpm start:dev` (alias de `turbo dev`) |
| Dev single NestJS app | `pnpm --filter @codi/api start:dev` |
| Dev web | `pnpm --filter @codi/web dev` |
| Typecheck a package | `pnpm --filter @codi/<pkg> lint` (runs `tsc --noEmit`) |
| Typecheck web | `pnpm --filter @codi/web lint` (runs `next lint`) |
| Build database (tsc) | `pnpm --filter @codi/database build` |
| Format all | `pnpm format` |
| Add a dep | `pnpm --filter @codi/<pkg> add <pkg>` |

## TypeScript conventions

- Root `tsconfig.json` sets `moduleResolution: "bundler"`, strict mode.
- Packages using source-entry (`main: "./src/index.ts"`) do not need a build step for consumers that also bundle (Next.js, NestJS with tsc bundler).
- `@codi/database` must be built (`tsc → dist/`) because its consumers expect compiled JS.
- `@codi/web` uses `paths: { "@/*": ["./src/*"] }` for local imports.
- `@codi/web` uses `jsx: "react-jsx"` (modern JSX transform, no manual `import React`).

## Style

- Prettier: semicolons, single quotes, trailing commas, 100 print width, 2-space tabs.
- No ESLint config files found outside NestJS templates — linting relies on `next lint` and `tsc --noEmit`.

## Env

- `.env` at repo root (gitignored). Copy `.env.example` to create it.
- Variables used: `DATABASE_URL`, `CMS_API_URL`, `CMS_ADMIN_TOKEN`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `REDIS_URL`, `FRONTEND_URL`, `CMS_ADAPTER_PORT`, `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`.
- NestJS apps load env via `@nestjs/config` or direct `process.env` — not via dotenv in their own code.

## Limitations

- **No test suite** exists (no test runner, no test files anywhere).
- **No CI/CD** configured (no `.github/` directory).
- **No ESLint** for web — only `next lint` (which runs Next.js's built-in ESLint).
- **No codegen scripts** beyond Prisma's own.
