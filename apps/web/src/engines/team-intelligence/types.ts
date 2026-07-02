// Team Intelligence — core type contracts.
//
// Module 1 (Engine Foundation): TYPE DEFINITIONS ONLY.
// No runtime values, no business logic. This file compiles to nothing.
//
// The Team Intelligence engine answers a different question from the existing
// candidate/recruiter engines: instead of "how well does this candidate match a
// JD?", it asks "how well does this candidate fit THIS TEAM, and what net-new
// value do they contribute to it?".
//
// The engine is intentionally isolated from the live scoring path
// (lib/matching.ts, lib/embeddings.ts, /api/rank-candidates, /api/analyze).
// It only *reads* the shared CandidateProfile type as a common currency; it
// never imports or mutates the live engine's runtime code.

import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";

// ── Engine-local enums (string unions, no runtime) ──────────────────────────────

/** How a team was supplied to the engine. */
export type TeamSourceFormat =
  | "roster_csv"        // structured roster (rows of members)
  | "roster_xlsx"
  | "team_description"  // free-text description of the team / charter
  | "document_bundle"   // multiple uploaded documents (PDF/DOCX/TXT) aggregated
  | "profile_bundle"    // pre-parsed CandidateProfile[] handed in directly
  | "unknown";

/** File type of a single uploaded team artifact. */
export type ArtifactSourceType = "pdf" | "docx" | "txt" | "unknown";

/** Outcome of parsing a single uploaded artifact. */
export type ArtifactStatus =
  | "parsed"       // text extracted successfully
  | "empty"        // parsed but no usable text found
  | "unsupported"  // file type not supported (skipped)
  | "failed";      // extraction threw — skipped, warning recorded

/** Overall confidence tier for any produced signal. */
export type ConfidenceTier = "high" | "medium" | "low" | "insufficient";

/** Direction of a candidate's effect on a team's composition. */
export type CompositionEffect =
  | "reinforces"    // deepens an existing strength
  | "diversifies"   // adds a missing dimension
  | "redundant"     // overlaps heavily with existing members
  | "neutral";

/** Named axes the engine reasons about when comparing candidate ↔ team. */
export type CompatibilityAxis =
  | "skill_alignment"
  | "domain_alignment"
  | "seniority_alignment"
  | "leadership_alignment"
  | "work_style_alignment"
  | "semantic_alignment";

// ── 1. TeamDocument ─────────────────────────────────────────────────────────────
// Raw, engine-agnostic representation of an uploaded team artifact. This is the
// input boundary for the parser — analogous to PreflightInput in candidate-v2.

export interface TeamMemberRef {
  /** Stable id within the document (row index or supplied id). */
  member_id: string;
  /** Display name, if present. */
  name: string | null;
  /** Raw text describing this member (resume/blurb/skills cell). */
  raw_text: string;
  /** Parsed profile once ingestion runs; null until then. */
  profile: CandidateProfile | null;
}

export interface TeamDocumentMetadata {
  /** Caller-supplied team name / label. */
  team_name: string | null;
  /** Optional org/department context. */
  org_unit: string | null;
  /** The role the team is hiring for, if this doc is tied to an open req. */
  target_role: string | null;
  /** Free-form provenance (filename, upload timestamp, etc.). */
  source_label: string | null;
}

/**
 * Per-file provenance + parse outcome for one uploaded team artifact.
 * Multiple artifacts are aggregated into a single TeamDocument.
 */
export interface TeamArtifact {
  /** Stable id for this artifact within the document. */
  artifact_id: string;
  /** Original filename as uploaded. */
  filename: string;
  /** Detected file type. */
  source_type: ArtifactSourceType;
  /** File size in bytes. */
  size_bytes: number;
  /** Number of characters successfully extracted from this file. */
  extracted_characters: number;
  /** How the text was obtained (native / pdfjs / mammoth / ocr …). */
  extraction_method: string | null;
  /** Outcome of parsing this artifact. */
  status: ArtifactStatus;
  /** Extracted text for this single file (source of `combined_text`). */
  text: string;
  /** Per-file non-fatal notes / error messages. */
  parse_warnings: string[];
}

export interface TeamDocument {
  /** Stable id for this team document. */
  team_id: string;
  source_format: TeamSourceFormat;
  /**
   * Combined text aggregated across every successfully-parsed artifact.
   * This is the field the Team DNA stage consumes. (For single free-text
   * inputs it is simply that text.)
   */
  raw_text: string | null;
  /** Every uploaded file's provenance + parse outcome. */
  artifacts: TeamArtifact[];
  /** Individual members extracted from the document (populated by a later stage). */
  members: TeamMemberRef[];
  metadata: TeamDocumentMetadata;
  /** Document-level parse notes, accumulated across all artifacts. */
  parse_warnings: string[];
}

// ── 2. TeamDNA ──────────────────────────────────────────────────────────────────
// The extracted "signature" of a team: its skills, domains, seniority, leadership,
// and work-style composition + derived strengths/gaps. Every signal carries a
// confidence. Derived from the TeamDocument text — domain-agnostically — so it works
// for software, cybersecurity, finance, healthcare, legal, data science, etc.

/** Engine-local, cross-industry seniority band (no domain assumptions). */
export type SeniorityBand =
  | "entry"
  | "mid"
  | "senior"
  | "lead"
  | "executive"
  | "unknown";

/** Which extraction path produced the DNA. */
export type DnaExtractionBackend =
  | "lexical"    // statistical + linguistic-cue extraction only
  | "semantic"   // fully embedding-driven (future BGE-M3)
  | "hybrid";    // lexical extraction refined by semantic clustering

/**
 * A single extracted signal with confidence + provenance. This is the atomic
 * unit of TeamDNA — a skill, domain, leadership marker, work-style trait, etc.
 * Shape is compatible with the required `{ skill, confidence }` example while
 * carrying evidence for downstream (Compatibility/Contribution) reasoning.
 */
export interface TeamSignal {
  /** The extracted term/phrase (e.g. "AWS", "HIPAA compliance", "led teams"). */
  label: string;
  /** Confidence this signal is a genuine team attribute, 0–1. */
  confidence: number;
  /** Number of supporting mentions across the document. */
  evidence_count: number;
  /** Artifact filenames that provided evidence (provenance). */
  sources: string[];
  /**
   * Best-effort verbatim excerpt(s) from the source text that produced this
   * signal. Optional + never fabricated — populated only where an extractor
   * captured the surrounding sentence. Powers the recruiter evidence drawer.
   */
  evidence?: string[];
}

/** Aggregate seniority picture of the team. */
export interface SenioritySignal {
  dominant_band: SeniorityBand;
  /** Weighted spread across bands (weights sum ≈ 1 when any signal present). */
  distribution: { band: SeniorityBand; weight: number }[];
  /** Highest "N years" figure detected, if any. */
  max_years_experience: number | null;
  confidence: number;
}

export interface TeamDNA {
  team_id: string;
  /** Best-effort member count (from cues / roster); 0 when unknown. */
  member_count: number;
  /** Skills/technologies/competencies the team demonstrates. */
  skills: TeamSignal[];
  /** Industry/problem domains the team operates in. */
  domains: TeamSignal[];
  /** Aggregate seniority signal. */
  seniority: SenioritySignal;
  /** Leadership / ownership markers detected in the text. */
  leadership_signals: TeamSignal[];
  /** Work-style / culture markers (agile, remote, research-driven, …). */
  work_style_signals: TeamSignal[];
  /** Highest-conviction, well-covered attributes — the team's strengths. */
  strengths: TeamSignal[];
  /** Explicitly-signalled deficits ("thin on ML", "no security background"). */
  gaps: TeamSignal[];
  /** Aggregate confidence in the derived DNA, 0–1. */
  overall_confidence: number;
  /** Which extraction path produced this DNA. */
  extraction_backend: DnaExtractionBackend;
  derivation_warnings: string[];
}

// ── 3. TeamEmbedding ────────────────────────────────────────────────────────────
// Vector representation of the team, used for semantic candidate↔team comparison.
// The engine will (later) reuse the shared MiniLM utility; it does not embed here.

export interface TeamEmbedding {
  team_id: string;
  /** L2-normalised team vector (same dim as the shared model, e.g. 384). */
  vector: number[];
  /** Dimensionality of `vector`. */
  dim: number;
  /** How the team vector was pooled from member/document vectors. */
  pooling: "mean" | "centroid" | "weighted" | "document";
  /** Per-member vectors, if retained for complementarity analysis. */
  member_vectors: MemberVector[];
  /** True when embeddings were unavailable and callers must degrade. */
  degraded: boolean;
}

export interface MemberVector {
  member_id: string;
  vector: number[];
}

// ── 4. CompatibilityScore ───────────────────────────────────────────────────────
// How well a single candidate fits an existing team (culture/skill/seniority).

export interface CompatibilityAxisScore {
  axis: CompatibilityAxis;
  /** 0–100 on this axis. */
  score: number;
  /** Short human-readable justification for the axis score. */
  rationale: string;
  /**
   * True when this axis was backed by real evidence on both sides. Optional for
   * backward compatibility; when false/absent the axis defaulted to neutral and
   * should be suppressed in the UI rather than shown as a meaningless 50.
   */
  has_signal?: boolean;
}

export interface CompatibilityScore {
  team_id: string;
  candidate_id: string;
  /** 0–100 blended compatibility. */
  overall: number;
  /** Per-axis breakdown that composes `overall`. */
  axes: CompatibilityAxisScore[];
  /** Semantic similarity component (cosine), if embeddings were available. */
  semantic_similarity: number | null;
  confidence: ConfidenceTier;
}

// ── 5. ContributionScore ────────────────────────────────────────────────────────
// What NET-NEW value a candidate adds to a team — the inverse of redundancy.

export interface ContributionItem {
  /** Skill / domain / seniority dimension the candidate adds. */
  dimension: string;
  /** Whether this reinforces, diversifies, or is redundant. */
  effect: CompositionEffect;
  /** 0–100 marginal value on this dimension. */
  marginal_value: number;
  rationale: string;
}

export interface ContributionScore {
  team_id: string;
  candidate_id: string;
  /** 0–100 aggregate net-new contribution. */
  overall: number;
  /** Skills/domains the candidate uniquely (or scarcely) adds to the team. */
  fills_gaps: string[];
  /** Areas where the candidate overlaps existing coverage. */
  overlaps: string[];
  /** Per-dimension contribution detail. */
  items: ContributionItem[];
  confidence: ConfidenceTier;
}

// ── 6. TeamAnalysisResult ───────────────────────────────────────────────────────
// Top-level aggregate output of a full Team Intelligence run for one candidate
// (or a batch, when `candidates` holds many). This is the engine's public result.

export interface CandidateTeamFit {
  candidate_id: string;
  candidate_name: string | null;
  compatibility: CompatibilityScore;
  contribution: ContributionScore;
  /** Blended headline recommendation, 0–100. */
  team_fit_score: number;
  /** One-line summary for recruiter display. */
  summary: string;
}

export interface TeamAnalysisResult {
  team_id: string;
  /** The DNA the candidates were evaluated against. */
  team_dna: TeamDNA;
  /** Per-candidate fit results, ranked by `team_fit_score` desc. */
  candidates: CandidateTeamFit[];
  /** Whether the run degraded (no embeddings, sparse team, etc.). */
  degraded: boolean;
  /** Accumulated warnings across every stage. */
  warnings: string[];
}
