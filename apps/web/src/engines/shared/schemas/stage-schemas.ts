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

export function isEducationRawOutput(data: unknown): data is {
  raw_education: Array<{
    degree_label: string | null;
    field_of_study: string | null;
    institution: string | null;
    graduation_year: number | null;
    is_ongoing: boolean;
  }>;
  raw_certifications: Array<{
    name: string;
    issuer: string | null;
    year: number | null;
  }>;
  spoken_languages_raw: Array<{
    language: string;
    proficiency_raw: string | null;
  }>;
  stage_confidence: number;
  extraction_warnings: string[];
} {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;

  // Required top-level keys
  if (!("raw_education" in d) || !("raw_certifications" in d) || !("spoken_languages_raw" in d)) return false;
  if (!("stage_confidence" in d) || !("extraction_warnings" in d)) return false;

  // raw_education: array
  const rawEdu = d["raw_education"];
  if (!Array.isArray(rawEdu)) return false;
  for (const edu of rawEdu) {
    if (typeof edu !== "object" || edu === null) return false;
    const e = edu as Record<string, unknown>;
    if (!("degree_label" in e) || !("field_of_study" in e) || !("institution" in e) ||
        !("graduation_year" in e) || !("is_ongoing" in e)) return false;

    const gy = e["graduation_year"];
    if (gy !== null && (typeof gy !== "number" || gy < 1950 || gy >2030)) return false;
    if (typeof e["is_ongoing"] !== "boolean") return false;
  }

  // raw_certifications: array
  const rawCerts = d["raw_certifications"];
  if (!Array.isArray(rawCerts)) return false;
  for (const cert of rawCerts) {
    if (typeof cert !== "object" || cert === null) return false;
    const c = cert as Record<string, unknown>;
    if (!("name" in c) || !("issuer" in c) || !("year" in c)) return false;

    const y = c["year"];
    if (y !== null && (typeof y !== "number" || y < 1950 || y > 2030)) return false;
  }

  // spoken_languages_raw: array
  const langs = d["spoken_languages_raw"];
  if (!Array.isArray(langs)) return false;
  for (const lang of langs) {
    if (typeof lang !== "object" || lang === null) return false;
    const l = lang as Record<string, unknown>;
    if (!("language" in l) || !("proficiency_raw" in l)) return false;
  }

  // stage_confidence: number 0–1
  const sc = d["stage_confidence"];
  if (typeof sc !== "number" || sc < 0 || sc > 1) return false;

  // extraction_warnings: string[]
  if (!Array.isArray(d["extraction_warnings"])) return false;
  for (const w of d["extraction_warnings"] as unknown[]) {
    if (typeof w !== "string") return false;
  }

  return true;
}

export function isEducationOutput(data: unknown): data is EducationOutput {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;

  // Required keys present
  const requiredKeys = [
    "highest_degree",
    "field_of_study",
    "institution",
    "graduation_year",
    "has_ml_related_degree",
    "certifications",
    "spoken_languages",
    "stage_confidence",
    "extraction_warnings"
  ];
  for (const k of requiredKeys) {
    if (!(k in d)) return false;
  }

  // highest_degree: DegreeLevel | null
  const hd = d["highest_degree"];
  if (hd !== null && !["phd", "master", "bachelor", "diploma", "bootcamp", "self_taught"].includes(hd as string)) {
    return false;
  }

  // graduation_year: number | null, range [1950, 2030]
  const gy = d["graduation_year"];
  if (gy !== null && (typeof gy !== "number" || gy < 1950 || gy > 2030)) return false;

  // has_ml_related_degree: boolean
  if (typeof d["has_ml_related_degree"] !== "boolean") return false;

  // certifications: Certification[]
  const certs = d["certifications"];
  if (!Array.isArray(certs)) return false;
  for (const cert of certs) {
    if (typeof cert !== "object" || cert === null) return false;
    const c = cert as Record<string, unknown>;
    if (!("name" in c) || typeof c["name"] !== "string") return false;
    if (!("issuer" in c) || (c["issuer"] !== null && typeof c["issuer"] !== "string")) return false;
    if (!("year" in c)) return false;
    const y = c["year"];
    if (y !== null && (typeof y !== "number" || y < 1950 || y > 2030)) return false;
  }

  // spoken_languages: SpokenLanguage[]
  const langs = d["spoken_languages"];
  if (!Array.isArray(langs)) return false;
  const validProficiency = ["native", "fluent", "professional", "conversational", "basic"];
  for (const lang of langs) {
    if (typeof lang !== "object" || lang === null) return false;
    const l = lang as Record<string, unknown>;
    if (!("language" in l) || typeof l["language"] !== "string") return false;
    if (!("proficiency" in l) || !validProficiency.includes(l["proficiency"] as string)) return false;
  }

  // stage_confidence: number 0–1
  const sc = d["stage_confidence"];
  if (typeof sc !== "number" || sc < 0 || sc > 1) return false;

  // extraction_warnings: string[]
  if (!Array.isArray(d["extraction_warnings"])) return false;
  for (const w of d["extraction_warnings"] as unknown[]) {
    if (typeof w !== "string") return false;
  }

  return true;
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

// ── Stage 9 — Career Preferences ──────────────────────────────────────────────

export function isPreferencesOutput(data: unknown): data is PreferencesOutput {
  // TODO: validate enum values for relocation_willingness, work_mode
  return typeof data === "object" && data !== null;
}

// ── Stage 13 — Archetype ──────────────────────────────────────────────────────

export function isArchetypeOutput(data: unknown): data is ArchetypeOutput {
  // TODO: validate primary_archetype is one of the 8 valid values
  return typeof data === "object" && data !== null;
}