// Stage 7 — Evidence Extraction
// Single Claude call + post-processing.
// Fields owned: quantified_achievements[], production_deployments[],
//               open_source_contributions[], awards_and_recognition[], publications[].
//
// Key constraint: every Achievement.claim must be a near-verbatim quote from the resume.

import type { PreflightOutput, ExperienceOutput, EvidenceOutput } from "@/engines/shared/types/stage-outputs";

export const EVIDENCE_STAGE_DEFAULTS: EvidenceOutput = {
  quantified_achievements: [],
  production_deployments: [],
  open_source_contributions: [],
  awards_and_recognition: [],
  publications: [],
  stage_confidence: 0.1,
  extraction_warnings: ["EVIDENCE_EXTRACTION_FAILED_AFTER_RETRY"],
};

// Run Stage 7.
// Input: full normalized_text (evidence appears in any section).
//
// Post-processing pass:
//   1. source_role_index assignment (match approximate_source_role_company)
//   2. URL validation for open_source_contributions
//   3. Deduplication (production system in both deployments and projects → keep in both)
//
// Failure modes:
//   raw_achievements.length === 0 → valid; not an error; evidence_strength will reflect this
export async function runStage7Evidence(
  preflight: PreflightOutput,
  experience: ExperienceOutput,
): Promise<EvidenceOutput> {
  // TODO: implement
  void preflight; void experience;
  return { ...EVIDENCE_STAGE_DEFAULTS };
}

// Validate and sanitise a URL string. Returns null if malformed.
export function validateUrl(url: string | null): string | null {
  // TODO: implement URL format validation
  void url;
  return null;
}

// Fuzzy-match a company name from an achievement to a role index.
export function matchCompanyToRoleIndex(
  company: string | null,
  roleHistory: ExperienceOutput["role_history"],
): number | null {
  // TODO: implement case-insensitive partial match
  void company; void roleHistory;
  return null;
}
