<div align="center">

  <img src="apps/web/public/school_logo.png" alt="E.E.T. Nº 3117" width="260" />

  <h1>Escuela de Educación Técnica Nº 3117</h1>
  <h3>“Maestro Daniel Óscar Reyes”</h3>

  <br />

  <img src="apps/web/public/logo.png" alt="Codi Logo" width="110" />

  <h2>✨ Codi</h2>

  <p>
    <strong>Aprendé programación de forma interactiva, gamificada y desde el navegador.</strong>
    <br />
    Plataforma educativa para la E.E.T. Nº 3117 · Salta, Argentina 🇦🇷
  </p>

  <p>
    <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" />
    <img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
    <img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white" />
    <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Turborepo-black?logo=turborepo&logoColor=white" />
    <br />
    <img src="https://img.shields.io/badge/license-MIT-green" />
  </p>

</div>

---

## 📖 Sobre el proyecto

**Codi** es una plataforma educativa diseñada para enseñar programación en escuelas técnicas.

Los estudiantes avanzan a través de cursos estructurados en módulos y lecciones, resolviendo problemas de lógica, estructuras de datos y algoritmos.

A medida que progresan, ganan XP, suben de nivel y participan en sistemas de gamificación como ligas y logros.

---

## 🚀 Características

### 📚 Aprendizaje guiado
- Cursos organizados en módulos y lecciones
- Teoría + práctica + desafíos
- Evaluaciones automáticas por ejercicio

### 🎮 Gamificación
- Sistema de XP y niveles
- Gemas como moneda interna
- Rachas de actividad diaria
- Ligas semanales (Bronce → Legendario)
- Logros desbloqueables
- Misiones diarias dinámicas

### 🧠 Evaluación automática
Ejecución de código (Python por defecto) con verificación automática:

- ✅ Aceptado
- ❌ Incorrecto
- ⚠️ Error de compilación
- ⏱ Tiempo agotado

### ⏱ Exámenes
- Evaluaciones con tiempo límite
- Puntaje por problema
- Corrección automática

### 🔔 Tiempo real
Notificaciones en vivo con WebSockets (Socket.io):

- Resultados de ejercicios
- Cambios en rankings
- Logros desbloqueados

### 🔌 Integración externa (CMS)
Sincronización con un sistema externo de gestión de competencias mediante webhooks.

---

## 🏗️ Arquitectura

<img width="900" alt="architecture" src="https://github.com/user-attachments/assets/4e62717a-89bf-4930-a994-0aeed46d4741" />

| Módulo | Stack | Puerto | Descripción |
|-------|------|--------|-------------|
| `apps/web` | Next.js 16 + React 19 | 3000 | Frontend con editor y UI gamificada |
| `apps/api` | NestJS 11 | 4000 | API REST + WebSockets |
| `apps/cms-adapter` | NestJS 11 | 4001 | Webhooks del CMS externo |
| `packages/database` | Prisma 7 | — | Capa de acceso a datos |
| `packages/auth` | JWT | — | Autenticación |
| `packages/types` | TypeScript | — | Tipos compartidos |
| `packages/ui` | React | — | Componentes UI |
| `packages/validators` | Zod | — | Validaciones compartidas |

---

## 🛠️ Stack tecnológico

| Área | Tecnologías |
|------|------------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Backend | NestJS 11, TypeScript |
| Base de datos | PostgreSQL + Prisma 7 |
| Realtime | Socket.io |
| Auth | JWT |
| Editor | Monaco Editor |
| Validación | Zod |
| Cache | Redis |
| Storage | S3 compatible |

---

## ⚡ Instalación

### Requisitos

- Node.js 20+
- pnpm 11+
- PostgreSQL
- Redis (opcional)

### Setup

```bash
git clone https://github.com/tu-org/codi.git
cd codi

pnpm install

cp .env.example .env

pnpm db:push

pnpm dev
```
