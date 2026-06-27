// Stage 3 — Skills Extraction
// Single Claude call + deterministic post-processing pass.
// Fields owned: technical_skills, tools, frameworks, cloud_platforms,
//               databases, domain_keywords.

import type { SectionDetectionOutput, SkillsOutput } from "@/engines/shared/types/stage-outputs";

// Default output returned on complete stage failure.
export const SKILLS_STAGE_DEFAULTS: SkillsOutput = {
  technical_skills: [],
  tools: [],
  frameworks: [],
  cloud_platforms: [],
  databases: [],
  domain_keywords: [],
  stage_confidence: 0.1,
  extraction_warnings: ["SKILLS_EXTRACTION_FAILED_AFTER_RETRY"],
};

// Run Stage 3.
// Input: skills section (primary) + experience section + projects section.
//
// Post-processing pass (after Claude):
//   1. Normalisation      — map raw strings to canonical vocabulary
//   2. Deduplication      — no skill appears in two categories
//   3. Noise filtering    — discard < 2 chars, pure numbers, stopwords
//   4. Length limits      — max 50 items per category
//
// Failure modes:
//   All six arrays empty           → add warning NO_SKILLS_EXTRACTED
//   section_map.skills is null     → use full text; stage_confidence -= 0.2
//   uncertain_skills.length > 20   → log; discard below 0.5 confidence
export async function runStage3Skills(
  sections: SectionDetectionOutput,
): Promise<SkillsOutput> {
  // TODO: implement
  //   1. compose input text (skills + experience + projects sections)
  //   2. call callClaudeWithSchema(prompt, isSkillsOutput, SKILLS_STAGE_DEFAULTS, "SKILLS")
  //   3. post-processing pass (normalise, dedup, filter, limit)
  //   4. apply confidence penalties
  void sections;
  return { ...SKILLS_STAGE_DEFAULTS };
}

// Post-processing: normalise, deduplicate, filter, limit all six skill arrays.
function postProcessSkills(raw: SkillsOutput): SkillsOutput {
  // TODO: implement using shared/utils/skill-vocabulary.ts
  void raw;
  throw new Error("TODO: implement postProcessSkills");
}
