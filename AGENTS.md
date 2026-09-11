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
  web/          @codi/web          — Next.js v16 (standalone output, app router)
packages/
  auth/         @codi/auth         — re-exports prisma + types from @codi/database
  config/       @codi/config       — env-read config object (port, JWT, CMS, Redis, S3)
  database/     @codi/database     — Prisma v7 + pg client singleton (build step: tsc)
  types/        @codi/types        — shared TS type definitions
  ui/           @codi/ui           — React v19 component library
  validators/   @codi/validators   — Zod v4 schemas
```

## Database — single DB (`cmsdb`) with `codi_*` prefix

- **BD única**: `cmsdb`. Las tablas del CMS (`users`, `admins`, `tasks`, etc.) coexisten con las tablas de Codi (`codi_user`, `codi_course`, etc.).
- **Prefijo `codi_`**: todas las entidades de Codi usan `@@map("codi_<name>")` en Prisma.
- **Queries raw** al CMS usan `public.<tabla>` (ej: `public.users`).

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
pnpm db:setup                          # migrate deploy + genera cliente + semilla inicial (base Codi vacía)
pnpm db:generate                       # prisma generate
pnpm db:migrate                        # prisma migrate deploy (aplica migraciones pendientes)
pnpm db:migrate:dev                    # prisma migrate dev (solo desarrollo local)
pnpm db:seed                           # carga islas, cursos y módulos iniciales que falten
pnpm db:push                           # prisma db push (solo prototipado local)
pnpm db:studio                         # prisma studio
```

- Migration files commit to `packages/database/prisma/migrations/`.
- En fresh clone: copiar `.env.example` → `.env`, ajustar credenciales, luego:
  ```sh
  pnpm install
  pnpm db:setup              # aplica todas las migraciones + genera cliente + carga la semilla
  pnpm build
  pnpm dev
  ```
- Después de `db:setup`, las migraciones futuras se aplican normalmente con `pnpm db:migrate`.
- La semilla es idempotente: crea las islas, cursos y módulos de ejemplo que falten, sin actualizar ni eliminar contenido existente.
- `prisma migrate dev` debe usarse solo localmente (`pnpm db:migrate:dev`) — nunca en cmsdb compartida porque detecta las tablas del CMS como "no gestionadas" y ofrece resetear la BD.

## Architecture notes

- **`@codi/database/src/index.ts`** is the single PrismaClient entrypoint — exports a cached singleton via `globalThis` plus `export * from '@prisma/client'`.
- **`@codi/auth`** re-exports `prisma` from `@codi/database` — do not instantiate PrismaClient elsewhere.
- **`@codi/config`** reads from `process.env` at import time (no runtime env reloading).
- Next.js standalone output means the Docker image copies only `.next/standalone/`, not the full monorepo.
- Next.js web only has an `app/` directory (App Router, pages/ not used).

## Key commands

| Goal                  | Command                                                |
| --------------------- | ------------------------------------------------------ |
| Dev all apps          | `pnpm start:dev` (alias de `turbo dev`)                |
| Dev single NestJS app | `pnpm --filter @codi/api start:dev`                    |
| Dev web               | `pnpm --filter @codi/web dev`                          |
| Typecheck a package   | `pnpm --filter @codi/<pkg> lint` (runs `tsc --noEmit`) |
| Typecheck web         | `pnpm --filter @codi/web lint` (runs `next lint`)      |
| Build database (tsc)  | `pnpm --filter @codi/database build`                   |
| Format all            | `pnpm format`                                          |
| Add a dep             | `pnpm --filter @codi/<pkg> add <pkg>`                  |

## TypeScript conventions

- Root `tsconfig.json` sets `moduleResolution: "bundler"`, strict mode.
- Packages using source-entry (`main: "./src/index.ts"`) do not need a build step for consumers that also bundle (Next.js, NestJS with tsc bundler).
- `@codi/database` must be built (`tsc → dist/`) because its consumers expect compiled JS.
- `@codi/web` uses `paths: { "@/*": ["./src/*"] }` for local imports.
- `@codi/web` uses `jsx: "react-jsx"` (modern JSX transform, no manual `import React`).

## Style

- Prettier: semicolons, single quotes, trailing commas, 100 print width, 2-space tabs.
- No ESLint config files found outside NestJS templates — linting relies on `next lint` and `tsc --noEmit`.
- En interfaces, no usar estrellas, destellos ni otros adornos genéricos asociados a estética de IA. Tampoco crear subtítulos en mayúsculas con `tracking` como etiqueta decorativa sobre títulos. La jerarquía visual debe resolverse con tipografía, composición y elementos propios del producto.

## Env

- `.env` at repo root (gitignored). Copy `.env.example` to create it.
- Variables used: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `REDIS_URL`, `FRONTEND_URL`, `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`.
- NestJS apps load env via `@nestjs/config` or direct `process.env` — not via dotenv in their own code.

## Migración a Supabase (preservando datos)

Cuando llegue el momento de migrar de PostgreSQL local a Supabase, seguir estos pasos **sin perder datos**:

### 1. Backup completo de la BD local

```sh
pg_dump -h localhost -U cmsuser -d cmsdb --no-owner --no-acl > /tmp/cmsdb_backup.sql
```

Esto exporta **todas** las tablas: `public.*` (CMS) + `codi_*` (Codi) + Prisma migrations.

### 2. Verificar integridad del backup

```sh
wc -l /tmp/cmsdb_backup.sql
# Debería mostrar muchas líneas (10k+)
head -50 /tmp/cmsdb_backup.sql  # revisar que sea SQL válido
```

### 3. Restaurar en Supabase

```sh
psql "$SUPABASE_DATABASE_URL" < /tmp/cmsdb_backup.sql
```

### 4. Actualizar conexiones

| Componente        | Dónde cambiar                                                                    |
| ----------------- | -------------------------------------------------------------------------------- |
| Codi API + Web    | Editar `.env` → `DATABASE_URL=postgresql://...` (cadena de Supabase)             |
| CMS (intranet)    | Editar `/etc/cms.conf` → `database: postgresql://...` (misma cadena de Supabase) |
| Bridge (intranet) | Editar `.env` del bridge → `DATABASE_URL=...` (misma cadena de Supabase)         |

### 5. Verificar datos preservados

```sh
# Conectarse a Supabase y contar registros
psql "$SUPABASE_DATABASE_URL" -c "SELECT count(*) FROM codi_user;"
psql "$SUPABASE_DATABASE_URL" -c "SELECT count(*) FROM codi_submission;"
psql "$SUPABASE_DATABASE_URL" -c "SELECT count(*) FROM codi_submission_request;"
psql "$SUPABASE_DATABASE_URL" -c "SELECT count(*) FROM public.users;"     # CMS
psql "$SUPABASE_DATABASE_URL" -c "SELECT count(*) FROM public.tasks;"     # CMS
```

Comparar contra la BD local original para confirmar que no se perdió nada.

### 6. Crear tablas `codi_*` faltantes (solo si no se restauraron)

Si una base remota nueva todavía no tiene las tablas `codi_*`, ejecutar:

```sh
pnpm db:setup     # aplica todas las migraciones y carga la semilla inicial
```

Para una base restaurada que ya tiene datos y `_prisma_migrations`, usar `pnpm db:migrate` para aplicar solo las migraciones pendientes.

### ⚠️ Precauciones críticas

- **NO** ejecutar `prisma migrate dev` ni `prisma db push` en Supabase o una base compartida.
- En una base remota existente, usar `pnpm db:migrate` (`migrate deploy`) para cambios de schema.
- `pnpm db:setup` no usa `migrate dev`; está reservado para una base sin tablas `codi_*` y carga el catálogo inicial.
- El firewall de la intranet **debe permitir outbound TCP/5432** hacia la IP de Supabase.

## Clean Code — principios obligatorios

Toda refactorización debe seguir los principios descritos en _Clean Code_ (Robert C. Martin). No se trata únicamente de que el código funcione, sino de que sea fácil de leer, comprender, probar y mantener.

### Responsabilidad única (Single Responsibility)

Cada archivo, componente, hook, función o clase debe tener una única responsabilidad claramente definida.

Si un componente renderiza la UI, obtiene datos, transforma información y maneja eventos complejos, debe dividirse en múltiples unidades.

### Componentes pequeños

Prioriza componentes pequeños y enfocados.

| Límite         | Evaluación                         |
| -------------- | ---------------------------------- |
| < 100 líneas   | Ideal                              |
| 100–150 líneas | Aceptable                          |
| 150–200 líneas | Debe justificarse                  |
| > 300 líneas   | Mala arquitectura — debe dividirse |

### Funciones pequeñas

Las funciones deben realizar una única tarea.

| Límite       | Evaluación         |
| ------------ | ------------------ |
| < 20 líneas  | Ideal              |
| 20–40 líneas | Máximo recomendado |
| > 40 líneas  | Debe dividirse     |

Si una función necesita comentarios para entender qué hace, probablemente deba dividirse.

### Nombres claros

Todos los nombres deben describir exactamente su propósito. Evita nombres ambiguos como `data`, `info`, `temp`, `helper`, `utils`, `manager`, `service`, `handleData`, `process`.

Prefiere nombres que expresen intención: `calculateFinalScore()`, `createGoogleOAuthUrl()`, `fetchCurrentUser()`.

### Código autoexplicativo

Reduce al mínimo el uso de comentarios. Cuando un comentario parece necesario para explicar el código, primero intenta mejorar los nombres o extraer funciones. Los comentarios deben reservarse para explicar decisiones de negocio o motivos técnicos complejos.

### Evitar duplicación (DRY)

Identifica cualquier lógica repetida y extráela a hooks personalizados, utilidades (`utils/`), servicios (`services/`), funciones compartidas (`shared/lib/`) o componentes reutilizables. No dupliques lógica entre páginas o componentes.

### Mantener baja complejidad

Reduce la complejidad ciclomática. Evita múltiples `if` anidados, cadenas largas de `else if`, `switch` excesivos, operadores ternarios anidados y funciones que mezclan demasiados casos de uso. Siempre que sea posible, reemplaza lógica compleja por composición o polimorfismo.

### Composición sobre componentes gigantes

Prefiere construir interfaces mediante pequeños componentes especializados:

```
DashboardPage
 ├── DashboardHeader
 ├── DashboardToolbar
 ├── DashboardFilters
 ├── DashboardTable
 ├── DashboardPagination
 └── DashboardDialogs
```

### Hooks con una sola responsabilidad

Cada hook debe resolver un único problema. Evita hooks que gestionen autenticación, peticiones, formularios y navegación al mismo tiempo.

Ejemplos: `useCurrentUser()`, `useLoginForm()`, `useDashboardFilters()`, `useCourses()`.

### Separación por capas

La lógica de negocio nunca debe vivir dentro de los componentes. Los componentes deben centrarse únicamente en renderizar la interfaz y delegar la lógica a hooks, servicios o funciones compartidas.

### Imports organizados

Agrupa los imports de forma consistente:

1. Librerías externas
2. Módulos internos
3. Componentes
4. Hooks
5. Utilidades
6. Tipos
7. Estilos

Elimina imports sin uso.

### Evitar renderizados innecesarios

Analiza cuidadosamente el árbol de componentes. Aplica `React.memo`, `useMemo` y `useCallback` únicamente cuando aporte beneficios reales. No memorices componentes o valores de forma indiscriminada. Justifica cada optimización indicando el problema que resuelve.

### Código preparado para pruebas

La arquitectura debe facilitar la escritura de pruebas unitarias e integración. Evita acoplar lógica de negocio con la interfaz de usuario.

### Consistencia

Todo el proyecto debe seguir un único estilo arquitectónico. Evita mezclar distintos patrones para resolver el mismo problema.

### Refactorización sin cambiar comportamiento

Todas las mejoras deben preservar exactamente el comportamiento funcional existente. La prioridad es mejorar la calidad interna del código sin introducir regresiones.

### Mentalidad de mantenibilidad

Asume que este proyecto crecerá durante varios años y será mantenido por distintos desarrolladores. Cada decisión debe favorecer la legibilidad, simplicidad, modularidad y facilidad de evolución del sistema antes que soluciones ingeniosas o excesivamente complejas.

## Limitations

- **No test suite** exists (no test runner, no test files anywhere).
- **No CI/CD** configured (no `.github/` directory).
- **No ESLint** for web — only `next lint` (which runs Next.js's built-in ESLint).
- **No codegen scripts** beyond Prisma's own.
