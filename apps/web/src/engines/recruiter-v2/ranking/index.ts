// Ranking Engine (Recruiter side — TypeScript interface to the Python ranking service)
// Converts a list of MatchResults into a ranked CandidateRanking array.
// Mirrors the Python ranking logic in services/ranking-engine/ for the web layer.

import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";
import type { MatchResult } from "@/engines/recruiter-v2/matching";

export interface CandidateRanking {
  rank: number;
  profile: CandidateProfile;
  match: MatchResult;
  score: number;        // Final weighted score, 0-100
  score_breakdown: ScoreBreakdown;
  tier: RankingTier;
}

export interface ScoreBreakdown {
  skill_component: number;
  experience_component: number;
  evidence_component: number;
  seniority_component: number;
  risk_penalty: number;
  final_score: number;
}

export type RankingTier =
  | "top_10_pct"
  | "top_25_pct"
  | "top_50_pct"
  | "bottom_50_pct";

// Rank a list of candidates by their match results.
// Returns a sorted CandidateRanking[] (rank 1 = best match).
export function rankCandidates(
  candidates: Array<{ profile: CandidateProfile; match: MatchResult }>,
): CandidateRanking[] {
  // TODO: implement
  //   1. compute ScoreBreakdown for each candidate
  //   2. sort descending by final_score
  //   3. assign rank and tier
  void candidates;
  throw new Error("TODO: implement rankCandidates");
}

// Apply a risk penalty to a raw match score.
// "critical" risk → −20 pts, "high" → −10, "moderate" → −5
export function applyRiskPenalty(
  rawScore: number,
  overallRiskLevel: string,
): number {
  // TODO: implement
  void rawScore; void overallRiskLevel;
  return rawScore;
}

// Assign a percentile tier from rank and total count.
export function assignTier(
  rank: number,
  totalCandidates: number,
): RankingTier {
  // TODO: implement
  void rank; void totalCandidates;
  return "bottom_50_pct";
}
