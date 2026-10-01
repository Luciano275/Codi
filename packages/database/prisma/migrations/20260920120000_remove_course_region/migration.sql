-- AlterTable
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "codi_course") THEN
    RAISE EXCEPTION
      'Migration stopped: codi_course contains rows whose region value must be preserved before dropping the column';
  END IF;
END $$;

ALTER TABLE "codi_course" DROP COLUMN "region";
