ALTER TABLE "codi_submission"
ADD COLUMN "evaluationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "evaluationLeaseUntil" TIMESTAMP(3),
ADD COLUMN "evaluationWorkerId" TEXT,
ADD COLUMN "evaluationStartedAt" TIMESTAMP(3);

CREATE INDEX "codi_submission_status_evaluationLeaseUntil_submittedAt_idx"
ON "codi_submission"("status", "evaluationLeaseUntil", "submittedAt");
