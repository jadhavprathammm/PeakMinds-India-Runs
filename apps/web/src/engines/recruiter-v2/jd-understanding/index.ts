// JD Understanding Engine
// Parses a raw job description string into a structured JdProfileV2 object.
// Mirror of candidate-v2/understanding/ but for the job description side.

export interface JdRequiredSkills {
  technical_skills: string[];
  tools: string[];
  frameworks: string[];
  cloud_platforms: string[];
  databases: string[];
  domain_keywords: string[];
}

export interface JdProfileV2 {
  role_title: string;
  seniority: string | null;
  years_required: number | null;
  required_skills: JdRequiredSkills;
  leadership_requirements: string[];
  nice_to_have_skills: string[];
  industry: string | null;
  work_mode: string | null;
  location: string | null;
  raw_text: string;
}

export interface JdUnderstandingOutput {
  jd_profile: JdProfileV2;
  extraction_confidence: number;
  warnings: string[];
}

// Parse a raw JD string into a structured JdProfileV2.
// Single Claude call with structured output.
export async function runJdUnderstanding(
  rawJdText: string,
): Promise<JdUnderstandingOutput> {
  // TODO: implement
  //   1. build JD extraction prompt
  //   2. call Claude → parse JdProfileV2
  //   3. normalise skill arrays via shared/utils/skill-vocabulary.ts
  //   4. compute extraction_confidence
  void rawJdText;
  throw new Error("TODO: implement runJdUnderstanding");
}

// Normalise raw seniority string to a canonical level.
// e.g. "Senior Software Engineer" → "senior"
export function normalizeSeniority(raw: string | null): string | null {
  // TODO: implement keyword matching
  void raw;
  return null;
}
