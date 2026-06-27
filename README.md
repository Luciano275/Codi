<div align="center">
  <img src="apps/web/public/logo.png" alt="Codi Logo" width="120" height="120" />
  <br/>
  <img src="apps/web/public/school_logo.png" alt="E.E.T. Nº 3117" width="80" />
  <br/>
  <sub>Escuela de Educación Técnica Nº 3117 — Maestro Daniel Óscar Reyes</sub>
</div>

<h1 align="center">✨ Codi</h1>

<p align="center">
  <strong>Aprendé programación de forma interactiva, gamificada y desde tu navegador.</strong>
  <br/>
  Plataforma educativa diseñada para la <strong>E.E.T. Nº 3117</strong> · Salta, Argentina 🇦🇷
</p>

<p align="center">
  <a href="#-tecnologías"><img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS 11" /></a>
  <a href="#-tecnologías"><img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white" alt="Next.js 16" /></a>
  <a href="#-tecnologías"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" /></a>
  <a href="#-tecnologías"><img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white" alt="Prisma 7" /></a>
  <a href="#-tecnologías"><img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" alt="TypeScript 6" /></a>
  <a href="#-tecnologías"><img src="https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white" alt="Turborepo" /></a>
  <br/>
  <a href="#"><img src="https://img.shields.io/badge/license-MIT-green" alt="License" /></a>
</p>

---

## 📖 Sobre Codi

**Codi** es una plataforma de aprendizaje de programación pensada para escuelas técnicas argentinas. Los estudiantes aprenden lógica, estructuras de datos y algoritmos a través de un recorrido estructurado de cursos, módulos y lecciones — todo mientras ganan **XP**, suben de **nivel**, compiten en **ligas** semanales y desbloquean **logros**.

El proyecto nace como iniciativa de la **Escuela de Educación Técnica Nº 3117 "Maestro Daniel Óscar Reyes"** de Salta, con el objetivo de brindar a sus estudiantes una herramienta moderna, gratuita y motivadora para aprender a programar.

> 💡 **¿Por qué Codi?** Porque creemos que aprender a programar debería sentirse como jugar.

---

## 🚀 Características

### 📚 Recorrido de aprendizaje
Cursos organizados en módulos y lecciones con tipos variados: teoría, práctica, desafíos y exámenes. Cada lección contiene problemas vinculados a un sistema externo de gestión de competencias (CMS).

### 🎮 Gamificación
- **Puntos de experiencia (XP)** y **niveles** por completar actividades
- **Gemas** como moneda secundaria
- **Rachas (streaks)** por actividad diaria consecutiva
- **Ligas semanales** con 6 divisiones: Bronce, Plata, Oro, Platino, Diamante y Legendario
- **Logros desbloqueables** con recompensas en XP
- **Misiones diarias** con objetivos aleatorios

### 📝 Evaluación automática
Los estudiantes escriben y envían código (Python por defecto). Las soluciones se evalúan automáticamente contra casos de prueba, con estados de resultado detallados: Aceptado, Respuesta incorrecta, Error de compilación, Tiempo agotado, etc.

### ⏱ Exámenes cronometrados
Exámenes con tiempo límite compuestos por problemas con puntajes individuales. Intentos controlados y corrección automática.

### 🔔 Notificaciones en tiempo real
Actualizaciones instantáneas de resultados, cambios en rankings y logros mediante WebSockets (Socket.io).

### 🔌 Integración con CMS
Los problemas se crean y gestionan en un sistema externo de gestión de competencias (CMS). Codi se sincroniza automáticamente mediante webhooks, manteniendo su propia base de datos actualizada.

---

## 🏗️ Arquitectura

```
                   ┌─────────────┐     ┌────────────────┐     ┌────────────────┐
                   │  apps/web   │     │   apps/api     │     │ apps/cms-      │
                   │ Next.js 16  │────>│  NestJS 11     │     │ adapter        │
                   │ (Frontend)  │     │  (Backend)     │     │ NestJS 11      │
                   │  :3000      │     │  :4000         │     │ (Webhooks)     │
                   └─────────────┘     └───────┬────────┘     └───────┬────────┘
                            ▲                  │                      │
                            │           ┌──────┴──────┐      ┌───────┴────────┐
                            │           │   Redis      │      │   External CMS  │
                            │           │ (cache/q)    │      │   (Competition  │
                            │           └──────┬──────┘      │    Manager)     │
                            │                  │             └────────────────┘
                            │           ┌──────┴──────┐
                            └───────────┤  PostgreSQL  │
                                        │  (Prisma 7)  │
                                        └─────────────┘
```

| App / Package | Tecnología | Puerto | Descripción |
|---|---|---|---|
| `apps/web` | Next.js 16 + React 19 | `3000` | Frontend SPA con App Router, editor Monaco y animaciones |
| `apps/api` | NestJS 11 | `4000` | API REST + WebSockets (JWT, gamificación, exámenes) |
| `apps/cms-adapter` | NestJS 11 | `4001` | Proxy de webhooks del CMS externo hacia Prisma |
| `packages/database` | Prisma 7 + PostgreSQL | — | Cliente singleton de Prisma + módulo NestJS |
| `packages/config` | — | — | Configuración centralizada desde variables de entorno |
| `packages/auth` | — | — | Re-exportaciones de autenticación |
| `packages/types` | TypeScript | — | Tipos compartidos entre apps |
| `packages/ui` | React 19 | — | Biblioteca de componentes UI (en desarrollo) |
| `packages/validators` | Zod 4 | — | Esquemas de validación compartidos (en desarrollo) |

---

## 🛠️ Tecnologías

| Área | Tecnología |
|---|---|
| **Monorepo** | Turborepo + pnpm workspaces |
| **Backend** | NestJS 11, TypeScript 6 |
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, Framer Motion |
| **Base de datos** | PostgreSQL + Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| **Autenticación** | JWT (passport-jwt, @nestjs/jwt) |
| **WebSockets** | Socket.io |
| **Validación** | Zod 4 |
| **Cache** | Redis (configurado) |
| **Almacenamiento** | S3-compatible (configurado) |
| **Editor de código** | Monaco Editor |
| **Íconos** | Lucide React |
| **Fuentes** | Nunito (Google Fonts) |

---

## ⚡ Comenzar

### Requisitos

- Node.js ≥ 20
- pnpm 11
- PostgreSQL
- Redis (opcional, para caché)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-org/codi.git
cd codi

# Instalar dependencias
pnpm install

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Inicializar la base de datos
pnpm db:push

# Iniciar en modo desarrollo
pnpm dev
```

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia todas las apps en modo desarrollo |
| `pnpm build` | Compila todos los paquetes y apps |
| `pnpm lint` | Ejecuta type-checking y linting |
| `pnpm format` | Formatea el código con Prettier |
| `pnpm dev:api` | Solo API (NestJS) |
| `pnpm db:generate` | Genera el cliente de Prisma |
| `pnpm db:migrate` | Crea y aplica migraciones |
| `pnpm db:studio` | Abre Prisma Studio |
| `pnpm --filter @codi/web dev` | Solo frontend (Next.js) |

---

## 🗺️ Roadmap

- [x] Login y autenticación JWT
- [x] Esquema de base de datos completo (Prisma)
- [x] Arquitectura monorepo con Turborepo
- [ ] CRUD de usuarios y cursos
- [ ] Editor de código (Monaco) en el navegador
- [ ] Sistema de envío y evaluación de soluciones
- [ ] Gamificación: XP, niveles, rachas
- [ ] Ligas semanales y rankings
- [ ] Logros y misiones diarias
- [ ] Exámenes cronometrados
- [ ] CMS adapter (sincronización con CMS externo)
- [ ] Notificaciones en tiempo real
- [ ] Perfiles públicos y tablero de progreso
- [ ] Modo administrador / gestión de contenido

---

## 👨‍🏫 Para docentes

Codi permite crear cursos personalizados, organizar el contenido por módulos y lecciones, y hacer seguimiento del progreso de cada estudiante en tiempo real. Los exámenes se corrigen automáticamente y los rankings semanales motivan la participación constante.

---

## 🧑‍💻 Desarrollado por

| | |
|---|---|
| **Luna Luciano** | [@Luciano275](https://github.com/Luciano275) |
| **Alberti Santiago** | |

Para la **Escuela de Educación Técnica Nº 3117 "Maestro Daniel Óscar Reyes"** — Salta, Argentina.

---

<p align="center">
  <sub>Hecho con ❤️ para la educación pública argentina</sub>
  <br/>
  <img src="apps/web/public/school_logo.png" alt="E.E.T. Nº 3117" width="48" style="margin-top: 8px" />
</p>
