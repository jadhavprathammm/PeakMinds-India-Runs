// Runtime validation for CandidateProfile V2.
// No zod dependency — plain TypeScript type guards.
// See Stage 15 for the full cross-field invariant pass.

import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";

export interface ValidationResult {
  success: boolean;
  data?: CandidateProfile;
  errors: string[];
  auto_corrections: string[];
}

// Top-level type guard — structural check only.
// Stage 15 runs the full invariant suite on top of this.
export function isCandidateProfile(data: unknown): data is CandidateProfile {
  // TODO: implement structural field-by-field check
  return typeof data === "object" && data !== null;
}

// Full validation pass: structural check + range checks + cross-field invariants.
// Returns the profile even on failure; corrections and errors are reported.
export function validateCandidateProfile(data: unknown): ValidationResult {
  // TODO: implement
  //   Pass 1 — structural check via isCandidateProfile
  //   Pass 2 — range checks (years_experience, graduation_year, etc.)
  //   Pass 3 — cross-field invariants (16 rules from spec)
  //   Pass 4 — confidence gates
  //   Pass 5 — critical array minimums (role_history, skills)
  throw new Error("TODO: implement validateCandidateProfile");
}

// Auto-correct a single invalid field value to its safe default.
// Returns true if correction was applied, false if uncorrectable.
export function autoCorrectField(
  profile: Partial<CandidateProfile>,
  field: keyof CandidateProfile,
  error: string
): boolean {
  // TODO: implement per-field auto-correction rules
  throw new Error("TODO: implement autoCorrectField");
}
