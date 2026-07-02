// Team Intelligence — embedding contracts.
//
// Module 1: TYPE/CONTRACT DEFINITIONS ONLY. No implementation.
//
// Responsibility (future): produce a TeamEmbedding by pooling per-member (or
// whole-document) vectors into a single team vector for semantic candidate↔team
// comparison.
//
// IMPORTANT ISOLATION RULE: this module will CONSUME the shared server-side
// embedding utility (lib/embeddings.ts::embedTexts) at implementation time, but
// it must NOT modify it. The contracts below are deliberately model-agnostic so
// the engine stays decoupled from the concrete embedding backend.

import type { TeamDocument, TeamEmbedding } from "./types";

/** Tunables for how a team vector is derived from its members. */
export interface TeamEmbeddingConfig {
  /** Pooling strategy across member/document vectors. */
  pooling: TeamEmbedding["pooling"];
  /** Keep per-member vectors for downstream complementarity analysis. */
  retain_member_vectors: boolean;
  /** Expected embedding dimensionality (must match the shared model). */
  dim: number;
}

/**
 * Contract: embed an entire team into a pooled TeamEmbedding.
 * Async because the underlying model load/inference is async. On any embedding
 * failure the result must set `degraded: true` and callers fall back to
 * non-semantic scoring — mirroring the live engine's graceful degradation.
 */
export type EmbedTeam = (
  team: TeamDocument,
  config: TeamEmbeddingConfig,
) => Promise<TeamEmbedding>;

/**
 * Contract: cosine similarity between a candidate vector and a team vector.
 * Both must be L2-normalised and share `dim`. Returns null when either vector
 * is unavailable.
 */
export type TeamCandidateSimilarity = (
  candidateVector: number[] | null,
  teamVector: number[] | null,
) => number | null;
