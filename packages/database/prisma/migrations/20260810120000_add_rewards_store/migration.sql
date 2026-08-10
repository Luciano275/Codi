-- CreateEnum
CREATE TYPE "RewardCategory" AS ENUM ('EXAMS', 'PRACTICE', 'ADVANTAGES', 'SPECIALS');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('EXAM_BONUS_POINT', 'SMART_HINT', 'DOUBLE_XP');

-- CreateEnum
CREATE TYPE "RewardRedemptionStatus" AS ENUM ('COMPLETED', 'REVOKED');

-- CreateEnum
CREATE TYPE "UserRewardStatus" AS ENUM ('AVAILABLE', 'ACTIVE', 'USED', 'EXPIRED');

-- AlterTable
ALTER TABLE "codi_lesson_completion" ADD COLUMN "xpAwarded" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "codi_submission" ADD COLUMN "xpAwarded" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "codi_reward" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "RewardCategory" NOT NULL,
    "cost" INTEGER NOT NULL,
    "type" "RewardType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "codi_reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_reward_redemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "costPaid" INTEGER NOT NULL,
    "status" "RewardRedemptionStatus" NOT NULL DEFAULT 'COMPLETED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "codi_reward_redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_user_reward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "redemptionId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "status" "UserRewardStatus" NOT NULL,
    "metadata" JSONB,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "codi_user_reward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "codi_reward_slug_key" ON "codi_reward"("slug");
CREATE UNIQUE INDEX "codi_reward_type_key" ON "codi_reward"("type");
CREATE UNIQUE INDEX "codi_reward_redemption_userId_requestId_key" ON "codi_reward_redemption"("userId", "requestId");
CREATE INDEX "codi_reward_redemption_userId_createdAt_idx" ON "codi_reward_redemption"("userId", "createdAt");
CREATE UNIQUE INDEX "codi_user_reward_redemptionId_key" ON "codi_user_reward"("redemptionId");
CREATE INDEX "codi_user_reward_userId_rewardId_slotKey_idx" ON "codi_user_reward"("userId", "rewardId", "slotKey");
CREATE INDEX "codi_user_reward_userId_rewardId_status_expiresAt_idx" ON "codi_user_reward"("userId", "rewardId", "status", "expiresAt");

-- AddForeignKey
ALTER TABLE "codi_reward_redemption" ADD CONSTRAINT "codi_reward_redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "codi_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "codi_reward_redemption" ADD CONSTRAINT "codi_reward_redemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "codi_reward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "codi_user_reward" ADD CONSTRAINT "codi_user_reward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "codi_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "codi_user_reward" ADD CONSTRAINT "codi_user_reward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "codi_reward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "codi_user_reward" ADD CONSTRAINT "codi_user_reward_redemptionId_fkey" FOREIGN KEY ("redemptionId") REFERENCES "codi_reward_redemption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Initial catalogue
INSERT INTO "codi_reward" ("id", "slug", "name", "description", "category", "cost", "type", "isActive", "metadata", "createdAt", "updatedAt") VALUES
  ('6fcbf93e-a3d2-43f1-b416-700000000001', 'exam-extra-point', '+1 punto extra', 'Sumá 1 punto extra en el examen trimestral que elijas.', 'EXAMS', 50, 'EXAM_BONUS_POINT', true, '{"allowedTrimesters":[1,2,3],"maxPerTrimester":1,"visual":"exam"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('6fcbf93e-a3d2-43f1-b416-700000000002', 'smart-hint', 'Pista inteligente', 'Recibí una pista útil para ayudarte a resolver un problema difícil.', 'PRACTICE', 20, 'SMART_HINT', true, '{"maxAvailable":1,"visual":"hint"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('6fcbf93e-a3d2-43f1-b416-700000000003', 'double-xp-24h', 'Doble XP por 24h', 'Multiplicá por 2 los XP obtenidos durante las próximas 24 horas.', 'ADVANTAGES', 40, 'DOUBLE_XP', true, '{"multiplier":2,"durationHours":24,"visual":"double-xp"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
