-- CreateTable
CREATE TABLE "codi_submission_request" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "submissionId" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "cmsSubmissionId" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ,

    CONSTRAINT "codi_submission_request_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "codi_submission_request_submissionId_key" UNIQUE ("submissionId")
);

-- CreateIndex
CREATE INDEX "codi_submission_request_status_idx" ON "codi_submission_request"("status");

-- AddForeignKey
ALTER TABLE "codi_submission_request" ADD CONSTRAINT "codi_submission_request_submissionId_fkey"
    FOREIGN KEY ("submissionId") REFERENCES "codi_submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
