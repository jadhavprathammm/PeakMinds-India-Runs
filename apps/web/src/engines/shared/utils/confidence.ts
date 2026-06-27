// Stage confidence penalty helpers.
// Each stage starts at 1.0 and subtracts penalties from the table in the spec.

export interface ConfidencePenalty {
  reason: string;
  amount: number;
}

// Apply a list of penalties to a base confidence score.
// Clamps result to [0.0, 1.0].
export function applyConfidencePenalties(
  base: number,
  penalties: ConfidencePenalty[]
): number {
  // TODO: implement
  //   reduce penalties, subtract each amount, clamp to [0, 1]
  void penalties;
  return base;
}

// Standard penalty amounts from the spec.
export const PENALTY = {
  SOURCE_SECTION_NULL: 0.20,
  CLAUDE_FEWER_ITEMS_THAN_EXPECTED: 0.10,
  JSON_PARSE_REQUIRED_RETRY: 0.15,
  POST_PROCESSING_DISCARDED_OVER_30_PCT: 0.15,
  VALIDATION_WARNING: 0.05, // per warning
} as const;

// Stage weights for overall extraction_confidence (Stage 10).
export const STAGE_WEIGHTS = {
  sections: 0.05,
  identity: 0.10,
  skills: 0.15,
  experience: 0.30,
  projects: 0.08,
  education: 0.05,
  evidence: 0.15,
  communication: 0.05,
  preferences: 0.02,
  archetype: 0.05,
} as const;

// Compute extraction_confidence as a weighted average of stage confidences.
export function computeExtractionConfidence(
  stageConfidences: Partial<Record<keyof typeof STAGE_WEIGHTS, number>>
): number {
  // TODO: implement
  //   sum(weight * confidence) for each stage
  //   clamp to [0.0, 1.0]
  void stageConfidences;
  return 0;
}
