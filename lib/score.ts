import { AttentionLevel } from "@prisma/client";

export type AttentionScoreInput = {
  answeredCount: number;
  correctCount: number;
  totalQuestions: number;
  averageResponseTimeMs?: number | null;
  intervalSeconds: number;
};

export function getAttentionLevel(score: number): AttentionLevel {
  if (score >= 80) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

export function computeEvaluationGrade(correctCount: number, totalQuestions: number) {
  if (totalQuestions <= 0) return 0;
  return Number(((correctCount / totalQuestions) * 100).toFixed(2));
}

export function computeAttentionScore(input: AttentionScoreInput) {
  const {
    answeredCount,
    correctCount,
    totalQuestions,
    averageResponseTimeMs,
    intervalSeconds
  } = input;

  if (totalQuestions <= 0) return 0;

  const participationRate = answeredCount / totalQuestions;
  const correctnessRate = correctCount / totalQuestions;

  const allowedMs = Math.max(intervalSeconds, 1) * 1000;

  const timingRate =
    averageResponseTimeMs == null
      ? 0
      : Math.max(0, 1 - averageResponseTimeMs / allowedMs);

  const score =
    participationRate * 50 +
    correctnessRate * 30 +
    timingRate * 20;

  return Number(score.toFixed(2));
}