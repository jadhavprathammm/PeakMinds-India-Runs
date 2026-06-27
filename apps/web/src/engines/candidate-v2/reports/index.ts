// Reports Engine — generates structured recruiter reports from scored candidates.
// Consumed by the recruiter workspace and PDF export.

import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";
import type { ScoredCandidate } from "@/engines/candidate-v2/scoring";

export interface RecruiterReport {
  candidate_name: string | null;
  overall_verdict: string;
  match_score: number;
  key_strengths: string[];
  key_concerns: string[];
  archetype_summary: string;
  differentiators: string[];
  risk_summary: string;
  evidence_highlights: string[];
  recommendation: "shortlist" | "consider" | "hold" | "decline";
  generated_at: string; // ISO timestamp
}

// Generate a structured recruiter report from a scored candidate.
export function generateRecruiterReport(
  scored: ScoredCandidate,
): RecruiterReport {
  // TODO: implement
  //   - verdict from overall_match_score thresholds
  //   - key_strengths from profile.archetype strengths + top evidence
  //   - key_concerns from risk_signals + gaps
  //   - recommendation: >= 75 → shortlist, 55-74 → consider, 40-54 → hold, < 40 → decline
  void scored;
  throw new Error("TODO: implement generateRecruiterReport");
}

// Generate a plain-text summary suitable for the candidate-review page.
export function generateCandidateSummary(profile: CandidateProfile): string {
  // TODO: implement
  void profile;
  throw new Error("TODO: implement generateCandidateSummary");
}
