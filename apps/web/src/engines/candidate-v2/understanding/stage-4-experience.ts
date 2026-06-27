// Stage 4 — Experience Extraction
// Single Claude call + the most complex deterministic post-processing stage.
// Fields owned: role_history, total_ml_months, has_management_experience,
//               leadership_signals, ownership_signals.
//
// Design principle: Claude extracts structure; all arithmetic and classification
// is deterministic post-processing. Claude never computes durations or averages.

import type { SectionDetectionOutput, ExperienceOutput } from "@/engines/shared/types/stage-outputs";
import type { RoleEntry, LeadershipSignals, OwnershipSignals } from "@/engines/shared/types/sub-types";

// Default output returned on complete stage failure.
export const EXPERIENCE_STAGE_DEFAULTS: ExperienceOutput = {
  role_history: [],
  total_ml_months: 0,
  has_management_experience: false,
  leadership_signals: {
    managed_teams: false,
    team_size_estimate: null,
    led_cross_functional_projects: false,
    mentored_juniors: false,
    presented_externally: false,
  },
  ownership_signals: {
    shipped_to_production: false,
    owned_full_pipeline: false,
    led_architecture_decisions: false,
    drove_measurable_outcomes: false,
  },
  computed_yoe: null,
  stage_confidence: 0.1,
  date_parse_failures: 0,
  extraction_warnings: ["EXPERIENCE_EXTRACTION_FAILED_AFTER_RETRY"],
};

// Run Stage 4.
// Input: experience section (primary) + header section (for current role).
//
// Post-processing per role:
//   1. Date normalisation + duration arithmetic (shared/utils/date-parser.ts)
//   2. Role classification via taxonomy/role-classifier.ts
//   3. Leadership signals derivation (regex over key_responsibilities)
//   4. Ownership signals derivation (regex over all descriptions)
//   5. total_ml_months computation (sum of core_ml + ml_adjacent role durations)
//   6. has_management_experience detection
//
// Failure modes:
//   Date parsing fails for a role   → duration_months = 0; increment date_parse_failures
//   All dates unparseable           → stage_confidence = 0.3; add warning ALL_DATES_UNPARSEABLE
//   section_map.experience is null  → run against full text; stage_confidence = 0.4
//   is_current set for multiple     → retain only most recent; add warning
export async function runStage4Experience(
  sections: SectionDetectionOutput,
  normalizedText: string,
): Promise<ExperienceOutput> {
  // TODO: implement
  void sections; void normalizedText;
  return { ...EXPERIENCE_STAGE_DEFAULTS };
}

// Post-processing: process raw roles into structured RoleEntry[].
function postProcessRoles(rawRoles: unknown[]): {
  roles: RoleEntry[];
  dateParseFailures: number;
  warnings: string[];
} {
  // TODO: implement the 6-step post-processing pass per role
  void rawRoles;
  throw new Error("TODO: implement postProcessRoles");
}

// Scan key_responsibilities text for leadership signals.
export function deriveLeadershipSignals(
  responsibilities: string[],
  allDescriptions: string[],
): LeadershipSignals {
  // TODO: implement keyword matching
  //   managed_teams         → "managed", "led a team of", "direct reports", "people manager"
  //   team_size_estimate    → extract N from "team of N" or "N direct reports"
  //   led_cross_functional  → "cross-functional", "worked with product/design/data"
  //   mentored_juniors      → "mentored", "coached", "onboarded junior"
  //   presented_externally  → "presented at", "conference", "talk", "blog post"
  void responsibilities; void allDescriptions;
  throw new Error("TODO: implement deriveLeadershipSignals");
}

// Scan all role descriptions for ownership signals.
export function deriveOwnershipSignals(descriptions: string[]): OwnershipSignals {
  // TODO: implement keyword matching
  //   shipped_to_production      → "deployed", "shipped", "launched", "serving", "in production"
  //   owned_full_pipeline        → "end-to-end", "from scratch", "full pipeline"
  //   led_architecture_decisions → "architected", "designed the system", "technical lead"
  //   drove_measurable_outcomes  → any percentage, ratio, or order-of-magnitude metric
  void descriptions;
  throw new Error("TODO: implement deriveOwnershipSignals");
}

// Sum duration_months for roles classified as core_ml or ml_adjacent.
export function computeTotalMlMonths(roles: RoleEntry[]): number {
  // TODO: implement
  void roles;
  return 0;
}
