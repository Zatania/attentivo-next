CREATE TABLE IF NOT EXISTS "QuestionSet" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "QuestionSet_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QuestionSet"
ADD CONSTRAINT "QuestionSet_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "Class"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "QuestionSet_classId_idx"
ON "QuestionSet"("classId");

CREATE INDEX IF NOT EXISTS "QuestionSet_isActive_idx"
ON "QuestionSet"("isActive");

ALTER TABLE "Question"
ADD COLUMN IF NOT EXISTS "questionSetId" TEXT;

ALTER TABLE "Question"
ADD CONSTRAINT "Question_questionSetId_fkey"
FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Question_questionSetId_idx"
ON "Question"("questionSetId");

CREATE INDEX IF NOT EXISTS "Question_isActive_idx"
ON "Question"("isActive");

ALTER TABLE "ClassSession"
ADD COLUMN IF NOT EXISTS "questionSetId" TEXT;

ALTER TABLE "ClassSession"
ADD CONSTRAINT "ClassSession_questionSetId_fkey"
FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "ClassSession_questionSetId_idx"
ON "ClassSession"("questionSetId");

INSERT INTO "QuestionSet" ("id", "classId", "title", "description", "isActive", "createdAt", "updatedAt")
SELECT
  concat('default-', c."id"),
  c."id",
  'Default Question Set',
  'Automatically created for existing MCQs.',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Class" c
WHERE NOT EXISTS (
  SELECT 1 FROM "QuestionSet" qs
  WHERE qs."classId" = c."id"
);

UPDATE "Question" q
SET "questionSetId" = concat('default-', q."classId")
WHERE q."questionSetId" IS NULL;