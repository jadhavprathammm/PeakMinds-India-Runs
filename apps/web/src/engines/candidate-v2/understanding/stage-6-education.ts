// Stage 6 — Education & Certifications Extraction
// Single Claude call + deterministic post-processing.
// Fields owned: highest_degree, field_of_study, institution, graduation_year,
//               has_ml_related_degree, certifications[], spoken_languages[].

import type { SectionDetectionOutput, EducationOutput } from "@/engines/shared/types/stage-outputs";
import type { DegreeLevel, ProficiencyLevel } from "@/engines/shared/types/enums";

export const EDUCATION_STAGE_DEFAULTS: EducationOutput = {
  highest_degree: null,
  field_of_study: null,
  institution: null,
  graduation_year: null,
  has_ml_related_degree: false,
  certifications: [],
  spoken_languages: [],
  stage_confidence: 0.1,
  extraction_warnings: ["EDUCATION_EXTRACTION_FAILED_AFTER_RETRY"],
};

// Run Stage 6.
// Input: education section (primary) + header section.
//
// Post-processing pass:
//   1. Degree normalisation → DegreeLevel enum
//   2. highest_degree computation (phd > master > bachelor > diploma > bootcamp > self_taught)
//   3. has_ml_related_degree computation (field_of_study keyword check)
//   4. Language proficiency normalisation → ProficiencyLevel enum
//
// Failure modes:
//   No education section       → return defaults; add warning
//   graduation_year out of range → discard; add warning
//   Degree label unrecognisable → highest_degree null for that entry; add warning
export async function runStage6Education(
  sections: SectionDetectionOutput,
): Promise<EducationOutput> {
  // TODO: implement
  void sections;
  return { ...EDUCATION_STAGE_DEFAULTS };
}

// Map a raw degree label string to a DegreeLevel enum value.
// Returns null if the label is unrecognisable.
export function normalizeDegreeLabel(raw: string | null): DegreeLevel | null {
  // TODO: implement
  //   "B.Tech", "B.E.", "Bachelor" → "bachelor"
  //   "M.Tech", "M.S.", "Master"  → "master"
  //   "PhD", "Ph.D.", "Doctor"    → "phd"
  //   "Diploma", "Polytechnic"    → "diploma"
  //   bootcamp keywords           → "bootcamp"
  void raw;
  return null;
}

// Select the highest degree from an array of DegreeLevel values.
// Tier order: phd > master > bachelor > diploma > bootcamp > self_taught.
export function computeHighestDegree(degrees: (DegreeLevel | null)[]): DegreeLevel | null {
  // TODO: implement
  void degrees;
  return null;
}

// Check if a field_of_study string indicates an ML-related degree.
export function checkMlRelatedDegree(fieldOfStudy: string | null): boolean {
  // TODO: implement keyword check
  //   Positive: "Computer Science", "Statistics", "Machine Learning", "AI", etc.
  //   Negative: "Finance", "Law", "History", etc.
  void fieldOfStudy;
  return false;
}

// Map raw proficiency string to ProficiencyLevel enum.
export function normalizeLanguageProficiency(raw: string | null): ProficiencyLevel {
  // TODO: implement
  //   "mother tongue", "native" → "native"
  //   "fluent", "C1", "C2"     → "fluent"
  //   "professional", "B2"     → "professional"
  //   "conversational", "B1"   → "conversational"
  //   "basic", "A1", "A2"      → "basic"
  void raw;
  return "basic";
}
