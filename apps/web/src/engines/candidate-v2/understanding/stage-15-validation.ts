// Stage 15 — Validation
// No Claude call. Full schema validation + 16 cross-field invariant checks.
// Always returns a profile — never throws. Failures produce warnings.

import type { AssemblyOutput, ValidationOutput } from "@/engines/shared/types/stage-outputs";
import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";

// Run Stage 15.
// Four validation passes in order:
//   Pass 1 — Structural check (isCandidateProfile type guard)
//   Pass 2 — Cross-field invariants (16 rules from the spec)
//   Pass 3 — Confidence gates (extraction_confidence < 0.4, < 0.2)
//   Pass 4 — Critical array minimums (role_history, skills)
//
// Invariant: always returns a CandidateProfile, even if partially invalid.
export function runStage15Validation(assembly: AssemblyOutput): ValidationOutput {
  // TODO: implement
  void assembly;
  throw new Error("TODO: implement Stage 15 — Validation");
}

// Cross-field invariant checks (16 total from the spec).
// Each check auto-corrects where possible and appends to warnings if not.
export function runCrossFieldInvariants(
  profile: Partial<CandidateProfile>,
  warnings: string[],
  corrections: string[],
): Partial<CandidateProfile> {
  // TODO: implement all 16 invariants
  // Example invariants:
  //   INV-01: total_ml_months <= sum(duration_months)
  //   INV-02: at most one role has is_current === true
  //   INV-03: team_size === 1 → ownership_level === "solo"
  //   INV-04: role_family === primary_role_family (backward compat alias)
  //   INV-05: publication_count === publications.length
  //   INV-06: start_year <= end_year for each role where both non-null
  //   INV-07: years_experience in [0, 60]
  //   INV-08: extraction_confidence in [0.0, 1.0]
  //   INV-09: role_history.length <= 30
  //   INV-10: each duration_months in [0, 600]
  //   INV-11: each certification.year in [1990, 2030] if non-null
  //   INV-12: graduation_year in [1950, 2030] if non-null
  //   INV-13: each claim.length in [5, 500]
  //   INV-14: profile_completeness in [0, 1]
  //   INV-15: production_grade === true → project description.length >= 20
  //   INV-16: no duplicate certification names
  void profile; void warnings; void corrections;
  throw new Error("TODO: implement runCrossFieldInvariants");
}

// Confidence gate warnings.
// extraction_confidence < 0.4 → PIPELINE_LOW_CONFIDENCE
// extraction_confidence < 0.2 → PROFILE_UNRELIABLE
export function applyConfidenceGates(
  profile: Partial<CandidateProfile>,
  warnings: string[],
): void {
  // TODO: implement
  void profile; void warnings;
}

// Critical array minimum warnings.
// role_history.length === 0 → CRITICAL_MISSING_EXPERIENCE
// technical_skills.length === 0 AND frameworks.length === 0 → CRITICAL_MISSING_SKILLS
export function applyArrayMinimumChecks(
  profile: Partial<CandidateProfile>,
  warnings: string[],
): void {
  // TODO: implement
  void profile; void warnings;
}
