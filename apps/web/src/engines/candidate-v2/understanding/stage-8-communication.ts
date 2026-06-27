// Stage 8 — Communication Signals Extraction
// Single Claude call + deterministic post-processing.
// Fields owned: communication_signals (all sub-fields including communication_tier).

import type { PreflightOutput, EvidenceOutput, CommunicationOutput } from "@/engines/shared/types/stage-outputs";
import type { AudienceScope, CommunicationTier } from "@/engines/shared/types/enums";
import type { CommunicationSignals } from "@/engines/shared/types/sub-types";

export const COMMUNICATION_STAGE_DEFAULTS: CommunicationOutput = {
  communication_signals: {
    presentations: [],
    technical_writing: {
      has_technical_blog: false,
      blog_platform: null,
      blog_url: null,
      estimated_post_count: null,
      writing_topics: [],
    },
    mentoring: {
      formal_mentoring_role: false,
      junior_coaching_described: false,
      onboarding_described: false,
      mentees_count_estimate: null,
    },
    community: {
      open_source_maintainer: false,
      conference_organizer: false,
      community_names: [],
      stackoverflow_reputation_mentioned: false,
    },
    communication_tier: "minimal",
    publication_count: 0,
  },
  stage_confidence: 0.1,
  extraction_warnings: ["COMMUNICATION_EXTRACTION_FAILED_AFTER_RETRY"],
};

// Run Stage 8.
// Input: full normalized_text.
// publication_count is set from evidence.publications.length (never from Claude).
//
// Post-processing pass:
//   1. Normalise audience_scope_raw → AudienceScope enum
//   2. Compute communication_tier from scoring function
//   3. Set publication_count = evidence.publications.length
export async function runStage8Communication(
  preflight: PreflightOutput,
  evidence: EvidenceOutput,
): Promise<CommunicationOutput> {
  // TODO: implement
  void preflight; void evidence;
  return { ...COMMUNICATION_STAGE_DEFAULTS };
}

// Map audience_scope_raw string to AudienceScope enum.
export function normalizeAudienceScope(raw: string | null): AudienceScope {
  // TODO: implement
  //   "company all-hands", "internal", "team" → "internal"
  //   "city meetup", "local conference"       → "local"
  //   "national conference", "PyCon India"    → "national"
  //   "NeurIPS", "ICML", "international"      → "international"
  void raw;
  return "internal";
}

// Compute communication_tier from the scoring function in the spec.
// Takes publication_count from Stage 7 (not from communication signals).
export function computeCommunicationTier(
  signals: Omit<CommunicationSignals, "communication_tier" | "publication_count">,
  publicationCount: number,
): CommunicationTier {
  // TODO: implement scoring
  //   score = 0
  //   if presentations.length > 0: score += 1
  //   if presentations.some(national or international): score += 1
  //   if technical_writing.has_technical_blog: score += 1
  //   if publicationCount > 0: score += 1
  //   if community.open_source_maintainer: score += 1
  //   if community.conference_organizer: score += 1
  //   if mentoring.formal_mentoring_role: score += 0.5
  //   tier: 0 → "minimal", [0.5,1.5] → "moderate", [2,3] → "strong", ≥3.5 → "exceptional"
  void signals; void publicationCount;
  return "minimal";
}
