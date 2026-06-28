// Stage 3 — Skills Extraction
// Single Claude call + deterministic post-processing pass.
// Fields owned: technical_skills, tools, frameworks, cloud_platforms,
//               databases, domain_keywords.

import type { SectionDetectionOutput, SkillsOutput } from "@/engines/shared/types/stage-outputs";
import { callClaudeWithSchema } from "@/engines/shared/utils/claude-client";
import { isSkillsRawOutput, isSkillsOutput } from "@/engines/shared/schemas/stage-schemas";
import {
  STAGE_3_SKILLS_PROMPT,
  STAGE_3_SKILLS_SYSTEM_PROMPT,
} from "@/engines/shared/prompts/stage-3-skills";
import {
  normalizeSkill,
  deduplicateAcrossCategories,
  filterNoiseSkills,
} from "@/engines/shared/utils/skill-vocabulary";

// Default output returned on complete stage failure (final shape).
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

// Default output for raw extraction fallback (raw shape).
const SKILLS_RAW_DEFAULTS = {
  technical_skills: [] as string[],
  tools: [] as string[],
  frameworks: [] as string[],
  cloud_platforms: [] as string[],
  databases: [] as string[],
  domain_keywords: [] as string[],
  uncertain_skills: [] as Array<{
    skill: string;
    likely_category: "technical_skills" | "tools" | "frameworks" | "cloud_platforms" | "databases" | "domain_keywords";
  }>,
  stage_confidence: 0.1,
  extraction_warnings: ["SKILLS_EXTRACTION_FAILED_AFTER_RETRY"] as string[],
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
//   uncertain_skills.length > 20   → add warning MANY_UNCERTAIN_SKILLS
export async function runStage3Skills(
  sections: SectionDetectionOutput,
): Promise<SkillsOutput> {
  const { skillsText, experienceText, projectsText } = composeSkillsInputText(sections);
  const hasSkillsSection = Boolean(skillsText);

  const result = await callClaudeWithSchema(
    {
      prompt: STAGE_3_SKILLS_PROMPT(skillsText, experienceText, projectsText),
      systemPrompt: STAGE_3_SKILLS_SYSTEM_PROMPT,
      maxTokens: 1024,
      temperature: 0.2,
    },
    isSkillsRawOutput,
    SKILLS_RAW_DEFAULTS,
    "SKILLS",
  );

  const validated = postProcessSkills(result.data, result.warnings, hasSkillsSection);
  validated.stage_confidence = Math.max(0, validated.stage_confidence - result.confidence_penalty - (hasSkillsSection ? 0 : 0.2));

  if (!isSkillsOutput(validated)) {
    return {
      ...SKILLS_STAGE_DEFAULTS,
      extraction_warnings: [
        ...SKILLS_STAGE_DEFAULTS.extraction_warnings,
        "POST_PROCESSING_VALIDATION_FAILED",
      ],
    };
  }

  return validated;
}

// Compose the text snippet sent to Claude.
// Skills section (primary) + experience section + projects section.
function composeSkillsInputText(sections: SectionDetectionOutput): {
  skillsText: string;
  experienceText: string;
  projectsText: string;
} {
  const skillsText = sections.section_map.skills ?? "";
  const experienceText = sections.section_map.experience ?? "";
  const projectsText = sections.section_map.projects ?? "";
  return { skillsText, experienceText, projectsText };
}

// Post-processing: normalise, deduplicate, filter, limit all six skill arrays.
function postProcessSkills(
  raw: typeof SKILLS_RAW_DEFAULTS,
  retryWarnings: string[],
  hasSkillsSection: boolean,
): SkillsOutput {
  const warnings = [...raw.extraction_warnings, ...retryWarnings];

  if (raw.uncertain_skills.length > 0) {
    warnings.push("UNCERTAIN_SKILLS_PRESENT");
    if (raw.uncertain_skills.length > 20) {
      warnings.push("MANY_UNCERTAIN_SKILLS");
    }
  }

  const categories: Record<string, string[]> = {
    technical_skills: raw.technical_skills,
    tools: raw.tools,
    frameworks: raw.frameworks,
    cloud_platforms: raw.cloud_platforms,
    databases: raw.databases,
    domain_keywords: raw.domain_keywords,
  };

  const normalized: Record<string, string[]> = {};
  for (const [cat, skills] of Object.entries(categories)) {
    normalized[cat] = skills.map((s) => normalizeSkill(s));
  }

  const filtered: Record<string, string[]> = {};
  for (const [cat, skills] of Object.entries(normalized)) {
    filtered[cat] = filterNoiseSkills(skills);
  }

  const deduped = deduplicateAcrossCategories(filtered);

  const limited: Record<string, string[]> = {};
  for (const [cat, skills] of Object.entries(deduped)) {
    limited[cat] = skills.slice(0, 50);
  }

  const allEmpty = Object.values(limited).every((arr) => arr.length === 0);
  if (allEmpty) {
    warnings.push("NO_SKILLS_EXTRACTED");
  }

  const stage_confidence = Math.min(1, Math.max(0, raw.stage_confidence ?? 0.5));

  return {
    technical_skills: limited.technical_skills,
    tools: limited.tools,
    frameworks: limited.frameworks,
    cloud_platforms: limited.cloud_platforms,
    databases: limited.databases,
    domain_keywords: limited.domain_keywords,
    stage_confidence,
    extraction_warnings: warnings,
  };
}