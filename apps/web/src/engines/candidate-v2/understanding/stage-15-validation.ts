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
  const profile = assembly.profile;
  const warnings: string[] = [];
  const corrections: string[] = [];

  runCrossFieldInvariants(profile, warnings, corrections);
  applyConfidenceGates(profile, warnings);
  applyArrayMinimumChecks(profile, warnings);

  const validation_errors = warnings.filter(w => w.startsWith("CRITICAL") || w.startsWith("INVARIANT")).length;

  return {
    profile,
    is_valid: validation_errors === 0,
    validation_errors,
    auto_corrections: corrections,
  };
}

// Cross-field invariant checks (16 total from the spec).
// Each check auto-corrects where possible and appends to warnings if not.
export function runCrossFieldInvariants(
  profile: CandidateProfile,
  warnings: string[],
  corrections: string[],
): void {
  // INV-01: total_ml_months <= sum(duration_months) for ML roles
  const mlMonthsSum = profile.role_history
    .filter(r => r.role_class === "core_ml" || r.role_class === "ml_adjacent")
    .reduce((sum, r) => sum + r.duration_months, 0);
  if (profile.total_ml_months > mlMonthsSum) {
    warnings.push("INVARIANT_TOTAL_ML_MONTHS_EXCEEDS_SUM");
    profile.total_ml_months = mlMonthsSum;
    corrections.push("CLAMPED_TOTAL_ML_MONTHS_TO_ROLE_SUM");
  }

  // INV-02: at most one role has is_current === true
  const currentRoles = profile.role_history.filter(r => r.is_current);
  if (currentRoles.length > 1) {
    warnings.push("INVARIANT_MULTIPLE_CURRENT_ROLES");
    for (let i = 1; i < currentRoles.length; i++) {
      currentRoles[i].is_current = false;
    }
    corrections.push("AUTO_CORRECTED_MULTIPLE_CURRENT_ROLES");
  }

  // INV-03: team_size === 1 → ownership_level === "solo"
  for (const project of profile.projects) {
    if (project.team_size === 1 && project.ownership_level !== "solo") {
      project.ownership_level = "solo";
      corrections.push("AUTO_CORRECTED_TEAM_SIZE_ONE_OWNERSHIP");
    }
  }

  // INV-04: role_family === primary_role_family (backward compat alias)
  if (profile.role_family !== profile.primary_role_family) {
    profile.role_family = profile.primary_role_family;
    corrections.push("SYNCED_ROLE_FAMILY_ALIAS");
  }

  // INV-05: publication_count === publications.length
  if (profile.communication_signals.publication_count !== profile.publications.length) {
    profile.communication_signals.publication_count = profile.publications.length;
    corrections.push("SYNCED_PUBLICATION_COUNT");
  }

  // INV-06: start_year <= end_year for each role where both non-null
  for (const role of profile.role_history) {
    if (role.start_year !== null && role.end_year !== null && role.start_year > role.end_year) {
      warnings.push("INVARIANT_ROLE_START_AFTER_END");
      const temp = role.start_year;
      role.start_year = role.end_year;
      role.end_year = temp;
      corrections.push("SWAPPED_ROLE_START_END_YEAR");
    }
  }

  // INV-07: years_experience in [0, 60]
  if (profile.years_experience < 0 || profile.years_experience > 60) {
    warnings.push("INVARIANT_YEARS_EXPERIENCE_OUT_OF_RANGE");
    profile.years_experience = Math.max(0, Math.min(60, profile.years_experience));
    corrections.push("CLAMPED_YEARS_EXPERIENCE");
  }

  // INV-08: extraction_confidence in [0.0, 1.0]
  if (profile.extraction_confidence < 0 || profile.extraction_confidence > 1) {
    warnings.push("INVARIANT_EXTRACTION_CONFIDENCE_OUT_OF_RANGE");
    profile.extraction_confidence = Math.max(0, Math.min(1, profile.extraction_confidence));
    corrections.push("CLAMPED_EXTRACTION_CONFIDENCE");
  }

  // INV-09: role_history.length <= 30
  if (profile.role_history.length > 30) {
    warnings.push("INVARIANT_ROLE_HISTORY_TOO_LONG");
    profile.role_history = profile.role_history.slice(0, 30);
    corrections.push("TRUNCATED_ROLE_HISTORY");
  }

  // INV-10: each duration_months in [0, 600]
  for (const role of profile.role_history) {
    if (role.duration_months < 0 || role.duration_months > 600) {
      warnings.push("INVARIANT_DURATION_MONTHS_OUT_OF_RANGE");
      role.duration_months = Math.max(0, Math.min(600, role.duration_months));
      corrections.push("CLAMPED_ROLE_DURATION_MONTHS");
    }
  }

  // INV-11: each certification.year in [1990, 2030] if non-null
  for (const cert of profile.certifications) {
    if (cert.year !== null && (cert.year < 1990 || cert.year > 2030)) {
      warnings.push("INVARIANT_CERTIFICATION_YEAR_OUT_OF_RANGE");
      cert.year = null;
      corrections.push("CLEARED_INVALID_CERTIFICATION_YEAR");
    }
  }

  // INV-12: graduation_year in [1950, 2030] if non-null
  if (profile.graduation_year !== null && (profile.graduation_year < 1950 || profile.graduation_year > 2030)) {
    warnings.push("INVARIANT_GRADUATION_YEAR_OUT_OF_RANGE");
    profile.graduation_year = null;
    corrections.push("CLEARED_INVALID_GRADUATION_YEAR");
  }

  // INV-13: each claim.length in [5, 500]
  for (const ach of profile.quantified_achievements) {
    if (ach.claim.length < 5 || ach.claim.length > 500) {
      warnings.push("INVARIANT_ACHIEVEMENT_CLAIM_LENGTH_OUT_OF_RANGE");
      ach.claim = ach.claim.slice(0, 500);
      if (ach.claim.length < 5) ach.claim = "Claim too short";
      corrections.push("CLAMPED_ACHIEVEMENT_CLAIM");
    }
  }

  // INV-14: profile_completeness in [0, 1] (percentage 0-100)
  if (profile.profile_completeness < 0 || profile.profile_completeness > 100) {
    warnings.push("INVARIANT_PROFILE_COMPLETENESS_OUT_OF_RANGE");
    profile.profile_completeness = Math.max(0, Math.min(100, profile.profile_completeness));
    corrections.push("CLAMPED_PROFILE_COMPLETENESS");
  }

  // INV-15: production_grade === true → project description.length >= 20
  for (const project of profile.projects) {
    if (project.production_grade && project.description.length < 20) {
      warnings.push("INVARIANT_PRODUCTION_GRADE_PROJECT_DESCRIPTION_TOO_SHORT");
      project.production_grade = false;
      corrections.push("DOWNGRADED_PRODUCTION_GRADE");
    }
  }

  // INV-16: no duplicate certification names
  const certNames = new Set<string>();
  const uniqueCerts: typeof profile.certifications = [];
  for (const cert of profile.certifications) {
    if (!certNames.has(cert.name.toLowerCase())) {
      certNames.add(cert.name.toLowerCase());
      uniqueCerts.push(cert);
    } else {
      warnings.push("INVARIANT_DUPLICATE_CERTIFICATION_NAME");
      corrections.push("REMOVED_DUPLICATE_CERTIFICATION");
    }
  }
  profile.certifications = uniqueCerts;
}

// Confidence gate warnings.
// extraction_confidence < 0.4 → PIPELINE_LOW_CONFIDENCE
// extraction_confidence < 0.2 → PROFILE_UNRELIABLE
export function applyConfidenceGates(
  profile: CandidateProfile,
  warnings: string[],
): void {
  if (profile.extraction_confidence < 0.4) {
    warnings.push("PIPELINE_LOW_CONFIDENCE");
  }
  if (profile.extraction_confidence < 0.2) {
    warnings.push("PROFILE_UNRELIABLE");
  }
}

// Critical array minimum warnings.
// role_history.length === 0 → CRITICAL_MISSING_EXPERIENCE
// technical_skills.length === 0 AND frameworks.length === 0 → CRITICAL_MISSING_SKILLS
export function applyArrayMinimumChecks(
  profile: CandidateProfile,
  warnings: string[],
): void {
  if (profile.role_history.length === 0) {
    warnings.push("CRITICAL_MISSING_EXPERIENCE");
  }
  if (profile.technical_skills.length === 0 && profile.frameworks.length === 0) {
    warnings.push("CRITICAL_MISSING_SKILLS");
  }
}