const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../..', '.env') });

const { Client } = require('pg');

const courses = [
  {
    title: 'Fundamentos de Programación',
    slug: 'fundamentos',
    level: 1,
    region: 'pradera',
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
    region: 'desierto',
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
    region: 'lagos',
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
    region: 'bosque',
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
    region: 'montana',
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
    region: 'volcan',
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
    region: 'valle',
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
    region: 'bosque',
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
    region: 'montana',
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
    region: 'castillo',
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

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    // Check if courses already exist
    const { rows: existing } = await client.query(
      `SELECT COUNT(*) as count FROM "codi_course"`
    );

    if (parseInt(existing[0].count) > 0) {
      console.log(`✓ ${existing[0].count} courses already exist — skipping seed`);
      return;
    }

    await client.query('BEGIN');

    try {
      for (const course of courses) {
        const { rows: [courseRow] } = await client.query(
          `INSERT INTO "codi_course" ("id", "title", "slug", "level", "region", "xpReward", "order", "islandId", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'island-programacion-competitiva', now(), now())
           RETURNING "id"`,
          [course.title, course.slug, course.level, course.region, course.xpReward, course.order]
        );

        for (const mod of course.modules) {
          await client.query(
            `INSERT INTO "codi_module" ("id", "courseId", "title", "order", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, $3, now(), now())`,
            [courseRow.id, mod.title, mod.order]
          );
        }

        console.log(`  ✓ ${course.title}`);
      }

      await client.query('COMMIT');

      console.log(`\n✓ Seeded ${courses.length} courses with ${courses.reduce((s, c) => s + c.modules.length, 0)} modules`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
});
