// Matching Engine
// Computes a structured match between a CandidateProfile V2 and a JdProfileV2.
// Returns skill match vectors, gap list, and a weighted overall score.

import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";
import type { JdProfileV2 } from "@/engines/recruiter-v2/jd-understanding";

export interface SkillMatchVector {
  matched: string[];
  missing: string[];
  partial: string[];
  match_ratio: number; // 0-1
}

export interface MatchResult {
  overall_score: number;          // 0-100, weighted composite
  skill_match: SkillMatchVector;
  framework_match: SkillMatchVector;
  domain_match: SkillMatchVector;
  experience_score: number;       // 0-100
  seniority_score: number;        // 0-100
  evidence_score: number;         // 0-100
  key_gaps: string[];
  key_strengths: string[];
  recommendation: "shortlist" | "consider" | "hold" | "decline";
}

// Compute a full match result between a candidate and a JD.
export function matchCandidateToJd(
  profile: CandidateProfile,
  jd: JdProfileV2,
): MatchResult {
  // TODO: implement
  //   - skill_match: intersect profile skill arrays vs jd.required_skills
  //   - experience_score: years_experience vs jd.years_required
  //   - seniority_score: profile.seniority_level vs jd.seniority
  //   - evidence_score: from profile.evidence_strength
  //   - overall_score: weighted sum (skills 40%, experience 25%, seniority 20%, evidence 15%)
  void profile; void jd;
  throw new Error("TODO: implement matchCandidateToJd");
}

// Compute a SkillMatchVector for one skill category.
export function computeSkillMatch(
  profileSkills: string[],
  requiredSkills: string[],
): SkillMatchVector {
  // TODO: implement with normalised string comparison
  void profileSkills; void requiredSkills;
  throw new Error("TODO: implement computeSkillMatch");
}

// Derive recommendation tier from overall_score.
// >= 75 → shortlist, 55-74 → consider, 40-54 → hold, < 40 → decline
export function deriveRecommendation(
  overallScore: number,
): MatchResult["recommendation"] {
  // TODO: implement
  void overallScore;
  return "hold";
}
