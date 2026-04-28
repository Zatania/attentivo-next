import { AttentionLevel } from "@prisma/client";

export function getAttentionLevel(score: number): AttentionLevel {
  if (score >= 80) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

export function computeAttentionScore(answeredCount: number, totalQuestions: number) {
  if (totalQuestions <= 0) return 0;
  return Number(((answeredCount / totalQuestions) * 100).toFixed(2));
}

export function computeEvaluationGrade(correctCount: number, totalQuestions: number) {
  if (totalQuestions <= 0) return 0;
  return Number(((correctCount / totalQuestions) * 100).toFixed(2));
}