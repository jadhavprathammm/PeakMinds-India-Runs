// Title → RoleClass taxonomy classifier.
// Used by Stage 4 (per-role classification) and Stage 12 (career trajectory).

import type { RoleClass } from "@/engines/shared/types/enums";

// Keyword → RoleClass mapping table.
// Keys should be lower-cased; classifyTitle() lower-cases before matching.
export const TITLE_TAXONOMY: Array<{ keywords: string[]; role_class: RoleClass }> = [
  // Core ML roles
  { keywords: ["machine learning engineer", "ml engineer", "applied scientist", "ml researcher", "machine learning researcher"], role_class: "core_ml" },
  { keywords: ["deep learning engineer", "nlp engineer", "computer vision engineer", "cv engineer", "llm engineer"], role_class: "core_ml" },
  { keywords: ["ai engineer", "generative ai engineer", "foundation model engineer"], role_class: "core_ml" },

  // ML Adjacent
  { keywords: ["data scientist", "research scientist", "applied researcher", "quantitative researcher"], role_class: "ml_adjacent" },
  { keywords: ["analytics engineer", "ml analyst", "business intelligence"], role_class: "ml_adjacent" },

  // Research
  { keywords: ["research engineer", "research fellow", "postdoc", "phd researcher", "staff researcher"], role_class: "research" },
  { keywords: ["scientist", "principal scientist", "chief scientist"], role_class: "research" },

  // Data Engineering / MLOps
  { keywords: ["mlops engineer", "ml platform engineer", "machine learning infrastructure", "ml systems engineer"], role_class: "data_engineering" },
  { keywords: ["data engineer", "analytics engineer", "etl engineer", "data platform"], role_class: "data_engineering" },

  // Management
  { keywords: ["engineering manager", "director of engineering", "vp engineering", "head of engineering", "cto"], role_class: "management" },
  { keywords: ["ml manager", "ml lead", "ai lead", "data science manager", "ml team lead"], role_class: "management" },
  { keywords: ["tech lead", "technical lead", "team lead", "lead engineer"], role_class: "management" },

  // Software Engineering (generic)
  { keywords: ["software engineer", "sde", "backend engineer", "frontend engineer", "full stack engineer", "fullstack engineer"], role_class: "swe_generic" },
  { keywords: ["developer", "programmer", "software developer", "application engineer"], role_class: "swe_generic" },
];

// Classify a job title into a RoleClass enum value.
// Returns "unknown" if no keyword matches.
export function classifyTitle(title: string): RoleClass {
  if (!title) return "unknown";
  const lowerTitle = title.toLowerCase();

  for (const { keywords, role_class } of TITLE_TAXONOMY) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        return role_class;
      }
    }
  }

  return "unknown";
}

// Derive the most common role family from a set of roles.
// Used by Stage 12 to assess career trajectory and career changer detection.
export function deriveRoleFamilyFromHistory(
  roleTitles: string[]
): RoleClass {
  const counts: Record<RoleClass, number> = {
    core_ml: 0,
    ml_adjacent: 0,
    research: 0,
    swe_generic: 0,
    management: 0,
    data_engineering: 0,
    unknown: 0,
  };

  for (const title of roleTitles) {
    const cls = classifyTitle(title);
    counts[cls]++;
  }

  // Find the most frequent non-"unknown" class
  let best: RoleClass = "unknown";
  let bestCount = 0;
  for (const [cls, count] of Object.entries(counts)) {
    if (cls !== "unknown" && count > bestCount) {
      bestCount = count;
      best = cls as RoleClass;
    }
  }

  return bestCount > 0 ? best : "unknown";
}