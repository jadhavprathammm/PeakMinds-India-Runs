// Evaluation Comparator
// Comparison logic for golden scenario validation

export interface ComparisonResult {
  passed: boolean;
  mismatches: string[];
}

function compareField(field: string, expected: unknown, actual: unknown): string | null {
  if (expected === undefined) {
    return null;
  }

  const expStr = String(expected).toLowerCase();
  const actStr = String(actual).toLowerCase();

  if (expStr === actStr) {
    return null;
  }

  return `${field}: expected ${expected}, got ${actual}`;
}

export function compareScenario(
  expected: {
    archetype?: string;
    overallRisk?: string;
    primaryRisk?: string;
  },
  actual: {
    archetype?: string;
    overallRisk?: string;
    primaryRisk?: string;
  }
): ComparisonResult {
  const mismatches: string[] = [];

  const archetypeMismatch = compareField("archetype", expected.archetype, actual.archetype);
  if (archetypeMismatch) mismatches.push(archetypeMismatch);

  const riskMismatch = compareField("overallRisk", expected.overallRisk, actual.overallRisk);
  if (riskMismatch) mismatches.push(riskMismatch);

  const primaryRiskMismatch = compareField("primaryRisk", expected.primaryRisk, actual.primaryRisk);
  if (primaryRiskMismatch) mismatches.push(primaryRiskMismatch);

  return {
    passed: mismatches.length === 0,
    mismatches,
  };
}