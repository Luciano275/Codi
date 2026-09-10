CREATE TABLE "codi_ranking_reward" (
  "id" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "gems" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "codi_ranking_reward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "codi_ranking_reward_position_key" ON "codi_ranking_reward"("position");

INSERT INTO "codi_ranking_reward" ("id", "position", "title", "gems", "updatedAt")
VALUES
  ('ranking-reward-first', 1, 'Premio del primer puesto', 500, CURRENT_TIMESTAMP),
  ('ranking-reward-second', 2, 'Premio del segundo puesto', 300, CURRENT_TIMESTAMP),
  ('ranking-reward-third', 3, 'Premio del tercer puesto', 300, CURRENT_TIMESTAMP);
