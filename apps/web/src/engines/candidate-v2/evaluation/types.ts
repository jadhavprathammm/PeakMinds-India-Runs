// Evaluation Types
// Shared interfaces for Candidate-v2 evaluation framework

export interface EvaluationResult {
  scenarioId: string;
  candidateName?: string;
  archetype?: string;
  overallRisk?: string;
  primaryRisk?: string;
  extractionConfidence?: number;
  profileCompleteness?: number;
  passed: boolean;
  mismatches: string[];
}

export interface EvaluationSummary {
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  archetypeAccuracy: number;
  riskAccuracy: number;
  extractionConfidenceAverage: number;
  profileCompletenessAverage: number;
}