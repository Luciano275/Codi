ALTER TABLE "codi_lesson"
ADD COLUMN "gemsReward" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "codi_lesson_completion"
ADD COLUMN "gemsAwarded" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "codi_island"
ADD COLUMN "modelObjectKey" TEXT;
