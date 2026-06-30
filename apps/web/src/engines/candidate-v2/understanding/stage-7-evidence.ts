// Stage 7 — Evidence Extraction
// Single Claude call + deterministic post-processing.
// Fields owned: quantified_achievements[], production_deployments[],
//               open_source_contributions[], awards_and_recognition[], publications[].
//
// Key constraint: every Achievement.claim must be a near-verbatim quote from the resume.

import type { PreflightOutput, ExperienceOutput, EvidenceOutput } from "@/engines/shared/types/stage-outputs";
import type { Achievement, OpenSourceContribution, Publication } from "@/engines/shared/types/sub-types";
import { callClaudeWithSchema } from "@/engines/shared/utils/claude-client";
import {
  STAGE_7_EVIDENCE_PROMPT,
  STAGE_7_EVIDENCE_SYSTEM_PROMPT,
} from "@/engines/shared/prompts/stage-7-evidence";

// Raw evidence schema from Claude
interface RawAchievement {
  claim: string;
  metric: string;
  approximate_source_role_company: string | null;
}

interface RawOpenSourceContribution {
  project_name: string;
  contribution_type: "creator" | "maintainer" | "contributor";
  url: string | null;
}

interface RawPublication {
  title: string;
  venue: string | null;
  year: number | null;
}

interface RawEvidenceOutput {
  quantified_achievements: RawAchievement[];
  production_deployments: string[];
  open_source_contributions: RawOpenSourceContribution[];
  awards_and_recognition: string[];
  publications: RawPublication[];
  stage_confidence: number;
  extraction_warnings: string[];
}

// Default output returned on complete stage failure.
export const EVIDENCE_STAGE_DEFAULTS: EvidenceOutput = {
  quantified_achievements: [],
  production_deployments: [],
  open_source_contributions: [],
  awards_and_recognition: [],
  publications: [],
  stage_confidence: 0.1,
  extraction_warnings: ["EVIDENCE_EXTRACTION_FAILED_AFTER_RETRY"],
};

// Run Stage 7.
// Input: full normalized_text (evidence appears in any section) + experience for role matching.
//
// Post-processing passes:
//   1. source_role_index assignment (fuzzy match approximate_source_role_company)
//   2. URL validation for open_source_contributions
//   3. Deduplication (same deployment in projects + experience → keep both but mark)
//   4. Claim length validation (5-500 chars)
//
// Failure modes:
//   No achievements → valid; evidence_strength will reflect this
//   URL validation fails → drop that OSS contribution
export async function runStage7Evidence(
  preflight: PreflightOutput,
  experience: ExperienceOutput,
): Promise<EvidenceOutput> {
  const normalizedText = preflight.normalized_text;
  const hasSubstantialText = normalizedText.length > 100;
  const baseConfidence = hasSubstantialText ? 0.5 : 0.3;
  const penaltyWarnings = hasSubstantialText ? [] : ["NO_SUBSTANTIAL_TEXT"];

  // Compose prompt
  const prompt = STAGE_7_EVIDENCE_PROMPT(normalizedText);

  // Validate raw evidence output
  function isRawEvidenceOutput(data: unknown): data is RawEvidenceOutput {
    if (typeof data !== "object" || data === null) return false;
    const d = data as Record<string, unknown>;
    const requiredKeys = [
      "quantified_achievements",
      "production_deployments",
      "open_source_contributions",
      "awards_and_recognition",
      "publications",
      "stage_confidence",
      "extraction_warnings",
    ];
    for (const k of requiredKeys) {
      if (!(k in d)) return false;
    }
    if (!Array.isArray(d.quantified_achievements)) return false;
    if (!Array.isArray(d.production_deployments)) return false;
    if (!Array.isArray(d.open_source_contributions)) return false;
    if (!Array.isArray(d.awards_and_recognition)) return false;
    if (!Array.isArray(d.publications)) return false;
    if (typeof d.stage_confidence !== "number") return false;
    if (!Array.isArray(d.extraction_warnings)) return false;
    return true;
  }

  const rawDefaults: RawEvidenceOutput = {
    quantified_achievements: [],
    production_deployments: [],
    open_source_contributions: [],
    awards_and_recognition: [],
    publications: [],
    stage_confidence: 0.1,
    extraction_warnings: ["EVIDENCE_EXTRACTION_FAILED_AFTER_RETRY"],
  };

  // Claude call
  const result = await callClaudeWithSchema<RawEvidenceOutput>(
    {
      prompt,
      systemPrompt: STAGE_7_EVIDENCE_SYSTEM_PROMPT,
      maxTokens: 2048,
      temperature: 0.2,
    },
    isRawEvidenceOutput,
    rawDefaults,
    "EVIDENCE",
  );

  // Post-process raw evidence
  let achievements = result.data.quantified_achievements.map((a) => ({
    ...a,
    domain: null as string | null,
    source_role_index: matchCompanyToRoleIndex(a.approximate_source_role_company, experience.role_history),
  }));

  let ossContributions = result.data.open_source_contributions
    .map((c) => ({
      ...c,
      url: validateUrl(c.url),
    }))
    .filter((c) => c.url !== null);

  const publications = result.data.publications.map((p) => ({
    ...p,
    year: p.year && p.year >= 1950 && p.year <= new Date().getFullYear() + 1 ? p.year : null,
  }));

  // Pass 1: Claim length validation (5-500 chars)
  achievements = achievements.filter((a) => a.claim.length >= 5 && a.claim.length <= 500);

  // Pass 2: Deduplicate achievements (exact claim match)
  const seenClaims = new Set<string>();
  achievements = achievements.filter((a) => {
    if (seenClaims.has(a.claim)) return false;
    seenClaims.add(a.claim);
    return true;
  });

  // Pass 3: Deduplicate production deployments (fuzzy)
  const productionDeployments = deduplicateDeployments(result.data.production_deployments);

  // Pass 4: Deduplicate OSS contributions (by project_name + url)
  const seenOss = new Set<string>();
  ossContributions = ossContributions.filter((c) => {
    const key = `${c.project_name.toLowerCase()}|${c.url}`;
    if (seenOss.has(key)) return false;
    seenOss.add(key);
    return true;
  });

  // Pass 5: Deduplicate publications (by title)
  const seenPubs = new Set<string>();
  const uniquePublications = publications.filter((p) => {
    const key = p.title.toLowerCase().trim();
    if (seenPubs.has(key)) return false;
    seenPubs.add(key);
    return true;
  });

  // Calculate stage confidence
  let stageConfidence = baseConfidence;
  stageConfidence = Math.max(0, stageConfidence - result.confidence_penalty);
  stageConfidence = Math.min(1, stageConfidence);

  // Merge warnings
  const allWarnings = [
    ...result.data.extraction_warnings,
    ...result.warnings,
    ...penaltyWarnings,
  ];

  return {
    quantified_achievements: achievements,
    production_deployments: productionDeployments,
    open_source_contributions: ossContributions,
    awards_and_recognition: result.data.awards_and_recognition,
    publications: uniquePublications,
    stage_confidence: stageConfidence,
    extraction_warnings: allWarnings,
  };
}

// Fuzzy-match a company name from an achievement to a role index.
export function matchCompanyToRoleIndex(
  company: string | null,
  roleHistory: ExperienceOutput["role_history"],
): number | null {
  if (!company || roleHistory.length === 0) return null;

  const target = company.toLowerCase().trim();
  if (!target) return null;

  // Exact match first
  for (let i = 0; i < roleHistory.length; i++) {
    const roleCompany = roleHistory[i].company?.toLowerCase().trim();
    if (roleCompany && roleCompany === target) return i;
  }

  // Partial match: one contains the other
  for (let i = 0; i < roleHistory.length; i++) {
    const roleCompany = roleHistory[i].company?.toLowerCase().trim();
    if (roleCompany && (roleCompany.includes(target) || target.includes(roleCompany))) {
      return i;
    }
  }

  // Normalized match (remove suffixes)
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

// Deduplicate production deployments by fuzzy matching.
function deduplicateDeployments(deployments: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const dep of deployments) {
    const key = dep.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 100);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(dep);
    }
  }
  return result;
}

// URL validation utility (for OSS contributions).
export function validateUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    // Only allow http/https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}