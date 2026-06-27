// Stage 12 — Recruiter Signal Derivation
// No Claude call. Deterministic classification over all stage outputs.
// Fields owned: seniority_level, primary_role_family, secondary_role_families,
//               role_family_confidence, specializations, is_career_changer,
//               has_pre_llm_depth, career_trajectory, domain_posture, profile_completeness.

import type {
  IdentityOutput,
  ExperienceOutput,
  SkillsOutput,
  EvidenceOutput,
  RecruiterSignalsOutput,
} from "@/engines/shared/types/stage-outputs";
import type { SeniorityLevel, RoleFamily, DomainPosture } from "@/engines/shared/types/enums";
import type { CareerTrajectory, OwnershipSignals, RoleEntry } from "@/engines/shared/types/sub-types";
import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";

// Run Stage 12.
// No Claude call — reads outputs from Stages 2–11.
export function runStage12RecruiterSignals(
  identity: IdentityOutput,
  experience: ExperienceOutput,
  skills: SkillsOutput,
  evidence: EvidenceOutput,
): RecruiterSignalsOutput {
  // TODO: implement
  //   1. computeSeniorityLevel
  //   2. scoreRoleFamilies → primary + secondaries
  //   3. detectSpecializations
  //   4. computeCareerTrajectory
  //   5. computeDomainPosture
  //   6. checkIsCareerChanger
  //   7. checkHasPreLlmDepth
  //   8. computeProfileCompleteness (preliminary — recomputed in Stage 14)
  void identity; void experience; void skills; void evidence;
  throw new Error("TODO: implement Stage 12 — Recruiter Signals");
}

// Compute seniority level from YoE, title signals, and ownership boost.
export function computeSeniorityLevel(
  yearsExperience: number,
  currentTitle: string | null,
  ownershipSignals: OwnershipSignals,
  totalMlMonths: number,
): SeniorityLevel {
  // TODO: implement
  //   yoe_score:
  //     < 1 → intern, 1-2 → junior, 3-5 → mid, 6-9 → senior, 10-14 → staff, ≥15 → principal
  //   title_signal: junior → -1, staff → +1, principal → +2, director/vp → +3
  //   ownership_boost: owned_full_pipeline AND led_architecture_decisions → +1
  //   clamp to enum range
  void yearsExperience; void currentTitle; void ownershipSignals; void totalMlMonths;
  return "unknown";
}

// Score all role families and return the ranked list.
export function scoreRoleFamilies(
  experience: ExperienceOutput,
  skills: SkillsOutput,
  evidence: EvidenceOutput,
): { primary: RoleFamily; secondaries: RoleFamily[]; confidence: number } {
  // TODO: implement evidence scoring per family from the spec
  void experience; void skills; void evidence;
  return { primary: "unknown", secondaries: [], confidence: 0 };
}

// Compute career trajectory (direction + velocity) from role history.
export function computeCareerTrajectory(
  roleHistory: RoleEntry[],
): CareerTrajectory {
  // TODO: implement
  //   Map roles to seniority scores; compare first-third vs last-third
  //   ascending  → last_third mean > first_third mean + 1 tier
  //   lateral    → means within 1 tier
  //   descending → last_third mean < first_third mean - 1 tier
  //   pivoting   → role_family of first role differs from current
  //   velocity: fast < 6 years to senior, steady 6-10, slow > 10
  void roleHistory;
  return { direction: "lateral", velocity: "steady" };
}

// Compute domain_posture from specialization count and domain_concentration.
export function computeDomainPosture(
  specializationCount: number,
  domainConcentration: number,
  totalSkillCount: number,
): DomainPosture {
  // TODO: implement the five-tier classification from the spec
  void specializationCount; void domainConcentration; void totalSkillCount;
  return "balanced";
}

// 20-field profile completeness checklist from the spec.
// Used by Stage 12 (preliminary) and Stage 14 (final recomputation).
export function computeProfileCompleteness(
  profile: Partial<CandidateProfile>,
): number {
  // TODO: implement weighted checklist (20 fields, weights summing to ~100%)
  void profile;
  return 0;
}
