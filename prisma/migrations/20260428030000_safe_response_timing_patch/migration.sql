DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ResponseStatus') THEN
    CREATE TYPE "ResponseStatus" AS ENUM ('ANSWERED', 'UNANSWERED');
  END IF;
END $$;

ALTER TABLE "AttentionScore"
ADD COLUMN IF NOT EXISTS "averageResponseTimeMs" INTEGER;

ALTER TABLE "AttentionScore"
ADD COLUMN IF NOT EXISTS "unansweredCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Response"
ADD COLUMN IF NOT EXISTS "dueAt" TIMESTAMP(3);

UPDATE "Response"
SET "dueAt" = "respondedAt"
WHERE "dueAt" IS NULL;

ALTER TABLE "Response"
ALTER COLUMN "dueAt" SET NOT NULL;

ALTER TABLE "Response"
ADD COLUMN IF NOT EXISTS "responseTimeMs" INTEGER;

ALTER TABLE "Response"
ADD COLUMN IF NOT EXISTS "responseStatus" "ResponseStatus" NOT NULL DEFAULT 'ANSWERED';

ALTER TABLE "Response"
ALTER COLUMN "selectedOption" DROP NOT NULL;

ALTER TABLE "Response"
ALTER COLUMN "isCorrect" SET DEFAULT false;

CREATE INDEX IF NOT EXISTS "Response_responseStatus_idx"
ON "Response"("responseStatus");