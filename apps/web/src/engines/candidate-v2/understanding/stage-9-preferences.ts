// Stage 9 — Career Preferences Extraction
// Single Claude call + deterministic normalisation.
// Fields owned: career_preferences.
//
// Design decision: most resumes yield a mostly-null object — this is correct.
// This stage extracts only what is explicitly stated; never infers.

import type { SectionDetectionOutput, PreflightOutput, PreferencesOutput } from "@/engines/shared/types/stage-outputs";
import type { RelocationWillingness, WorkModePreference, EmploymentStatus } from "@/engines/shared/types/enums";
import type { CompensationExpectation } from "@/engines/shared/types/sub-types";

export const PREFERENCES_STAGE_DEFAULTS: PreferencesOutput = {
  career_preferences: {
    desired_roles: [],
    preferred_domains: [],
    preferred_locations: [],
    relocation_willingness: "unknown",
    work_mode: "unknown",
    industry_preferences: [],
    employment_status: "unknown",
    open_to_work: false,
    expected_compensation: null,
    start_date_raw: null,
    work_auth_raw: null,
  },
  stage_confidence: 0.5, // low-confidence is normal here; not a failure
  extraction_warnings: [],
};

// Run Stage 9.
// Input: objective_summary (primary) + header + first 300 chars of full text.
//
// Post-processing normalisation:
//   1. relocation_willingness_raw → RelocationWillingness enum
//   2. work_mode_raw              → WorkModePreference enum
//   3. employment_status_raw      → EmploymentStatus enum
//   4. compensation_raw           → CompensationExpectation object
//   5. open_to_work defaults to false if null
export async function runStage9Preferences(
  sections: SectionDetectionOutput,
  preflight: PreflightOutput,
): Promise<PreferencesOutput> {
  // TODO: implement
  void sections; void preflight;
  return { ...PREFERENCES_STAGE_DEFAULTS };
}

// Map raw relocation string to RelocationWillingness enum.
export function normalizeRelocationWillingness(raw: string | null): RelocationWillingness {
  // TODO: implement
  void raw;
  return "unknown";
}

// Map raw work mode string to WorkModePreference enum.
export function normalizeWorkMode(raw: string | null): WorkModePreference {
  // TODO: implement
  void raw;
  return "unknown";
}

// Map raw employment status string to EmploymentStatus enum.
export function normalizeEmploymentStatus(raw: string | null): EmploymentStatus {
  // TODO: implement
  void raw;
  return "unknown";
}

// Parse raw compensation object into a structured CompensationExpectation.
export function parseCompensation(
  raw: { amount_raw: string | null; currency_raw: string | null; period_raw: string | null } | null,
): CompensationExpectation | null {
  // TODO: implement numeric parsing and currency normalisation
  void raw;
  return null;
}
