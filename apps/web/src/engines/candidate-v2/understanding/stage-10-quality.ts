// Stage 10 — Quality Signal Computation
// No Claude call. Pure deterministic computation over all prior stage outputs.
// Fields owned: resume_quality, evidence_strength, career_consistency,
//               extraction_confidence, parsing_warnings.

import type {
  PreflightOutput,
  SectionDetectionOutput,
  IdentityOutput,
  SkillsOutput,
  ExperienceOutput,
  EvidenceOutput,
  QualityOutput,
} from "@/engines/shared/types/stage-outputs";
import type { ResumeQuality, EvidenceStrength, CareerConsistency } from "@/engines/shared/types/enums";
import type { RoleEntry } from "@/engines/shared/types/sub-types";

// Default output returned on complete stage failure.
export const QUALITY_STAGE_DEFAULTS: QualityOutput = {
  resume_quality: "sparse",
  evidence_strength: "anecdotal",
  career_consistency: "fragmented",
  extraction_confidence: 0.1,
  parsing_warnings: ["QUALITY_COMPUTATION_FAILED"],
};

// Run Stage 10.
// No Claude call — reads outputs from Stages 0–9.
export function runStage10Quality(
  preflight: PreflightOutput,
  sections: SectionDetectionOutput,
  identity: IdentityOutput,
  skills: SkillsOutput,
  experience: ExperienceOutput,
  evidence: EvidenceOutput,
  stageConfidences: Record<string, number>,
  allWarnings: string[][],
): QualityOutput {
  const resumeQuality = computeResumeQuality(preflight, sections, identity, skills, experience, evidence);
  const evidenceStrength = computeEvidenceStrength(evidence);
  const careerConsistency = computeCareerConsistency(experience);
  const extractionConfidence = computeExtractionConfidence(stageConfidences);
  const parsingWarnings = aggregateWarnings(allWarnings);

  return {
    resume_quality: resumeQuality,
    evidence_strength: evidenceStrength,
    career_consistency: careerConsistency,
    extraction_confidence: extractionConfidence,
    parsing_warnings: parsingWarnings,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Resume Quality (6-point rubric)
// ─────────────────────────────────────────────────────────────────────────────

export function computeResumeQuality(
  preflight: PreflightOutput,
  sections: SectionDetectionOutput,
  identity: IdentityOutput,
  skills: SkillsOutput,
  experience: ExperienceOutput,
  evidence: EvidenceOutput,
): ResumeQuality {
  let score = 0;

  // Word count (0–2)
  const wordCount = preflight.word_count ?? 0;
  if (wordCount >= 500) score += 2;
  else if (wordCount >= 250) score += 1;

  // Section coverage (0–2)
  const detectedSections = sections.detected_section_count ?? 0;
  const missingCritical = sections.missing_critical_sections?.length ?? 0;
  if (detectedSections >= 6 && missingCritical === 0) score += 2;
  else if (detectedSections >= 4) score += 1;

  // Role count (0–1)
  if (experience.role_history.length >= 2) score += 1;

  // Achievement count (0–1)
  if (evidence.quantified_achievements.length >= 2) score += 1;

  // Skill coverage (0–1)
  const totalSkills = skills.technical_skills.length + skills.frameworks.length + skills.tools.length;
  if (totalSkills >= 8) score += 1;
  else if (totalSkills >= 4) score += 0.5;

  // Section confidence (0–1)
  if (sections.section_confidence >= 0.7) score += 1;
  else if (sections.section_confidence >= 0.4) score += 0.5;

  if (score >= 5.5) return "exceptional";
  if (score >= 4) return "strong";
  if (score >= 2.5) return "adequate";
  return "sparse";
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Evidence Strength (three-tier evaluation)
// ─────────────────────────────────────────────────────────────────────────────

export function computeEvidenceStrength(evidence: EvidenceOutput): EvidenceStrength {
  const quantifiedCount = evidence.quantified_achievements.length;
  const ossCount = evidence.open_source_contributions.length;
  const pubCount = evidence.publications.length;
  const deploymentCount = evidence.production_deployments.length;

  // "verified" = multiple quantified achievements + OSS + publications + deployments
  if (quantifiedCount >= 3 && (ossCount >= 1 || pubCount >= 1) && deploymentCount >= 1) {
    return "verified";
  }

  // "quantified" = multiple quantified achievements OR achievements + deployments
  if (quantifiedCount >= 2 || (quantifiedCount >= 1 && deploymentCount >= 1)) {
    return "quantified";
  }

  // "descriptive" = some achievements but not quantified
  if (quantifiedCount >= 1 || evidence.awards_and_recognition.length >= 1) {
    return "descriptive";
  }

  return "anecdotal";
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Career Consistency (based on avg_tenure and short_stint_ratio)
// ─────────────────────────────────────────────────────────────────────────────

export function computeCareerConsistency(experience: ExperienceOutput): CareerConsistency {
  const roles = experience.role_history;
  if (roles.length === 0) return "fragmented";

  // Calculate average tenure in months
  const totalMonths = roles.reduce((sum, r) => sum + (r.duration_months ?? 0), 0);
  const avgTenure = totalMonths / roles.length;

  // Calculate short stint ratio (< 18 months)
  const shortStints = roles.filter((r) => (r.duration_months ?? 0) < 18).length;
  const shortStintRatio = shortStints / roles.length;

  // "linear" = avg_tenure >= 36 months AND short_stint_ratio == 0
  if (avgTenure >= 36 && shortStintRatio === 0) {
    return "linear";
  }

  // "consistent" = avg_tenure >= 24 months AND short_stint_ratio <= 0.25
  if (avgTenure >= 24 && shortStintRatio <= 0.25) {
    return "consistent";
  }

  // "mixed" = avg_tenure >= 12 months AND short_stint_ratio <= 0.5
  if (avgTenure >= 12 && shortStintRatio <= 0.5) {
    return "mixed";
  }

  return "fragmented";
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Extraction Confidence (min-sensitive aggregation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute extraction confidence using min-sensitive aggregation.
 *
 * Strategy:
 * - Base confidence is the minimum of all stage confidences (bottleneck principle)
 * - Apply a small boost if all stages are healthy (min > 0.5)
 * - Penalize if any stage has very low confidence (< 0.3)
 * - Clamp to [0, 1]
 *
 * This ensures:
 * - A single failed stage meaningfully reduces overall confidence
 * - All healthy stages provide a slight confidence bonus
 * - Deterministic behavior
 */
export function computeExtractionConfidence(stageConfidences: Record<string, number>): number {
  const values = Object.values(stageConfidences);
  if (values.length === 0) return 0.1;

  const minConf = Math.min(...values);
  const avgConf = values.reduce((sum, v) => sum + v, 0) / values.length;

  // Start with minimum (bottleneck)
  let confidence = minConf;

  // Small boost if all stages are reasonably healthy
  if (minConf > 0.5) {
    confidence = Math.min(1, confidence + 0.1);
  }

  // Penalty for any very weak stage
  const hasWeakStage = values.some((v) => v < 0.3);
  if (hasWeakStage) {
    confidence *= 0.8;
  }

  // Clamp
  return Math.max(0, Math.min(1, confidence));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Warning Aggregation (dedup + severity ordering)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Severity ranking for warnings (higher = more severe)
 */
const WARNING_SEVERITY: Record<string, number> = {
  CRITICAL: 100,
  FAILURE: 90,
  ERROR: 80,
  WARNING: 50,
  INFO: 20,
  LOW: 10,
  DEFAULT: 0,
};

function getWarningSeverity(warning: string): number {
  // Check for explicit severity prefixes
  for (const [prefix, severity] of Object.entries(WARNING_SEVERITY)) {
    if (warning.startsWith(prefix)) return severity;
  }
  // Heuristic: all-caps warnings are more severe
  if (warning === warning.toUpperCase()) return WARNING_SEVERITY.WARNING;
  return WARNING_SEVERITY.INFO;
}

export function aggregateWarnings(allWarnings: string[][]): string[] {
  const seen = new Set<string>();
  const warnings: string[] = [];

  for (const stageWarnings of allWarnings) {
    for (const w of stageWarnings) {
      if (!seen.has(w)) {
        seen.add(w);
        warnings.push(w);
      }
    }
  }

  // Sort by severity (descending), then alphabetically for stability
  warnings.sort((a, b) => {
    const sevA = getWarningSeverity(a);
    const sevB = getWarningSeverity(b);
    if (sevA !== sevB) return sevB - sevA;
    return a.localeCompare(b);
  });

  return warnings;
}