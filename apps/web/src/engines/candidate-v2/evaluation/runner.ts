// Evaluation Runner
// Summary calculation for Candidate-v2 evaluation results

import type { EvaluationResult, EvaluationSummary } from "./types";

export function calculateSummary(results: EvaluationResult[]): EvaluationSummary {
  const total = results.length;
  if (total === 0) {
    return {
      totalScenarios: 0,
      passedScenarios: 0,
      failedScenarios: 0,
      archetypeAccuracy: 0,
      riskAccuracy: 0,
      extractionConfidenceAverage: 0,
      profileCompletenessAverage: 0,
    };
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  // Archetype accuracy: % of results with archetype that have expected match
  // (passed implies archetype matched, failed implies mismatch)
  const archetypeMatches = results.filter((r) => r.archetype && r.passed).length;
  const archetypeTotal = results.filter((r) => r.archetype).length;
  const archetypeAccuracy = archetypeTotal > 0 ? archetypeMatches / archetypeTotal : 0;

  // Risk accuracy: % of results with overallRisk that passed
  const riskMatches = results.filter((r) => r.overallRisk && r.passed).length;
  const riskTotal = results.filter((r) => r.overallRisk).length;
  const riskAccuracy = riskTotal > 0 ? riskMatches / riskTotal : 0;

  // Average extraction confidence (only for results that have it)
  const confidences = results
    .map((r) => r.extractionConfidence)
    .filter((v): v is number => typeof v === "number");
  const extractionConfidenceAverage =
    confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

  // Average profile completeness (only for results that have it)
  const completeness = results
    .map((r) => r.profileCompleteness)
    .filter((v): v is number => typeof v === "number");
  const profileCompletenessAverage =
    completeness.length > 0
      ? completeness.reduce((a, b) => a + b, 0) / completeness.length
      : 0;

  return {
    totalScenarios: total,
    passedScenarios: passed,
    failedScenarios: failed,
    archetypeAccuracy: Math.round(archetypeAccuracy * 1000) / 1000,
    riskAccuracy: Math.round(riskAccuracy * 1000) / 1000,
    extractionConfidenceAverage: Math.round(extractionConfidenceAverage * 1000) / 1000,
    profileCompletenessAverage: Math.round(profileCompletenessAverage * 1000) / 1000,
  };
}