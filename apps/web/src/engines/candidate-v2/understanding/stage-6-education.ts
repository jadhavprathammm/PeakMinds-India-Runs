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
  if (!raw) return null;
  const s = raw.toLowerCase().replace(/[.\s]/g, "");
  if (/(phd|ph\.?d|doctor)/.test(s)) return "phd";
  if (/(m\.?tech|mtech|m\.?s\.?|ms|master|mca|mba|pgdm|msc|mcom|masteroftechnology|masterofscience|masterofcommerce)/.test(s)) return "master";
  if (/(b\.?tech|btech|b\.?e\.?\b|be\b|bachelor|bca|bba|bsc|bcom|bachelorofengineering|bacheloroftechnology|bachelorofscience|bachelorofcommerce)/.test(s)) return "bachelor";
  if (/(diploma|polytechnic)/.test(s)) return "diploma";
  if (/(bootcamp)/.test(s)) return "bootcamp";
  if (/(self.?taught|self.?study|self.?learning)/.test(s)) return "self_taught";
  return null;
}

// Select the highest degree from an array of DegreeLevel values.
// Tier order: phd > master > bachelor > diploma > bootcamp > self_taught.
export function computeHighestDegree(degrees: (DegreeLevel | null)[]): DegreeLevel | null {
  const order: DegreeLevel[] = ["phd", "master", "bachelor", "diploma", "bootcamp", "self_taught"];
  const valid = degrees.filter((d): d is DegreeLevel => d !== null);
  for (const level of order) {
    if (valid.includes(level)) return level;
  }
  return null;
}

// Check if a field_of_study string indicates an ML-related degree.
export function checkMlRelatedDegree(fieldOfStudy: string | null): boolean {
  if (!fieldOfStudy) return false;
  const s = fieldOfStudy.toLowerCase();
  const positive = [
    "computer science", "computer engineering", "machine learning", "artificial intelligence",
    "ai", "ml", "data science", "statistics", "mathematics", "applied mathematics",
    "physics", "electrical engineering", "electronics", "robotics", "computational",
    "analytics", "big data", "deep learning", "neural", "nlp", "computer vision"
  ];
  return positive.some(k => s.includes(k));
}

// Map raw proficiency string to ProficiencyLevel enum.
export function normalizeLanguageProficiency(raw: string | null): ProficiencyLevel {
  if (!raw) return "basic";
  const s = raw.toLowerCase().trim();
  if (/native|mother.?tongue|first.?language/.test(s)) return "native";
  if (/fluent|c1|c2|advanced/.test(s)) return "fluent";
  if (/professional|b2|business|working.?proficiency/.test(s)) return "professional";
  if (/conversational|b1|intermediate/.test(s)) return "conversational";
  return "basic";
}
