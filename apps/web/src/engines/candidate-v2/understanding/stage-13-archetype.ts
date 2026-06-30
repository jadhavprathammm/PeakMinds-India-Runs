// Stage 13 — Archetype Classification
// Single Claude call + consistency post-processing.
// Fields owned: archetype, key_differentiators.
//
// Critical constraint: Claude receives structured summary signals only —
// NEVER raw resume text. This prevents superficial textual bias.

import type {
  ExperienceOutput,
  SkillsOutput,
  EvidenceOutput,
  CommunicationOutput,
  RecruiterSignalsOutput,
  RiskOutput,
  ProjectsOutput,
  ArchetypeSummarySignals,
  ArchetypeOutput,
} from "@/engines/shared/types/stage-outputs";
import type { CandidateArchetype, RoleFamily } from "@/engines/shared/types/enums";
import { callClaudeWithSchema } from "@/engines/shared/utils/claude-client";
import { isArchetypeOutput } from "@/engines/shared/schemas/stage-schemas";
import {
  STAGE_13_ARCHETYPE_PROMPT,
  STAGE_13_ARCHETYPE_SYSTEM_PROMPT,
} from "@/engines/shared/prompts/stage-13-archetype";

// Default output returned on complete stage failure.
export const ARCHETYPE_STAGE_DEFAULTS: ArchetypeOutput = {
  primary_archetype: "generalist",
  secondary_archetype: null,
  confidence: 0.3,
  evidence_summary: "Archetype determined by deterministic fallback.",
  archetype_strengths: [],
  archetype_watch_areas: [],
  key_differentiators: [],
  stage_confidence: 0.1,
  extraction_warnings: ["ARCHETYPE_EXTRACTION_FAILED_AFTER_RETRY"],
};

// Raw output schema from Claude (before post-processing)
interface RawArchetypeOutput {
  primary_archetype: CandidateArchetype;
  secondary_archetype: CandidateArchetype | null;
  confidence: number;
  evidence_summary: string;
  archetype_strengths: string[];
  archetype_watch_areas: string[];
  key_differentiators: string[];
  stage_confidence: number;
  extraction_warnings: string[];
}

// Run Stage 13.
// Builds summary signals from structured stage outputs, never from raw text.
// Applies consistency checks and differentiator quality gate after Claude responds.
export async function runStage13Archetype(
  experience: ExperienceOutput,
  skills: SkillsOutput,
  evidence: EvidenceOutput,
  communication: CommunicationOutput,
  recruiter: RecruiterSignalsOutput,
  risk: RiskOutput,
  projects: ProjectsOutput,
): Promise<ArchetypeOutput> {
  // Build structured signal summary for Claude
  const signals = buildArchetypeSummarySignals(
    experience,
    skills,
    evidence,
    communication,
    recruiter,
    risk,
    projects,
  );

  // Validate raw archetype output
  function isRawArchetypeOutput(data: unknown): data is RawArchetypeOutput {
    if (typeof data !== "object" || data === null) return false;
    const d = data as Record<string, unknown>;
    const requiredKeys = [
      "primary_archetype",
      "secondary_archetype",
      "confidence",
      "evidence_summary",
      "archetype_strengths",
      "archetype_watch_areas",
      "key_differentiators",
      "stage_confidence",
      "extraction_warnings",
    ];
    for (const k of requiredKeys) {
      if (!(k in d)) return false;
    }
    if (!["builder", "researcher", "operator", "generalist", "specialist", "leader", "founder", "transitioner"].includes(d.primary_archetype as string)) {
      return false;
    }
    if (d.secondary_archetype !== null && !["builder", "researcher", "operator", "generalist", "specialist", "leader", "founder", "transitioner"].includes(d.secondary_archetype as string)) {
      return false;
    }
    if (typeof d.confidence !== "number" || d.confidence < 0 || d.confidence > 1) return false;
    if (!Array.isArray(d.archetype_strengths) || !Array.isArray(d.archetype_watch_areas) || !Array.isArray(d.key_differentiators)) return false;
    if (typeof d.evidence_summary !== "string") return false;
    if (typeof d.stage_confidence !== "number") return false;
    if (!Array.isArray(d.extraction_warnings)) return false;
    return true;
  }

  const rawDefaults: RawArchetypeOutput = {
    primary_archetype: "generalist",
    secondary_archetype: null,
    confidence: 0.3,
    evidence_summary: "Archetype determined by deterministic fallback.",
    archetype_strengths: [],
    archetype_watch_areas: [],
    key_differentiators: [],
    stage_confidence: 0.1,
    extraction_warnings: ["ARCHETYPE_EXTRACTION_FAILED_AFTER_RETRY"],
  };

  // Serialize signals for prompt
  const signalsJson = JSON.stringify(signals, null, 2);

  // Claude call with raw validator
  const result = await callClaudeWithSchema<RawArchetypeOutput>(
    {
      prompt: STAGE_13_ARCHETYPE_PROMPT(signalsJson),
      systemPrompt: STAGE_13_ARCHETYPE_SYSTEM_PROMPT,
      maxTokens: 1024,
      temperature: 0.2,
    },
    isRawArchetypeOutput,
    rawDefaults,
    "ARCHETYPE",
  );

  // Post-process: validate consistency and differentiator quality
  let validated = validateArchetypeConsistency(result.data, signals);
  validated = checkDifferentiatorQuality(validated, signals);

  // Apply confidence penalty from retry
  validated.stage_confidence = Math.max(0, validated.stage_confidence - result.confidence_penalty);

  // Merge retry warnings
  if (result.warnings.length > 0) {
    validated.extraction_warnings.push(...result.warnings);
  }

  // Validate final output against ArchetypeOutput contract
  if (!isArchetypeOutput(validated)) {
    return {
      ...ARCHETYPE_STAGE_DEFAULTS,
      extraction_warnings: [
        ...ARCHETYPE_STAGE_DEFAULTS.extraction_warnings,
        "POST_PROCESSING_VALIDATION_FAILED",
      ],
    };
  }

  return validated;
}

// Assemble the structured signal summary passed to Claude.
// Never exposes raw resume text — only derived signals.
export function buildArchetypeSummarySignals(
  experience: ExperienceOutput,
  skills: SkillsOutput,
  evidence: EvidenceOutput,
  communication: CommunicationOutput,
  recruiter: RecruiterSignalsOutput,
  risk: RiskOutput,
  projects: ProjectsOutput,
): ArchetypeSummarySignals {
  // Compute top frameworks by frequency across role responsibilities
  const frameworkCounts: Record<string, number> = {};
  for (const role of experience.role_history) {
    for (const resp of role.key_responsibilities) {
      for (const fw of skills.frameworks) {
        if (resp.toLowerCase().includes(fw.toLowerCase())) {
          frameworkCounts[fw] = (frameworkCounts[fw] || 0) + 1;
        }
      }
    }
  }
  const topFrameworks = Object.entries(frameworkCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([fw]) => fw);

  // Top domain keywords by frequency
  const keywordCounts: Record<string, number> = {};
  for (const role of experience.role_history) {
    for (const resp of role.key_responsibilities) {
      for (const kw of skills.domain_keywords) {
        if (resp.toLowerCase().includes(kw.toLowerCase())) {
          keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
        }
      }
    }
  }
  const topDomainKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([kw]) => kw);

  // Count production-grade projects
  const productionProjects = projects.projects.filter((p) => p.production_grade).length;

  return {
    years_experience: experience.role_history.length > 0
      ? Math.round(experience.role_history.reduce((sum, r) => sum + r.duration_months, 0) / 12)
      : 0,
    total_ml_months: experience.total_ml_months,
    seniority_level: recruiter.seniority_level,
    primary_role_family: recruiter.primary_role_family,
    secondary_role_families: recruiter.secondary_role_families,
    specializations: recruiter.specializations,
    has_pre_llm_depth: recruiter.has_pre_llm_depth,
    ownership_signals: experience.ownership_signals,
    leadership_signals: experience.leadership_signals,
    production_deployments_count: evidence.production_deployments.length + productionProjects,
    quantified_achievements_count: evidence.quantified_achievements.length,
    publication_count: evidence.publications.length,
    communication_tier: communication.communication_signals.communication_tier,
    career_trajectory_direction: recruiter.career_trajectory.direction,
    domain_posture: recruiter.domain_posture,
    top_frameworks: topFrameworks,
    top_domain_keywords: topDomainKeywords,
    projects_production_count: productionProjects,
    overall_risk_level: risk.risk_signals.overall_risk_level,
  };
}

// Downgrade confidence if archetype is inconsistent with signals.
// e.g., "builder" with shipped_to_production === false → confidence = min(confidence, 0.5)
export function validateArchetypeConsistency(
  output: RawArchetypeOutput,
  signals: ArchetypeSummarySignals,
): ArchetypeOutput {
  const warnings = [...output.extraction_warnings];
  let confidence = output.confidence;

  const { primary_archetype } = output;
  const { ownership_signals, leadership_signals, publication_count, has_pre_llm_depth, seniority_level, career_trajectory_direction, domain_posture, specializations, primary_role_family, overall_risk_level } = signals;

  // Derive is_career_changer from available signals
  const is_career_changer = career_trajectory_direction === "pivoting" ||
    specializations.some(s => ["mlops", "data_engineering", "software_engineering"].includes(s)) && primary_role_family === "ml_engineering";

  // Builder consistency
  if (primary_archetype === "builder") {
    if (!ownership_signals.shipped_to_production || !ownership_signals.owned_full_pipeline) {
      confidence = Math.min(confidence, 0.5);
      warnings.push("ARCHETYPE_BUILDER_INCONSISTENT: missing shipped_to_production or owned_full_pipeline");
    }
  }

  // Researcher consistency
  if (primary_archetype === "researcher") {
    if (publication_count < 2 && !has_pre_llm_depth) {
      confidence = Math.min(confidence, 0.5);
      warnings.push("ARCHETYPE_RESEARCHER_INCONSISTENT: low publication_count and no pre-LLM depth");
    }
  }

  // Operator consistency
  if (primary_archetype === "operator") {
    if (signals.production_deployments_count === 0 && signals.projects_production_count === 0) {
      confidence = Math.min(confidence, 0.5);
      warnings.push("ARCHETYPE_OPERATOR_INCONSISTENT: no production deployments");
    }
  }

  // Leader consistency
  if (primary_archetype === "leader") {
    if (!leadership_signals.managed_teams || !["senior", "staff", "principal"].includes(seniority_level)) {
      confidence = Math.min(confidence, 0.5);
      warnings.push("ARCHETYPE_LEADER_INCONSISTENT: missing managed_teams or insufficient seniority");
    }
  }

  // Founder consistency
  if (primary_archetype === "founder") {
    const hasFounderSignals =
      ownership_signals.owned_full_pipeline &&
      ownership_signals.drove_measurable_outcomes &&
      signals.production_deployments_count > 0;
    if (!hasFounderSignals) {
      confidence = Math.min(confidence, 0.5);
      warnings.push("ARCHETYPE_FOUNDER_INCONSISTENT: missing founder signals");
    }
  }

  // Transitioner consistency
  if (primary_archetype === "transitioner") {
    if (!is_career_changer || primary_role_family === "unknown") {
      confidence = Math.min(confidence, 0.5);
      warnings.push("ARCHETYPE_TRANSITIONER_INCONSISTENT: not a career changer or unknown role family");
    }
  }

  // Specialist consistency
  if (primary_archetype === "specialist") {
    if (specializations.length === 0 || domain_posture === "unfocused" || domain_posture === "generalist") {
      confidence = Math.min(confidence, 0.5);
      warnings.push("ARCHETYPE_SPECIALIST_INCONSISTENT: no specializations or unfocused domain posture");
    }
  }

  // Generalist consistency (no downgrade — it's the default)
  // But if another archetype clearly fits, generalist should not be chosen
  // This is handled by the prompt rules

  // Clamp confidence
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    primary_archetype: output.primary_archetype,
    secondary_archetype: output.secondary_archetype,
    confidence,
    evidence_summary: output.evidence_summary,
    archetype_strengths: output.archetype_strengths,
    archetype_watch_areas: [...output.archetype_watch_areas, ...warnings.filter(w => w.startsWith("ARCHETYPE_"))],
    key_differentiators: output.key_differentiators,
    stage_confidence: confidence,
    extraction_warnings: warnings,
  };
}

// Return false if differentiators are empty or all generic.
// Generic = no reference to a specific signal from the summary.
export function checkDifferentiatorQuality(
  output: ArchetypeOutput,
  signals: ArchetypeSummarySignals,
): ArchetypeOutput {
  const warnings = [...output.extraction_warnings];
  const diffs = output.key_differentiators;

  if (!diffs || diffs.length === 0) {
    warnings.push("KEY_DIFFERENTIATORS_LOW_QUALITY: empty");
    return { ...output, key_differentiators: [], extraction_warnings: warnings };
  }

  // Check each differentiator for specificity
  const signalKeywords = [
    ...signals.specializations,
    ...signals.top_frameworks,
    ...signals.top_domain_keywords,
    signals.seniority_level,
    signals.primary_role_family,
    signals.career_trajectory_direction,
    signals.domain_posture,
    signals.communication_tier,
    signals.overall_risk_level,
  ].filter(Boolean).map(s => s.toLowerCase());

  const genericPatterns = [
    "strong",
    "excellent",
    "solid",
    "good",
    "experienced",
    "skilled",
    "proficient",
    "expert",
    "deep knowledge",
    "passion",
    "motivated",
    "hardworking",
    "team player",
    "fast learner",
    "problem solver",
  ];

  const specificCount = diffs.filter((d) => {
    const lower = d.toLowerCase();
    // Check if references a specific signal
    const hasSignalRef = signalKeywords.some((kw) => lower.includes(kw.toLowerCase()));
    // Check if generic
    const isGeneric = genericPatterns.some((gp) => lower.includes(gp));
    return hasSignalRef && !isGeneric;
  }).length;

  if (specificCount === 0) {
    warnings.push("KEY_DIFFERENTIATORS_LOW_QUALITY: all generic");
    return { ...output, key_differentiators: [], extraction_warnings: warnings };
  }

  // Keep only specific differentiators (max 3)
  const filtered = diffs.filter((d) => {
    const lower = d.toLowerCase();
    const hasSignalRef = signalKeywords.some((kw) => lower.includes(kw.toLowerCase()));
    const isGeneric = genericPatterns.some((gp) => lower.includes(gp));
    return hasSignalRef && !isGeneric;
  }).slice(0, 3);

  if (filtered.length !== diffs.length) {
    warnings.push("KEY_DIFFERENTIATORS_FILTERED: removed generic differentiators");
  }

  return { ...output, key_differentiators: filtered, extraction_warnings: warnings };
}

// Deterministic fallback: map primary_role_family → most likely archetype.
export function deterministicArchetypeFallback(
  primaryRoleFamily: RoleFamily,
): CandidateArchetype {
  const mapping: Record<RoleFamily, CandidateArchetype> = {
    ml_engineering: "builder",
    data_science: "researcher",
    research: "researcher",
    mlops: "operator",
    software_engineering: "generalist",
    management: "leader",
    unknown: "generalist",
  };
  return mapping[primaryRoleFamily] ?? "generalist";
}