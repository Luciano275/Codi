ALTER TABLE "codi_user"
  DROP COLUMN "avatarUrl",
  ADD COLUMN "avatarObjectKey" TEXT;

ALTER TABLE "codi_lesson"
  ADD COLUMN "pdfObjectKey" TEXT,
  ADD COLUMN "pdfFileName" TEXT,
  ADD COLUMN "videoObjectKey" TEXT,
  ADD COLUMN "videoFileName" TEXT,
  ADD COLUMN "videoContentType" TEXT;
