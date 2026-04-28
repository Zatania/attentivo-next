-- CreateIndex
CREATE INDEX "AttentionScore_sessionId_classId_idx" ON "AttentionScore"("sessionId", "classId");

-- CreateIndex
CREATE INDEX "Response_sessionId_classId_idx" ON "Response"("sessionId", "classId");

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttentionScore" ADD CONSTRAINT "AttentionScore_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
