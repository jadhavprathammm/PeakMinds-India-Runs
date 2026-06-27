// Scoring Engine — produces a final match score for a candidate against a JD.
// Consumed by the recruiter workspace and ranking pipeline.

import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";
import type { JdProfileV2, Gap } from "@/engines/candidate-v2/gaps";

export interface ScoredCandidate {
  candidate_name: string | null;
  overall_match_score: number; // 0-100
  skill_match_score: number;
  experience_match_score: number;
  evidence_score: number;
  seniority_match_score: number;
  gaps: Gap[];
  profile: CandidateProfile;
}

// Score a candidate against a JD and return a ScoredCandidate.
export function scoreCandidateAgainstJd(
  profile: CandidateProfile,
  jd: JdProfileV2,
  gaps: Gap[],
): ScoredCandidate {
  // TODO: implement
  //   weighted combination of skill_match, experience_match, evidence, seniority
  void profile; void jd; void gaps;
  throw new Error("TODO: implement scoreCandidateAgainstJd");
}
