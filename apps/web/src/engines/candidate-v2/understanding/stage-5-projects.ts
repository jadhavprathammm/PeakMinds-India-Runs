// Stage 5 — Project Extraction
// Single Claude call + post-processing.
// Fields owned: projects[].

import type {
  SectionDetectionOutput,
  ExperienceOutput,
  ProjectsOutput,
} from "@/engines/shared/types/stage-outputs";
import type { Project } from "@/engines/shared/types/sub-types";

export const PROJECTS_STAGE_DEFAULTS: ProjectsOutput = {
  projects: [],
  stage_confidence: 0.1,
  extraction_warnings: ["PROJECTS_EXTRACTION_FAILED_AFTER_RETRY"],
};

// Run Stage 5.
// Input: projects section (primary) + experience section.
//
// Post-processing pass:
//   1. source_role_index assignment (match source_company → RoleEntry by company name)
//   2. team_size / ownership_level consistency (team_size === 1 → "solo")
//   3. Technology normalisation (same vocabulary pass as Stage 3)
//   4. impact_metric extraction (scan impact string for %, ratios, user counts)
//   5. Deduplication (same project in both sections → retain richer description)
//   6. Trim to 30 if over limit (prefer production_grade: true + higher complexity)
//
// Failure modes:
//   projects.length > 30 → trim to 30; prefer production_grade + complex
export async function runStage5Projects(
  sections: SectionDetectionOutput,
  experience: ExperienceOutput,
): Promise<ProjectsOutput> {
  // TODO: implement
  void sections; void experience;
  return { ...PROJECTS_STAGE_DEFAULTS };
}

// Assign source_role_index by fuzzy-matching source_company against role_history.
export function assignSourceRoleIndex(
  sourceCompany: string | null,
  roleHistory: ExperienceOutput["role_history"],
): number | null {
  // TODO: implement fuzzy company name matching
  void sourceCompany; void roleHistory;
  return null;
}

// Extract the first impact metric pattern from an impact string.
export function extractImpactMetric(impact: string | null): string | null {
  // TODO: implement regex for %, ratios (Nx), user counts, time units
  void impact;
  return null;
}

// Filter out trivial non-production items extracted as projects by mistake.
function filterTrivialItems(projects: Project[]): Project[] {
  // TODO: discard complexity === "trivial" AND production_grade === false AND no impact
  void projects;
  throw new Error("TODO: implement filterTrivialItems");
}
