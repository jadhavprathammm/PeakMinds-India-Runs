// Team Intelligence — Module 6: Orchestrator.
//
// Wires the whole engine into one executable pipeline:
//   parseTeamFiles / parseTeamDocument
//     → deriveTeamDNA
//     → embedTeam (via the SemanticBackend abstraction)
//     → for each candidate: scoreCompatibility × scoreContribution → CandidateTeamFit
//     → aggregate into TeamAnalysisResult (ranked)
//
// Satisfies the Module-1 `RunTeamIntelligence` contract exactly (compile-time
// assertion below). Never throws — every stage degrades gracefully and surfaces
// issues via TeamAnalysisResult.warnings / degraded. No parallelism, no BGE-M3,
// no infrastructure — just clean orchestration.

import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";
import type {
  TeamDocument,
  TeamDNA,
  TeamEmbedding,
  TeamAnalysisResult,
  CandidateTeamFit,
  CompatibilityScore,
  ContributionScore,
} from "./types";
import {
  parseTeamFiles,
  parseTeamDocument,
  type TeamParserInput,
  type ParseTeamFilesOptions,
} from "./parser";
import {
  deriveTeamDNA,
  DEFAULT_TEAM_DNA_CONFIG,
  type TeamDNAConfig,
  type SemanticBackend,
} from "./team-dna";
import {
  scoreCompatibility,
  DEFAULT_COMPATIBILITY_CONFIG,
  type CompatibilityConfig,
} from "./compatibility";
import {
  scoreContribution,
  DEFAULT_CONTRIBUTION_CONFIG,
  type ContributionConfig,
} from "./contribution";

// ── Module-1 orchestration contract (moved here from index; re-exported there) ────

/** A candidate to be evaluated against a team, paired with a stable id. */
export interface CandidateForTeam {
  candidate_id: string;
  profile: CandidateProfile;
}

/**
 * Contract: run the full Team Intelligence pipeline.
 * Async (embeddings are async). Never throws — degrades gracefully and surfaces
 * issues via TeamAnalysisResult.warnings / degraded.
 */
export type RunTeamIntelligence = (
  team: TeamParserInput,
  candidates: CandidateForTeam[],
) => Promise<TeamAnalysisResult>;

// ── Orchestrator configuration ────────────────────────────────────────────────────

export interface OverallFitWeights {
  compatibility: number;
  contribution: number;
}

export interface OrchestratorConfig {
  /** Embedding backend (BGE-M3 etc.). null → semantic axis skipped (degraded). */
  semantic: SemanticBackend | null;
  /** Blend for the headline team_fit_score. */
  weights: OverallFitWeights;
  dna: TeamDNAConfig;
  compatibility: CompatibilityConfig;
  contribution: ContributionConfig;
  /** Options forwarded to parseTeamFiles when starting from File[]. */
  parseOptions?: ParseTeamFilesOptions;
}

export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  semantic: null,
  // Fit is the primary hiring gate; contribution differentiates among the fitting.
  weights: { compatibility: 0.6, contribution: 0.4 },
  dna: DEFAULT_TEAM_DNA_CONFIG,
  compatibility: DEFAULT_COMPATIBILITY_CONFIG,
  contribution: DEFAULT_CONTRIBUTION_CONFIG,
};

// ── Text synthesis for embeddings (focused, not raw boilerplate) ──────────────────

function dnaToText(dna: TeamDNA): string {
  return [
    ...dna.skills.map((s) => s.label),
    ...dna.domains.map((s) => s.label),
    ...dna.strengths.map((s) => s.label),
  ].join(" ").trim();
}

function profileToText(p: CandidateProfile): string {
  return [
    p.current_title ?? "",
    ...p.technical_skills,
    ...p.tools,
    ...p.frameworks,
    ...p.cloud_platforms,
    ...p.databases,
    ...p.domain_keywords,
    ...p.specializations,
  ].join(" ").trim();
}

// ── Step 3: team embedding via the SemanticBackend abstraction ────────────────────
//
// Embeds the team + all candidates in a single backend call, then returns the
// team's TeamEmbedding plus the per-candidate vectors (aligned to `candidates`).
// On any failure / no backend → degraded embedding + null candidate vectors.
async function embedTeamAndCandidates(
  dna: TeamDNA,
  candidates: CandidateForTeam[],
  backend: SemanticBackend | null,
  warnings: string[],
): Promise<{ teamEmbedding: TeamEmbedding; candidateVectors: (number[] | null)[] }> {
  const teamText = dnaToText(dna);
  const degradedEmbedding: TeamEmbedding = {
    team_id: dna.team_id,
    vector: [],
    dim: 0,
    pooling: "document",
    member_vectors: [],
    degraded: true,
  };

  if (!backend) {
    return { teamEmbedding: degradedEmbedding, candidateVectors: candidates.map(() => null) };
  }
  if (teamText.length === 0) {
    warnings.push("team has no text to embed — semantic axis disabled");
    return { teamEmbedding: degradedEmbedding, candidateVectors: candidates.map(() => null) };
  }

  try {
    const texts = [teamText, ...candidates.map((c) => profileToText(c.profile))];
    const vectors = await backend.embed(texts);
    if (!vectors || vectors.length !== texts.length || vectors[0].length === 0) {
      warnings.push(`semantic backend "${backend.name}" returned no usable vectors — semantic axis disabled`);
      return { teamEmbedding: degradedEmbedding, candidateVectors: candidates.map(() => null) };
    }
    const teamVec = vectors[0];
    return {
      teamEmbedding: {
        team_id: dna.team_id,
        vector: teamVec,
        dim: teamVec.length,
        pooling: "document",
        member_vectors: [],
        degraded: false,
      },
      candidateVectors: vectors.slice(1).map((v) => (v && v.length > 0 ? v : null)),
    };
  } catch (e) {
    warnings.push(`team embedding failed: ${e instanceof Error ? e.message : "unknown error"} — semantic axis disabled`);
    return { teamEmbedding: degradedEmbedding, candidateVectors: candidates.map(() => null) };
  }
}

// ── Blend + summary ────────────────────────────────────────────────────────────────

function blendFit(
  compatibility: CompatibilityScore,
  contribution: ContributionScore,
  weights: OverallFitWeights,
): number {
  const w1 = Math.max(0, weights.compatibility);
  const w2 = Math.max(0, weights.contribution);
  const denom = w1 + w2;
  if (denom === 0) return 0;
  return Math.round((w1 * compatibility.overall + w2 * contribution.overall) / denom);
}

function summarise(fit: number, c: CompatibilityScore, k: ContributionScore): string {
  const parts = [`Team fit ${fit}/100 (compatibility ${c.overall}, contribution ${k.overall}).`];
  if (k.fills_gaps.length > 0) parts.push(`Fills ${k.fills_gaps.slice(0, 2).join(", ")}.`);
  else if (k.overlaps.length > 0 && k.overall < 40) parts.push("Mostly overlaps existing coverage.");
  return parts.join(" ");
}

// ── Core pipeline (shared by both entry points) ───────────────────────────────────

async function runPipeline(
  teamDoc: TeamDocument,
  candidates: CandidateForTeam[],
  config: OrchestratorConfig,
): Promise<TeamAnalysisResult> {
  const warnings: string[] = [];

  // Step 1 fallout — surface parse warnings.
  for (const w of teamDoc.parse_warnings) warnings.push(`[parse] ${w}`);
  const teamTextEmpty = (teamDoc.raw_text ?? "").trim().length === 0 && teamDoc.members.length === 0;

  // Step 2 — Team DNA (never throws).
  const dna = deriveTeamDNA(teamDoc, config.dna);
  for (const w of dna.derivation_warnings) warnings.push(`[dna] ${w}`);

  // Step 3 — Team + candidate embeddings.
  const { teamEmbedding, candidateVectors } = await embedTeamAndCandidates(
    dna, candidates, config.semantic, warnings,
  );

  // Step 4 — Per-candidate compatibility × contribution (each isolated).
  const fits: CandidateTeamFit[] = candidates.map((c, i) => {
    try {
      if (c.profile.parsing_warnings?.length) {
        warnings.push(`[candidate ${c.candidate_id}] profile had ${c.profile.parsing_warnings.length} parsing warning(s)`);
      }
      const compatibility = scoreCompatibility(
        c.profile, c.candidate_id, dna, teamEmbedding, config.compatibility, candidateVectors[i],
      );
      const contribution = scoreContribution(
        c.profile, c.candidate_id, dna, config.contribution,
      );
      const team_fit_score = blendFit(compatibility, contribution, config.weights);
      return {
        candidate_id: c.candidate_id,
        candidate_name: c.profile.candidate_name ?? null,
        compatibility,
        contribution,
        team_fit_score,
        summary: summarise(team_fit_score, compatibility, contribution),
      };
    } catch (e) {
      warnings.push(`[candidate ${c.candidate_id}] scoring failed: ${e instanceof Error ? e.message : "unknown"} — zeroed`);
      return degradedFit(c, dna.team_id);
    }
  });

  // Rank: team_fit_score desc, then compatibility, then id (deterministic).
  fits.sort(
    (a, b) =>
      b.team_fit_score - a.team_fit_score ||
      b.compatibility.overall - a.compatibility.overall ||
      a.candidate_id.localeCompare(b.candidate_id),
  );

  // "degraded" means a genuine loss of intended signal — NOT the normal lexical
  // mode where no semantic backend is configured. A configured-but-failed backend
  // does count as degraded.
  const semanticRequested = config.semantic !== null;
  const semanticFailed = semanticRequested && teamEmbedding.degraded;
  const degraded = teamTextEmpty || semanticFailed || dna.overall_confidence === 0;

  return {
    team_id: dna.team_id,
    team_dna: dna,
    candidates: fits,
    degraded,
    warnings,
  };
}

function degradedFit(c: CandidateForTeam, team_id: string): CandidateTeamFit {
  const compatibility: CompatibilityScore = {
    team_id, candidate_id: c.candidate_id, overall: 0, axes: [],
    semantic_similarity: null, confidence: "insufficient",
  };
  const contribution: ContributionScore = {
    team_id, candidate_id: c.candidate_id, overall: 0,
    fills_gaps: [], overlaps: [], items: [], confidence: "insufficient",
  };
  return {
    candidate_id: c.candidate_id,
    candidate_name: c.profile?.candidate_name ?? null,
    compatibility, contribution, team_fit_score: 0,
    summary: "Scoring failed for this candidate — returned as zeroed.",
  };
}

// ── Public entry points ────────────────────────────────────────────────────────────

/**
 * Module-1 contract entry point: run the pipeline from a TeamParserInput
 * (raw text or pre-parsed profiles). Never throws.
 */
export async function runTeamIntelligence(
  team: TeamParserInput,
  candidates: CandidateForTeam[],
  config: OrchestratorConfig = DEFAULT_ORCHESTRATOR_CONFIG,
): Promise<TeamAnalysisResult> {
  try {
    const teamDoc = parseTeamDocument(team);
    return await runPipeline(teamDoc, candidates, config);
  } catch (e) {
    return fatalFallback(candidates, e);
  }
}

/**
 * File-upload entry point: run the pipeline starting from uploaded team files
 * (Step 1 = parseTeamFiles). Never throws.
 */
export async function runTeamIntelligenceFromFiles(
  teamFiles: File[],
  candidates: CandidateForTeam[],
  config: OrchestratorConfig = DEFAULT_ORCHESTRATOR_CONFIG,
): Promise<TeamAnalysisResult> {
  try {
    const teamDoc = await parseTeamFiles(teamFiles, config.parseOptions);
    return await runPipeline(teamDoc, candidates, config);
  } catch (e) {
    return fatalFallback(candidates, e);
  }
}

// Absolute last-resort guard (runPipeline itself never throws, but be safe).
function fatalFallback(candidates: CandidateForTeam[], e: unknown): TeamAnalysisResult {
  const msg = e instanceof Error ? e.message : "unknown error";
  return {
    team_id: "unknown",
    team_dna: deriveTeamDNA(
      { team_id: "unknown", source_format: "unknown", raw_text: null, artifacts: [], members: [], metadata: { team_name: null, org_unit: null, target_role: null, source_label: null }, parse_warnings: [] },
      DEFAULT_TEAM_DNA_CONFIG,
    ),
    candidates: candidates.map((c) => degradedFit(c, "unknown")),
    degraded: true,
    warnings: [`[fatal] orchestration failed: ${msg}`],
  };
}

// Compile-time proof the implementation satisfies the Module-1 contract.
export const runTeamIntelligenceContract: RunTeamIntelligence = runTeamIntelligence;
