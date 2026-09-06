CREATE TABLE "codi_island" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "modelPath" TEXT NOT NULL DEFAULT '/islands/isla.glb',
  "available" BOOLEAN NOT NULL DEFAULT true,
  "accent" TEXT NOT NULL DEFAULT '#58cc02',
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "codi_island_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "codi_island_slug_key" ON "codi_island"("slug");

ALTER TABLE "codi_course" ADD COLUMN "islandId" TEXT;
ALTER TABLE "codi_course" ADD CONSTRAINT "codi_course_islandId_fkey"
FOREIGN KEY ("islandId") REFERENCES "codi_island"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "codi_island" ("id", "title", "slug", "description", "modelPath", "available", "accent", "order", "updatedAt")
VALUES
  ('island-programacion-competitiva', 'Programación Competitiva', 'programacion-competitiva', 'Dominá algoritmos, estructuras de datos y desafíos OIA.', '/islands/isla.glb', true, '#58cc02', 1, CURRENT_TIMESTAMP),
  ('island-programacion-mobile', 'Programación Mobile', 'programacion-mobile', 'Creá aplicaciones móviles y experiencias para cualquier dispositivo.', '/islands/isla.glb', false, '#9ca3af', 2, CURRENT_TIMESTAMP);

UPDATE "codi_course"
SET "islandId" = 'island-programacion-competitiva'
WHERE "islandId" IS NULL;
