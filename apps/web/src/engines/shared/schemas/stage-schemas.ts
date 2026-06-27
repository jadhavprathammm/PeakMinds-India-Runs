// Runtime type guards for each stage's Claude output contract.
// Used by claude-client.ts to validate responses before processing.

import type {
  IdentityOutput,
  SkillsOutput,
  ExperienceOutput,
  ProjectsOutput,
  EducationOutput,
  EvidenceOutput,
  CommunicationOutput,
  PreferencesOutput,
  ArchetypeOutput,
} from "@/engines/shared/types/stage-outputs";

// ── Stage 2 — Identity ────────────────────────────────────────────────────────

export function isIdentityOutput(data: unknown): data is IdentityOutput {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  // Required keys present
  if (!("stage_confidence" in d) || !("field_confidence" in d)) return false;
  // field_confidence is an object with the six keys
  const fc = d["field_confidence"];
  if (typeof fc !== "object" || fc === null) return false;
  const fcKeys = ["candidate_name", "current_title", "current_company", "years_experience", "location", "contact_email"];
  for (const k of fcKeys) {
    if (!(k in (fc as Record<string, unknown>))) return false;
  }
  // extraction_warnings must be an array
  if (!Array.isArray(d["extraction_warnings"])) return false;
  // Nullable string fields allowed — no further constraint needed for type guard
  return true;
}

// ── Stage 3 — Skills ──────────────────────────────────────────────────────────

export function isSkillsOutput(data: unknown): data is SkillsOutput {
  // TODO: validate all six arrays exist and items are strings
  return typeof data === "object" && data !== null;
}

// ── Stage 4 — Experience ──────────────────────────────────────────────────────

export function isExperienceOutput(data: unknown): data is ExperienceOutput {
  // TODO: validate role_history array, each entry has title/company/is_current
  return typeof data === "object" && data !== null;
}

// ── Stage 5 — Projects ────────────────────────────────────────────────────────

export function isProjectsOutput(data: unknown): data is ProjectsOutput {
  // TODO: validate projects array, each entry has name/description/complexity
  return typeof data === "object" && data !== null;
}

// ── Stage 6 — Education ───────────────────────────────────────────────────────

export function isEducationOutput(data: unknown): data is EducationOutput {
  // TODO: validate degree arrays, graduation_year range [1950, 2030]
  return typeof data === "object" && data !== null;
}

// ── Stage 7 — Evidence ────────────────────────────────────────────────────────

export function isEvidenceOutput(data: unknown): data is EvidenceOutput {
  // TODO: validate each claim.length in [5, 500], metric <= 100 chars
  return typeof data === "object" && data !== null;
}

// ── Stage 8 — Communication ───────────────────────────────────────────────────

export function isCommunicationOutput(data: unknown): data is CommunicationOutput {
  // TODO: validate presentations array, technical_writing booleans
  return typeof data === "object" && data !== null;
}

// ── Stage 9 — Career Preferences ─────────────────────────────────────────────

export function isPreferencesOutput(data: unknown): data is PreferencesOutput {
  // TODO: validate enum values for relocation_willingness, work_mode
  return typeof data === "object" && data !== null;
}

// ── Stage 13 — Archetype ──────────────────────────────────────────────────────

export function isArchetypeOutput(data: unknown): data is ArchetypeOutput {
  // TODO: validate primary_archetype is one of the 8 valid values
  return typeof data === "object" && data !== null;
}
