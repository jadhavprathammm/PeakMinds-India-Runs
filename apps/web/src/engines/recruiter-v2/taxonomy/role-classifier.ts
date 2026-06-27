// Title → RoleClass taxonomy classifier.
// Used by Stage 4 (per-role classification) and Stage 12 (career trajectory).

import type { RoleClass } from "@/engines/shared/types/enums";

// Keyword → RoleClass mapping table.
// Keys should be lower-cased; classifyTitle() lower-cases before matching.
export const TITLE_TAXONOMY: Array<{ keywords: string[]; role_class: RoleClass }> = [
  // TODO: populate
  // { keywords: ["machine learning engineer", "ml engineer", "applied scientist"], role_class: "core_ml" },
  // { keywords: ["data scientist", "research scientist"], role_class: "ml_adjacent" },
  // { keywords: ["research engineer", "research fellow"], role_class: "research" },
  // { keywords: ["mlops engineer", "ml platform"], role_class: "data_engineering" },
  // { keywords: ["engineering manager", "director of engineering"], role_class: "management" },
  // { keywords: ["software engineer", "sde", "backend engineer"], role_class: "swe_generic" },
];

// Classify a job title into a RoleClass enum value.
// Returns "unknown" if no keyword matches.
export function classifyTitle(title: string): RoleClass {
  // TODO: implement
  //   1. lower-case title
  //   2. iterate TITLE_TAXONOMY, check if any keyword is included in title
  //   3. return first matching role_class
  //   4. return "unknown" if no match
  void title;
  return "unknown";
}

// Derive the most common role family from a set of roles.
// Used by Stage 12 to assess career trajectory and career changer detection.
export function deriveRoleFamilyFromHistory(
  roleTitles: string[]
): RoleClass {
  // TODO: implement
  //   1. classify each title
  //   2. count occurrences per class
  //   3. return the most frequent non-"unknown" class
  void roleTitles;
  return "unknown";
}
