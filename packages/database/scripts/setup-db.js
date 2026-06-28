const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../..', '.env') });

const { Client } = require('pg');
const fs = require('fs');
const crypto = require('crypto');

const MIGRATION_NAME = '20260625144654_init';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, '../prisma/migrations', MIGRATION_NAME, 'migration.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Migration file not found:', sqlPath);
    process.exit(1);
  }
  const migrationSql = fs.readFileSync(sqlPath, 'utf-8');

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const { rows } = await client.query(
      `SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'codi_user') as exists`
    );

    if (!rows[0].exists) {
      const statements = migrationSql
        .split(/;\s*\n/)
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith('--'));

      for (const stmt of statements) {
        try {
          await client.query(stmt);
        } catch (err) {
          if (err.code === '42710') continue;
          throw err;
        }
      }
      console.log('✓ Codi tables created');
    } else {
      console.log('✓ Codi tables already exist');
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) NOT NULL PRIMARY KEY,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      )
    `);

    const { rows: existing } = await client.query(
      `SELECT id FROM "_prisma_migrations" WHERE migration_name = $1`,
      [MIGRATION_NAME]
    );

    if (existing.length === 0) {
      await client.query(
        `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
         VALUES ($1, $2, now(), $3, now(), 1)`,
        [crypto.randomUUID(), 'd41d8cd98f00b204e9800998ecf8427e', MIGRATION_NAME]
      );
      console.log('✓ Migration baselined');
    } else {
      console.log('✓ Migration already baselined');
    }

    console.log('✓ Database setup complete');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('✗ Database setup failed:', err.message);
  process.exit(1);
});
