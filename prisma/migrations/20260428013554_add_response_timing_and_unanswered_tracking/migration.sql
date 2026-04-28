/*
  Warnings:

  - Added the required column `dueAt` to the `Response` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('ANSWERED', 'UNANSWERED');

-- AlterTable
ALTER TABLE "AttentionScore" ADD COLUMN     "averageResponseTimeMs" INTEGER,
ADD COLUMN     "unansweredCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "dueAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "responseStatus" "ResponseStatus" NOT NULL DEFAULT 'ANSWERED',
ADD COLUMN     "responseTimeMs" INTEGER,
ALTER COLUMN "selectedOption" DROP NOT NULL,
ALTER COLUMN "isCorrect" SET DEFAULT false;

-- CreateIndex
CREATE INDEX "Response_responseStatus_idx" ON "Response"("responseStatus");
