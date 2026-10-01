const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../..', '.env') });

const { Client } = require('pg');
const { randomUUID } = require('node:crypto');

const defaultIslands = [
  {
    id: 'island-programacion-competitiva',
    title: 'Programación Competitiva',
    slug: 'programacion-competitiva',
    description: 'Dominá algoritmos, estructuras de datos y desafíos OIA.',
    modelPath: '/islands/isla.glb',
    available: true,
    accent: '#58cc02',
    order: 1,
  },
  {
    id: 'island-programacion-mobile',
    title: 'Programación Mobile',
    slug: 'programacion-mobile',
    description: 'Creá aplicaciones móviles y experiencias para cualquier dispositivo.',
    modelPath: '/islands/isla-original.glb',
    available: false,
    accent: '#9ca3af',
    order: 2,
  },
];

const courses = [
  {
    title: 'Fundamentos de Programación',
    slug: 'fundamentos',
    level: 1,
    xpReward: 100,
    order: 1,
    modules: [
      { title: 'Introducción a Python', order: 1 },
      { title: 'Variables y Tipos de Datos', order: 2 },
      { title: 'Entrada y Salida', order: 3 },
      { title: 'Operadores Básicos', order: 4 },
    ],
  },
  {
    title: 'Control de Flujo',
    slug: 'control-de-flujo',
    level: 2,
    xpReward: 120,
    order: 2,
    modules: [
      { title: 'Condicionales (if/elif/else)', order: 1 },
      { title: 'Bucles (for/while)', order: 2 },
      { title: 'Control de Bucles (break/continue)', order: 3 },
      { title: 'Comprensión de Listas', order: 4 },
    ],
  },
  {
    title: 'Funciones y Modularidad',
    slug: 'funciones',
    level: 3,
    xpReward: 120,
    order: 3,
    modules: [
      { title: 'Definición de Funciones', order: 1 },
      { title: 'Parámetros y Retorno', order: 2 },
      { title: 'Ámbito de Variables', order: 3 },
      { title: 'Módulos y Paquetes', order: 4 },
    ],
  },
  {
    title: 'Estructuras de Datos Básicas',
    slug: 'estructuras-de-datos',
    level: 4,
    xpReward: 150,
    order: 4,
    modules: [
      { title: 'Listas y Tuplas', order: 1 },
      { title: 'Diccionarios', order: 2 },
      { title: 'Conjuntos (Sets)', order: 3 },
      { title: 'Strings y Métodos', order: 4 },
    ],
  },
  {
    title: 'Algoritmos Básicos',
    slug: 'algoritmos-basicos',
    level: 5,
    xpReward: 150,
    order: 5,
    modules: [
      { title: 'Búsqueda Lineal y Binaria', order: 1 },
      { title: 'Ordenamiento (Burbuja, Inserción)', order: 2 },
      { title: 'Algoritmos de Conteo', order: 3 },
      { title: 'Simulación y Procesamiento', order: 4 },
    ],
  },
  {
    title: 'Pilas y Colas',
    slug: 'pilas-y-colas',
    level: 6,
    xpReward: 180,
    order: 6,
    modules: [
      { title: 'Introducción a Pilas (LIFO)', order: 1 },
      { title: 'Introducción a Colas (FIFO)', order: 2 },
      { title: 'Implementación con Listas', order: 3 },
      { title: 'Problemas Clásicos', order: 4 },
    ],
  },
  {
    title: 'Grafos',
    slug: 'grafos',
    level: 7,
    xpReward: 200,
    order: 7,
    modules: [
      { title: 'Representación de Grafos', order: 1 },
      { title: 'BFS (Búsqueda en Anchura)', order: 2 },
      { title: 'DFS (Búsqueda en Profundidad)', order: 3 },
      { title: 'Caminos y Ciclos', order: 4 },
    ],
  },
  {
    title: 'Árboles',
    slug: 'arboles',
    level: 8,
    xpReward: 200,
    order: 8,
    modules: [
      { title: 'Árboles Binarios', order: 1 },
      { title: 'Recorridos (Pre/In/Post-orden)', order: 2 },
      { title: 'Árboles de Búsqueda', order: 3 },
      { title: 'Aplicaciones con Árboles', order: 4 },
    ],
  },
  {
    title: 'Técnicas Avanzadas',
    slug: 'tecnicas-avanzadas',
    level: 9,
    xpReward: 250,
    order: 9,
    modules: [
      { title: 'Recursión Avanzada', order: 1 },
      { title: 'Programación Dinámica I', order: 2 },
      { title: 'Programación Dinámica II', order: 3 },
      { title: 'Algoritmo Greedy', order: 4 },
    ],
  },
  {
    title: 'Preparación OIA',
    slug: 'preparacion-oia',
    level: 10,
    xpReward: 300,
    order: 10,
    modules: [
      { title: 'Estrategias de Competencia', order: 1 },
      { title: 'Problemas de Simulación', order: 2 },
      { title: 'Problemas de Optimización', order: 3 },
      { title: 'Simulacros de Examen', order: 4 },
    ],
  },
];

async function findIslandId(client, island) {
  await client.query(
    `INSERT INTO "codi_island" ("id", "title", "slug", "description", "modelPath", "available", "accent", "order", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
     ON CONFLICT ("slug") DO NOTHING`,
    [
      island.id,
      island.title,
      island.slug,
      island.description,
      island.modelPath,
      island.available,
      island.accent,
      island.order,
    ],
  );

  const { rows } = await client.query(`SELECT "id" FROM "codi_island" WHERE "slug" = $1`, [
    island.slug,
  ]);
  return rows[0].id;
}

async function seedCourse(client, course, islandId) {
  const { rows } = await client.query(
    `INSERT INTO "codi_course" ("id", "title", "slug", "level", "xpReward", "order", "islandId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
     ON CONFLICT ("slug") DO NOTHING
     RETURNING "id"`,
    [
      randomUUID(),
      course.title,
      course.slug,
      course.level,
      course.xpReward,
      course.order,
      islandId,
    ],
  );

  const courseId =
    rows.length > 0
      ? rows[0].id
      : (await client.query(`SELECT "id" FROM "codi_course" WHERE "slug" = $1`, [course.slug]))
          .rows[0].id;
  const existingModules = await client.query(
    `SELECT "title", "order" FROM "codi_module" WHERE "courseId" = $1`,
    [courseId],
  );
  const existingModuleKeys = new Set(
    existingModules.rows.map((module) => `${module.title}:${module.order}`),
  );
  let createdModules = 0;

  for (const module of course.modules) {
    if (existingModuleKeys.has(`${module.title}:${module.order}`)) {
      continue;
    }

    await client.query(
      `INSERT INTO "codi_module" ("id", "courseId", "title", "order", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, now(), now())`,
      [randomUUID(), courseId, module.title, module.order],
    );
    createdModules += 1;
  }

  return { createdCourse: rows.length > 0, createdModules };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query('BEGIN');
    const islandIds = [];
    for (const island of defaultIslands) {
      islandIds.push(await findIslandId(client, island));
    }

    let seededCourses = 0;
    let seededModules = 0;

    for (const course of courses) {
      const result = await seedCourse(client, course, islandIds[0]);
      seededCourses += Number(result.createdCourse);
      seededModules += result.createdModules;
    }

    await client.query('COMMIT');
    console.log(`✓ Seed complete: ${seededCourses} courses and ${seededModules} modules created`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
});
