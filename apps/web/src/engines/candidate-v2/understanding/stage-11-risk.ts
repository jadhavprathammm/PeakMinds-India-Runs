// Stage 11 — Risk Analysis
// No Claude call. Deterministic computation over structured stage outputs.
// Fields owned: risk_signals.

import type { ExperienceOutput, SkillsOutput, IdentityOutput, RiskOutput } from "@/engines/shared/types/stage-outputs";
import type { RiskLevel } from "@/engines/shared/types/enums";
import type { RoleEntry, RiskSignals } from "@/engines/shared/types/sub-types";

// Severity ordering for comparison (used by overall_risk_level = max).
export const RISK_SEVERITY: Record<RiskLevel, number> = {
  none: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

// Run Stage 11.
// No Claude call — reads outputs from Stages 2–10.
export function runStage11Risk(
  identity: IdentityOutput,
  experience: ExperienceOutput,
  skills: SkillsOutput,
): RiskOutput {
  // TODO: implement
  //   1. computeJobHoppingRisk
  //   2. computeEvidenceGapRisk
  //   3. computeEmploymentGapRisk
  //   4. computeSpecializationFragilityRisk
  //   5. set extraction_risk from stage_confidences
  //   6. overall_risk_level = max of all components
  //   7. collectRiskFlags
  void identity; void experience; void skills;
  throw new Error("TODO: implement Stage 11 — Risk Analysis");
}

// Job hopping: count short stints (< 18 months), check consecutive.
export function computeJobHoppingRisk(
  roleHistory: RoleEntry[],
): { level: RiskLevel; detail: string | null } {
  // TODO: implement
  //   short_stints = count of roles with duration_months in [1, 17]
  //   consecutive_short = 2+ consecutive short stints
  //   "none"     → short_stints === 0
  //   "low"      → short_stints === 1 AND NOT consecutive
  //   "moderate" → short_stints in [2,3] OR consecutive 2 roles
  //   "high"     → short_stints >= 4 OR consecutive 3+ roles
  //   "critical" → avg_tenure < 10 across 3+ roles
  void roleHistory;
  return { level: "none", detail: null };
}

// Evidence gap: compare stated YoE to evidenced ML months.
export function computeEvidenceGapRisk(
  statedYoe: number | null,
  totalMlMonths: number,
): { level: RiskLevel; detail: string | null } {
  // TODO: implement
  //   inflation_delta = stated_yoe - (total_ml_months / 12)
  //   "none"     → delta <= 1
  //   "low"      → delta in (1, 2]
  //   "moderate" → delta in (2, 3]
  //   "high"     → delta > 3
  //   "critical" → delta > 5
  void statedYoe; void totalMlMonths;
  return { level: "none", detail: null };
}

// Employment gap: find max gap between adjacent roles (sorted by start date).
export function computeEmploymentGapRisk(
  roleHistory: RoleEntry[],
): { level: RiskLevel; employment_gap_months: number } {
  // TODO: implement
  //   Sort role_history by start_year ASC
  //   For each adjacent pair: gap_months = role_{i+1}.start - role_i.end
  //   employment_gap_months = max(gap_months)
  //   "none"     → < 3 months
  //   "low"      → [3, 6)
  //   "moderate" → [6, 12)
  //   "high"     → [12, 24)
  //   "critical" → >= 24
  void roleHistory;
  return { level: "none", employment_gap_months: 0 };
}

// Specialization fragility: domain concentration + framework decay risk.
export function computeSpecializationFragilityRisk(
  skills: SkillsOutput,
  domainConcentration: number,
): RiskLevel {
  // TODO: implement
  //   "none"     → specializations >= 3 AND domain_concentration < 0.6
  //   "low"      → domain_concentration in [0.6, 0.75)
  //   "moderate" → domain_concentration in [0.75, 0.9) AND deprecated framework
  //   "high"     → domain_concentration >= 0.9 OR entire career at one company
  //   "critical" → only one framework AND that framework is declining
  void skills; void domainConcentration;
  return "none";
}

// Return the highest risk level from an array of component levels.
export function maxRiskLevel(levels: RiskLevel[]): RiskLevel {
  // TODO: implement using RISK_SEVERITY ordering
  void levels;
  return "none";
}

// Collect non-null detail strings for risks >= "moderate", ordered by severity.
export function collectRiskFlags(signals: Partial<RiskSignals>): string[] {
  // TODO: implement, limit to 10 items
  void signals;
  return [];
}
