// Explanations Engine
// Generates natural-language explanations of why a candidate was ranked where they were.
// Used in the recruiter workspace "Why this rank?" drawer and in PDF reports.
// One Claude call per candidate (only if explanation is requested — not in bulk).

import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";
import type { MatchResult } from "@/engines/recruiter-v2/matching";

export interface RankingExplanation {
  opening_line: string;           // One sentence: archetype + seniority + top signal
  why_ranked_here: string;        // 2-3 sentences: match strengths
  key_risks: string[];            // Bullet points from risk_signals
  suggested_interview_probes: string[];  // 2-3 questions targeting gaps or risks
  confidence_note: string | null; // Set if extraction_confidence < 0.6
}

// Generate a natural-language ranking explanation.
// Confidence-gated: if extraction_confidence < 0.4, returns a generic explanation.
export async function generateRankingExplanation(
  profile: CandidateProfile,
  match: MatchResult,
  rank: number,
  totalCandidates: number,
): Promise<RankingExplanation> {
  // TODO: implement
  //   - if profile.extraction_confidence < 0.4: return deterministicExplanation(...)
  //   - else: single Claude call with structured signals (never raw resume text)
  void profile; void match; void rank; void totalCandidates;
  throw new Error("TODO: implement generateRankingExplanation");
}

// Deterministic fallback explanation for low-confidence profiles.
export function deterministicExplanation(
  profile: CandidateProfile,
  match: MatchResult,
  rank: number,
): RankingExplanation {
  // TODO: implement template-based explanation
  void profile; void match; void rank;
  throw new Error("TODO: implement deterministicExplanation");
}
