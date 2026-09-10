CREATE TABLE "codi_ranking_reward_claim" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rankingRewardId" TEXT NOT NULL,
  "gemsAwarded" INTEGER NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "codi_ranking_reward_claim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "codi_ranking_reward_claim_userId_rankingRewardId_periodStart_key"
ON "codi_ranking_reward_claim"("userId", "rankingRewardId", "periodStart");

ALTER TABLE "codi_ranking_reward_claim"
ADD CONSTRAINT "codi_ranking_reward_claim_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "codi_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "codi_ranking_reward_claim"
ADD CONSTRAINT "codi_ranking_reward_claim_rankingRewardId_fkey"
FOREIGN KEY ("rankingRewardId") REFERENCES "codi_ranking_reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
