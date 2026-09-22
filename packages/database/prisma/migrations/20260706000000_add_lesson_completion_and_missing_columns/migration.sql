-- Backfill de la cadena de migraciones: LessonCompletion nunca tuvo migración
-- propia y los campos Problem.content/attachmentUrl/gemsReward y
-- Submission.gemsAwarded se aplicaron via prisma db push (commits 6d0899a y 5540a7b).
-- Esta migración debe correr ANTES de 20260810120000_add_rewards_store,
-- que altera "codi_lesson_completion" agregandole "xpAwarded".

-- CreateTable
CREATE TABLE "codi_lesson_completion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codi_lesson_completion_pkey" PRIMARY KEY ("id")
);

-- AlterTable (fields que el schema ya tiene pero ninguna migración crea)
ALTER TABLE "codi_problem" ADD COLUMN "gemsReward" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "codi_problem" ADD COLUMN "content" JSONB;
ALTER TABLE "codi_problem" ADD COLUMN "attachmentUrl" TEXT;
ALTER TABLE "codi_submission" ADD COLUMN "gemsAwarded" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "codi_lesson_completion_userId_lessonId_key" ON "codi_lesson_completion"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "codi_lesson_completion" ADD CONSTRAINT "codi_lesson_completion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "codi_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_lesson_completion" ADD CONSTRAINT "codi_lesson_completion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "codi_lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
