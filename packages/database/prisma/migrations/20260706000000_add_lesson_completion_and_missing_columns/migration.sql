-- Backfill de la cadena de migraciones: LessonCompletion nunca tuvo migración
-- propia y los campos Problem.gemsReward y Submission.gemsAwarded se aplicaron
-- via prisma db push (commits 6d0899a y 5540a7b).
-- Problem.content y Problem.attachmentUrl ya fueron creados por la migración
-- 20260705203922_add_problem_content.
-- Esta migración debe correr ANTES de 20260810120000_add_rewards_store,
-- que altera "codi_lesson_completion" agregandole "xpAwarded".

-- CreateTable
CREATE TABLE IF NOT EXISTS "codi_lesson_completion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codi_lesson_completion_pkey" PRIMARY KEY ("id")
);

-- AlterTable (fields que el schema ya tiene pero ninguna migración crea)
ALTER TABLE "codi_problem"
ADD COLUMN IF NOT EXISTS "gemsReward" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "codi_submission"
ADD COLUMN IF NOT EXISTS "gemsAwarded" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "codi_lesson_completion_userId_lessonId_key"
ON "codi_lesson_completion"("userId", "lessonId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'codi_lesson_completion_userId_fkey'
          AND conrelid = '"codi_lesson_completion"'::regclass
    ) THEN
        ALTER TABLE "codi_lesson_completion"
        ADD CONSTRAINT "codi_lesson_completion_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "codi_user"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'codi_lesson_completion_lessonId_fkey'
          AND conrelid = '"codi_lesson_completion"'::regclass
    ) THEN
        ALTER TABLE "codi_lesson_completion"
        ADD CONSTRAINT "codi_lesson_completion_lessonId_fkey"
        FOREIGN KEY ("lessonId") REFERENCES "codi_lesson"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
