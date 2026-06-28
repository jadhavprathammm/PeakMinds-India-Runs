// Stage 6 — Education & Certifications Extraction
// Single Claude call + deterministic post-processing.
// Fields owned: highest_degree, field_of_study, institution, graduation_year,
//               has_ml_related_degree, certifications[], spoken_languages[].

import type { SectionDetectionOutput, EducationOutput } from "@/engines/shared/types/stage-outputs";
import type { DegreeLevel, ProficiencyLevel } from "@/engines/shared/types/enums";
import type { Certification, SpokenLanguage } from "@/engines/shared/types/sub-types";
import { callClaudeWithSchema } from "@/engines/shared/utils/claude-client";
import { isEducationRawOutput, isEducationOutput } from "@/engines/shared/schemas/stage-schemas";
import {
  STAGE_6_EDUCATION_PROMPT,
  STAGE_6_EDUCATION_SYSTEM_PROMPT,
} from "@/engines/shared/prompts/stage-6-education";

// Default output returned on complete stage failure (final shape).
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

// Default output for raw extraction fallback (raw shape).
const EDUCATION_RAW_DEFAULTS = {
  raw_education: [] as Array<{
    degree_label: string | null;
    field_of_study: string | null;
    institution: string | null;
    graduation_year: number | null;
    is_ongoing: boolean;
  }>,
  raw_certifications: [] as Array<{
    name: string;
    issuer: string | null;
    year: number | null;
  }>,
  spoken_languages_raw: [] as Array<{
    language: string;
    proficiency_raw: string | null;
  }>,
  stage_confidence: 0.1,
  extraction_warnings: ["EDUCATION_EXTRACTION_FAILED_AFTER_RETRY"] as string[],
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
  // Compose input text for Claude
  const { educationText, headerText } = composeEducationInputText(sections);

  // No education section — return defaults with warning
  if (!educationText) {
    return {
      ...EDUCATION_STAGE_DEFAULTS,
      extraction_warnings: [...EDUCATION_STAGE_DEFAULTS.extraction_warnings, "NO_EDUCATION_SECTION"],
    };
  }

  // Claude call with raw validator
  const result = await callClaudeWithSchema(
    {
      prompt: STAGE_6_EDUCATION_PROMPT(educationText, headerText),
      systemPrompt: STAGE_6_EDUCATION_SYSTEM_PROMPT,
      maxTokens: 1024,
      temperature: 0.2,
    },
    isEducationRawOutput,
    EDUCATION_RAW_DEFAULTS,
    "EDUCATION",
  );

  // Post-process raw output to final EducationOutput
  const validated = postProcessEducation(result.data, result.warnings);

  // Apply confidence penalty from retry
  validated.stage_confidence = Math.max(0, validated.stage_confidence - result.confidence_penalty);

  // Validate final output against EducationOutput contract
  if (!isEducationOutput(validated)) {
    return {
      ...EDUCATION_STAGE_DEFAULTS,
      extraction_warnings: [
        ...EDUCATION_STAGE_DEFAULTS.extraction_warnings,
        "POST_PROCESSING_VALIDATION_FAILED",
      ],
    };
  }

  return validated;
}

// Compose the text snippet sent to Claude.
// Education section (primary) + header section.
function composeEducationInputText(sections: SectionDetectionOutput): {
  educationText: string;
  headerText: string;
} {
  const educationText = sections.section_map.education ?? "";
  const headerText = sections.section_map.header ?? "";
  return { educationText, headerText };
}

// Post-processing: transform raw extraction into final EducationOutput.
function postProcessEducation(
  raw: typeof EDUCATION_RAW_DEFAULTS,
  retryWarnings: string[],
): EducationOutput {
  const warnings = [...raw.extraction_warnings, ...retryWarnings];

  // Normalize all degree labels
  const normalizedDegrees: (DegreeLevel | null)[] = raw.raw_education.map((edu) =>
    normalizeDegreeLabel(edu.degree_label),
  );

  // Compute highest degree
  const highest_degree = computeHighestDegree(normalizedDegrees);

  // Use the entry with the highest degree for field_of_study, institution, graduation_year
  // Find index of highest degree in normalizedDegrees
  const degreeOrder: DegreeLevel[] = ["phd", "master", "bachelor", "diploma", "bootcamp", "self_taught"];
  let bestIdx = -1;
  for (const level of degreeOrder) {
    bestIdx = normalizedDegrees.findIndex((d) => d === level);
    if (bestIdx !== -1) break;
  }

  const bestEntry = bestIdx !== -1 ? raw.raw_education[bestIdx] : null;

  // Validate graduation_year range [1950, 2030]
  let graduation_year: number | null = bestEntry?.graduation_year ?? null;
  if (graduation_year !== null && (graduation_year < 1950 || graduation_year > 2030)) {
    warnings.push("GRADUATION_YEAR_OUT_OF_RANGE");
    graduation_year = null;
  }

  // Check if field_of_study is ML-related
  const field_of_study = bestEntry?.field_of_study ?? null;
  const has_ml_related_degree = checkMlRelatedDegree(field_of_study);

  // Map certifications
  const certifications: Certification[] = raw.raw_certifications.map((c) => ({
    name: c.name,
    issuer: c.issuer,
    year: c.year,
  }));

  // Map spoken languages with proficiency normalization
  const spoken_languages: SpokenLanguage[] = raw.spoken_languages_raw.map((l) => ({
    language: l.language,
    proficiency: normalizeLanguageProficiency(l.proficiency_raw),
  }));

  // Clamp stage_confidence to [0, 1]
  const stage_confidence = Math.min(1, Math.max(0, raw.stage_confidence ?? 0.5));

  return {
    highest_degree,
    field_of_study,
    institution: bestEntry?.institution ?? null,
    graduation_year,
    has_ml_related_degree,
    certifications,
    spoken_languages,
    stage_confidence,
    extraction_warnings: warnings,
  };
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