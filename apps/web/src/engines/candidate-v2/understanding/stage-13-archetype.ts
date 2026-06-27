// Stage 13 — Archetype Classification
// Single Claude call + consistency post-processing.
// Fields owned: archetype, key_differentiators.
//
// Critical constraint: Claude receives structured summary signals only —
// NEVER raw resume text. This prevents superficial textual bias.

import type {
  ExperienceOutput,
  SkillsOutput,
  EvidenceOutput,
  CommunicationOutput,
  RecruiterSignalsOutput,
  RiskOutput,
  ProjectsOutput,
  ArchetypeSummarySignals,
  ArchetypeOutput,
} from "@/engines/shared/types/stage-outputs";
import type { CandidateArchetype, RoleFamily } from "@/engines/shared/types/enums";

export const ARCHETYPE_STAGE_DEFAULTS: ArchetypeOutput = {
  primary_archetype: "generalist",
  secondary_archetype: null,
  confidence: 0.3,
  evidence_summary: "Archetype determined by deterministic fallback.",
  archetype_strengths: [],
  archetype_watch_areas: [],
  key_differentiators: [],
  stage_confidence: 0.1,
  extraction_warnings: ["ARCHETYPE_EXTRACTION_FAILED_AFTER_RETRY"],
};

// Run Stage 13.
// Builds summary signals from structured stage outputs, never from raw text.
// Applies consistency checks and differentiator quality gate after Claude responds.
export async function runStage13Archetype(
  experience: ExperienceOutput,
  skills: SkillsOutput,
  evidence: EvidenceOutput,
  communication: CommunicationOutput,
  recruiter: RecruiterSignalsOutput,
  risk: RiskOutput,
  projects: ProjectsOutput,
): Promise<ArchetypeOutput> {
  // TODO: implement
  //   1. buildArchetypeSummarySignals(...)
  //   2. callClaudeWithSchema(prompt, isArchetypeOutput, ARCHETYPE_STAGE_DEFAULTS, "ARCHETYPE")
  //   3. validateArchetypeConsistency(result, signals)
  //   4. checkDifferentiatorQuality(result.key_differentiators)
  //   5. return result
  void experience; void skills; void evidence; void communication;
  void recruiter; void risk; void projects;
  return { ...ARCHETYPE_STAGE_DEFAULTS };
}

// Assemble the structured signal summary passed to Claude.
// Never exposes raw resume text — only derived signals.
export function buildArchetypeSummarySignals(
  experience: ExperienceOutput,
  skills: SkillsOutput,
  evidence: EvidenceOutput,
  communication: CommunicationOutput,
  recruiter: RecruiterSignalsOutput,
  risk: RiskOutput,
  projects: ProjectsOutput,
): ArchetypeSummarySignals {
  // TODO: implement — derive top_frameworks, top_domain_keywords by frequency
  void experience; void skills; void evidence; void communication;
  void recruiter; void risk; void projects;
  throw new Error("TODO: implement buildArchetypeSummarySignals");
}

// Downgrade confidence if archetype is inconsistent with signals.
// e.g., "builder" with shipped_to_production === false → confidence min(confidence, 0.5)
export function validateArchetypeConsistency(
  output: ArchetypeOutput,
  signals: ArchetypeSummarySignals,
): ArchetypeOutput {
  // TODO: implement consistency rules from the spec
  void output; void signals;
  throw new Error("TODO: implement validateArchetypeConsistency");
}

// Return false if differentiators are empty or all generic.
// Generic = no reference to a specific signal from the summary.
export function checkDifferentiatorQuality(differentiators: string[]): boolean {
  // TODO: implement quality check
  //   Return [] and add warning KEY_DIFFERENTIATORS_LOW_QUALITY if all generic
  void differentiators;
  return false;
}

// Deterministic fallback: map primary_role_family → most likely archetype.
export function deterministicArchetypeFallback(
  primaryRoleFamily: RoleFamily,
): CandidateArchetype {
  // TODO: populate mapping table
  void primaryRoleFamily;
  return "generalist";
}
