// Stage 5 — Project Extraction
// Single Claude call + deterministic post-processing pass.
// Fields owned: projects[].

import type { SectionDetectionOutput, ExperienceOutput, ProjectsOutput } from "@/engines/shared/types/stage-outputs";
import type { Project } from "@/engines/shared/types/sub-types";
import { callClaudeWithSchema } from "@/engines/shared/utils/claude-client";
import { normalizeSkill } from "@/engines/shared/utils/skill-vocabulary";
import type { OwnershipLevel, ProjectSource } from "@/engines/shared/types/enums";
import {
  STAGE_5_PROJECTS_PROMPT,
  STAGE_5_PROJECTS_SYSTEM_PROMPT,
} from "@/engines/shared/prompts/stage-5-projects";

// Raw project schema from Claude output
interface RawProject {
  name: string;
  description: string;
  technologies: string[];
  domain: string | null;
  impact: string | null;
  complexity: "trivial" | "simple" | "moderate" | "complex" | "highly_complex";
  production_grade: boolean;
  active_users_estimate: number | null;
  team_size: number | null;
  ownership_level: OwnershipLevel;
  start_year: number | null;
  end_year: number | null;
  is_ongoing: boolean;
  url: string | null;
  source: ProjectSource;
  source_company: string | null;
}

interface RawProjectsOutput {
  raw_projects: RawProject[];
  stage_confidence: number;
  extraction_warnings: string[];
}

// Default output returned on complete stage failure.
export const PROJECTS_STAGE_DEFAULTS: ProjectsOutput = {
  projects: [],
  stage_confidence: 0.1,
  extraction_warnings: ["PROJECTS_EXTRACTION_FAILED_AFTER_RETRY"],
};

// Run Stage 5.
// Input: projects section (primary) + experience section (for work projects).
//
// Post-processing passes:
//   1. source_role_index assignment (fuzzy match source_company → role_history)
//   2. team_size / ownership_level consistency (team_size === 1 → "solo")
//   3. Technology normalisation (Stage 3 vocabulary)
//   4. Impact metric extraction (regex for %, x speedups, user counts, accuracy)
//   5. Deduplication (same project in both sections → retain richer description)
//   6. Scoring + ranking (production_grade 40%, complexity 30%, impact 15%, users 10%, team 5%)
//
// Failure modes:
//   projects.length > 30 → trim to 30; prefer production_grade + complex
//   No projects section → run against full text; stage_confidence = 0.4
export async function runStage5Projects(
  sections: SectionDetectionOutput,
  experience: ExperienceOutput,
): Promise<ProjectsOutput> {
  const projectsText = sections.section_map.projects ?? "";
  const experienceText = sections.section_map.experience ?? "";

  const hasProjectsSection = Boolean(projectsText);
  const inputText = hasProjectsSection ? projectsText : experienceText;
  const baseConfidence = hasProjectsSection ? 0.5 : 0.4;
  const penaltyWarnings = hasProjectsSection ? [] : ["NO_PROJECTS_SECTION"];

  // Compose prompt
  const prompt = STAGE_5_PROJECTS_PROMPT(projectsText, experienceText);

  // Validate raw projects output
  function isRawProjectsOutput(data: unknown): data is RawProjectsOutput {
    if (typeof data !== "object" || data === null) return false;
    const d = data as Record<string, unknown>;
    if (!Array.isArray(d.raw_projects)) return false;
    for (const project of d.raw_projects) {
      if (typeof project !== "object" || project === null) return false;
      const p = project as Record<string, unknown>;
      if (!("name" in p) || !("description" in p) || !("source" in p)) return false;
    }
    if (typeof d.stage_confidence !== "number") return false;
    if (!Array.isArray(d.extraction_warnings)) return false;
    return true;
  }

  const rawDefaults: RawProjectsOutput = {
    raw_projects: [],
    stage_confidence: 0.1,
    extraction_warnings: ["PROJECTS_EXTRACTION_FAILED_AFTER_RETRY"],
  };

  // Claude call
  const result = await callClaudeWithSchema<RawProjectsOutput>(
    {
      prompt,
      systemPrompt: STAGE_5_PROJECTS_SYSTEM_PROMPT,
      maxTokens: 2048,
      temperature: 0.2,
    },
    isRawProjectsOutput,
    rawDefaults,
    "PROJECTS",
  );

  // Post-process raw projects
  let projects: Project[] = result.data.raw_projects.map((p: RawProject): Project => ({
    ...p,
    impact_metric: null,
    source_role_index: null,
    ownership_level: p.ownership_level as OwnershipLevel,
  }));

  // Pass 1: Assign source_role_index
  projects = projects.map((p: Project) => ({
    ...p,
    source_role_index: assignSourceRoleIndex(p.source_company, experience.role_history),
  }));

  // Pass 2: Ownership normalization
  projects = projects.map((p: Project) => {
    if (p.team_size === 1 && p.ownership_level !== "solo") {
      return { ...p, ownership_level: "solo" as const };
    }
    return p;
  });

  // Pass 3: Technology normalization
  projects = projects.map((p: Project) => ({
    ...p,
    technologies: normalizeTechnologies(p.technologies),
  }));

  // Pass 4: Impact metric extraction
  projects = projects.map((p: Project) => ({
    ...p,
    impact_metric: extractImpactMetric(p.impact),
  }));

  // Pass 5: Deduplication
  projects = deduplicateProjects(projects);

  // Pass 6: Production detection (ensure consistency)
  projects = projects.map((p: Project) => ({
    ...p,
    production_grade: detectProductionGrade(p),
  }));

  // Pass 7: Scoring and ranking
  projects = rankProjects(projects);

  // Trim to 30
  if (projects.length > 30) {
    projects = projects.slice(0, 30);
  }

  // Calculate stage confidence
  let stageConfidence = baseConfidence;
  stageConfidence = Math.max(0, stageConfidence - result.confidence_penalty);
  stageConfidence = Math.min(1, stageConfidence);

  // Merge all warnings
  const allWarnings = [
    ...result.data.extraction_warnings,
    ...result.warnings,
    ...penaltyWarnings,
  ];

  return {
    projects,
    stage_confidence: stageConfidence,
    extraction_warnings: allWarnings,
  };
}

// Pass 1: Assign source_role_index by fuzzy-matching source_company against role_history.
export function assignSourceRoleIndex(
  sourceCompany: string | null,
  roleHistory: ExperienceOutput["role_history"],
): number | null {
  if (!sourceCompany || roleHistory.length === 0) return null;

  const target = sourceCompany.toLowerCase().trim();
  if (!target) return null;

  // Exact match first
  for (let i = 0; i < roleHistory.length; i++) {
    const roleCompany = roleHistory[i].company?.toLowerCase().trim();
    if (roleCompany && roleCompany === target) return i;
  }

  // Fuzzy: one contains the other
  for (let i = 0; i < roleHistory.length; i++) {
    const roleCompany = roleHistory[i].company?.toLowerCase().trim();
    if (roleCompany && (roleCompany.includes(target) || target.includes(roleCompany))) {
      return i;
    }
  }

  // Fuzzy: remove common suffixes and compare
  const normalizeCompany = (name: string) =>
    name
      .toLowerCase()
      .replace(/\s+(inc|llc|ltd|corp|corporation|company|co)\.?$/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();

  const targetNorm = normalizeCompany(target);
  for (let i = 0; i < roleHistory.length; i++) {
    const roleCompany = roleHistory[i].company;
    if (roleCompany) {
      const roleNorm = normalizeCompany(roleCompany);
      if (roleNorm && (roleNorm === targetNorm || roleNorm.includes(targetNorm) || targetNorm.includes(roleNorm))) {
        return i;
      }
    }
  }

  return null;
}

// Pass 4: Extract impact metric from impact string.
export function extractImpactMetric(impact: string | null): string | null {
  if (!impact) return null;

  const text = impact.trim();
  if (!text) return null;

  // Patterns for various impact metrics
  const patterns = [
    // % improvements: "improved by 40%", "40% improvement", "reduced by 30%", "30% reduction"
    /(\d+(\.\d+)?)\s*%\s*(improvement|increase|reduction|decrease|gain|lift|boost)/i,
    /(improved|increased|reduced|decreased|cut|boosted)\s+(?:by\s+)?(\d+(\.\d+)?)\s*%/i,
    // x speedups: "2x faster", "3x speedup", "5x improvement"
    /(\d+(\.\d+)?)\s*(x|times)\s*(faster|speedup|improvement|reduction)/i,
    // Latency: "latency reduced by 50ms", "response time 200ms", "inference time 50ms"
    /(latency|response time|inference time|training time)\s*(?:reduced|cut|decreased|improved)?\s*(?:by\s+)?(\d+(\.\d+)?)\s*(ms|seconds?|minutes?|hours?)/i,
    // User counts: "serving 10M users", "100K active users", "handles 1M requests/day"
    /(served|serving|handles?|processes?|supports?)\s+(\d+[KM]?)\s*(users?|requests?|transactions?|queries?|predictions?)/i,
    // Accuracy metrics: "accuracy of 0.95", "f1: 0.89", "auc 0.92"
    /(accuracy|f1|precision|recall|auc|rmse)\s*(?:of|:|is)?\s*0?\.\d+/i,
    // Generic numeric improvements: "reduced cost by 40%", "increased throughput 3x"
    /(reduced|cost|cut)\s+(?:by\s+)?(\d+(\.\d+)?)\s*%/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

// Pass 3: Normalize technologies using Stage 3 vocabulary.
export function normalizeTechnologies(technologies: string[]): string[] {
  return technologies.map((tech) => {
    const normalized = normalizeSkill(tech);
    return normalized;
  });
}

// Pass 5: Deduplicate projects by fuzzy name + technology overlap.
export function deduplicateProjects(projects: Project[]): Project[] {
  const seen = new Map<string, Project>();

  for (const project of projects) {
    const key = generateDedupKey(project);

    if (seen.has(key)) {
      const existing = seen.get(key)!;
      // Keep the richer record (longer description + more technologies)
      const existingRichness = (existing.description?.length ?? 0) + (existing.technologies?.length ?? 0);
      const newRichness = (project.description?.length ?? 0) + (project.technologies?.length ?? 0);

      if (newRichness > existingRichness) {
        seen.set(key, project);
      }
    } else {
      seen.set(key, project);
    }
  }

  return Array.from(seen.values());
}

function generateDedupKey(project: Project): string {
  // Normalize name: lowercase, remove non-alphanumeric
  const nameNorm = project.name.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Normalize top 3 technologies
  const techNorm = project.technologies
    .slice(0, 3)
    .map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .sort()
    .join(",");

  return `${nameNorm}|${techNorm}`;
}

// Production detection logic.
function detectProductionGrade(project: Project): boolean {
  if (project.production_grade) return true;

  const text = `${project.description} ${project.impact ?? ""}`.toLowerCase();

  // Check impact/description for production keywords
  const productionKeywords = [
    "production",
    "deployed",
    "serving",
    "live",
    "launched",
    "in production",
    "went live",
    "released to production",
  ];

  for (const keyword of productionKeywords) {
    if (text.includes(keyword)) return true;
  }

  // Work project with moderate+ complexity
  if (project.source === "work" && ["moderate", "complex", "highly_complex"].includes(project.complexity)) {
    return true;
  }

  // Active users estimate > 0
  if (project.active_users_estimate !== null && project.active_users_estimate > 0) {
    return true;
  }

  return false;
}

// Score a project for ranking.
function scoreProject(project: Project): number {
  // production_grade: 40%
  const productionScore = project.production_grade ? 1.0 : 0.0;

  // complexity: 30%
  const complexityScores: Record<string, number> = {
    trivial: 0.1,
    simple: 0.3,
    moderate: 0.5,
    complex: 0.7,
    highly_complex: 1.0,
  };
  const complexityScore = complexityScores[project.complexity] ?? 0;

  // impact_metric: 15%
  const impactScore = project.impact_metric ? 1.0 : 0.0;

  // active_users_estimate: 10%
  let userScore = 0;
  if (project.active_users_estimate !== null) {
    const users = project.active_users_estimate;
    if (users >= 10000) userScore = 1.0;
    else if (users >= 1000) userScore = 0.7;
    else if (users >= 100) userScore = 0.5;
    else if (users >= 10) userScore = 0.3;
    else userScore = 0.1;
  }

  // team_size: 5%
  let teamScore = 0;
  if (project.team_size !== null) {
    const size = project.team_size;
    if (size >= 15) teamScore = 1.0;
    else if (size >= 6) teamScore = 0.8;
    else if (size >= 2) teamScore = 0.5;
    else teamScore = 0.2;
  }

  return (
    productionScore * 0.40 +
    complexityScore * 0.30 +
    impactScore * 0.15 +
    userScore * 0.10 +
    teamScore * 0.05
  );
}

// Rank projects: production first, then by score descending.
export function rankProjects(projects: Project[]): Project[] {
  const scored = projects.map((p) => ({
    project: p,
    score: scoreProject(p),
    isProduction: p.production_grade,
  }));

  // Sort: production first, then by score descending
  scored.sort((a, b) => {
    if (a.isProduction !== b.isProduction) {
      return b.isProduction ? 1 : -1;
    }
    return b.score - a.score;
  });

  return scored.map((s) => s.project);
}