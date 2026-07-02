// Team Intelligence — public barrel.
//
// Module 1 (Engine Foundation): re-exports the engine's type contracts only.
// No runtime logic is exported yet. Import from
// "@/engines/team-intelligence" rather than the individual files.
//
// Isolation guarantees (per TEAM_INTELLIGENCE_AUDIT.md):
//   • Does NOT modify or import runtime from lib/matching.ts, lib/embeddings.ts,
//     /api/rank-candidates, or /api/analyze.
//   • Not wired into any route, UI, or the live ranking flow.
//   • Only reads the shared CandidateProfile *type* as a common data currency.

// ── Core type contracts ─────────────────────────────────────────────────────────
export type {
  // enums
  TeamSourceFormat,
  ConfidenceTier,
  CompositionEffect,
  CompatibilityAxis,
  // enums (artifact-level)
  ArtifactSourceType,
  ArtifactStatus,
  // 1. TeamDocument
  TeamDocument,
  TeamDocumentMetadata,
  TeamMemberRef,
  TeamArtifact,
  // 2. TeamDNA
  TeamDNA,
  TeamSignal,
  SenioritySignal,
  SeniorityBand,
  DnaExtractionBackend,
  // 3. TeamEmbedding
  TeamEmbedding,
  MemberVector,
  // 4. CompatibilityScore
  CompatibilityScore,
  CompatibilityAxisScore,
  // 5. ContributionScore
  ContributionScore,
  ContributionItem,
  // 6. TeamAnalysisResult
  TeamAnalysisResult,
  CandidateTeamFit,
} from "./types";

// ── Parser layer (Module 2 — real implementation) ───────────────────────────────
export { parseTeamFiles, parseTeamDocument } from "./parser";
export type {
  TeamParserInput,
  ParseTeamDocument,
  ParseTeamMember,
  ParseTeamFilesOptions,
  FileTextExtractor,
  ExtractedFileText,
} from "./parser";

// ── Per-capability operation contracts (function-type signatures, no impl) ───────
export type {
  TeamEmbeddingConfig,
  EmbedTeam,
  TeamCandidateSimilarity,
} from "./embeddings";
// ── Team DNA layer (Module 3 — real implementation) ─────────────────────────────
export {
  deriveTeamDNA,
  deriveTeamDNAWithSemantics,
  DEFAULT_TEAM_DNA_CONFIG,
} from "./team-dna";
export type { TeamDNAConfig, DeriveTeamDNA, SemanticBackend } from "./team-dna";
// ── Compatibility engine (Module 4 — real implementation) ───────────────────────
export { scoreCompatibility, DEFAULT_COMPATIBILITY_CONFIG } from "./compatibility";
export type {
  CompatibilityWeights,
  CompatibilityConfig,
  ScoreCompatibility,
} from "./compatibility";
// ── Contribution engine (Module 5 — real implementation) ────────────────────────
export { scoreContribution, DEFAULT_CONTRIBUTION_CONFIG } from "./contribution";
export type { ContributionConfig, ScoreContribution } from "./contribution";

// ── Orchestrator (Module 6 — real implementation) ───────────────────────────────
export {
  runTeamIntelligence,
  runTeamIntelligenceFromFiles,
  DEFAULT_ORCHESTRATOR_CONFIG,
} from "./orchestrator";
export type {
  RunTeamIntelligence,
  CandidateForTeam,
  OrchestratorConfig,
  OverallFitWeights,
} from "./orchestrator";
