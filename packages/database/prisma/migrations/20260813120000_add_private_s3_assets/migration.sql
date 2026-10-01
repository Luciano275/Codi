DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "codi_user"
    WHERE "avatarUrl" IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'Migration stopped: codi_user.avatarUrl contains data that must be migrated before dropping the column';
  END IF;
END $$;

ALTER TABLE "codi_user"
  DROP COLUMN "avatarUrl",
  ADD COLUMN "avatarObjectKey" TEXT;

ALTER TABLE "codi_lesson"
  ADD COLUMN "pdfObjectKey" TEXT,
  ADD COLUMN "pdfFileName" TEXT,
  ADD COLUMN "videoObjectKey" TEXT,
  ADD COLUMN "videoFileName" TEXT,
  ADD COLUMN "videoContentType" TEXT;
