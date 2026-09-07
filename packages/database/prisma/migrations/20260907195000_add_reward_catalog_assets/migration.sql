UPDATE "codi_reward"
SET "metadata" = "metadata" || '{"color":"#d97706","icon":"calendar-check","imageObjectKey":"rewards/catalog/exam-bonus-v1.webp"}'::jsonb
WHERE "slug" = 'exam-extra-point';

UPDATE "codi_reward"
SET "metadata" = "metadata" || '{"color":"#7c3aed","icon":"book-open-check","imageObjectKey":"rewards/catalog/smart-hint-v1.webp"}'::jsonb
WHERE "slug" = 'smart-hint';

UPDATE "codi_reward"
SET "metadata" = "metadata" || '{"color":"#0891b2","icon":"timer-reset","imageObjectKey":"rewards/catalog/double-xp-v1.webp"}'::jsonb
WHERE "slug" = 'double-xp-24h';
