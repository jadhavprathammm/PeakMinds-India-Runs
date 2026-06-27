// Candidate Understanding Engine (Recruiter side)
// Receives a completed CandidateProfile V2 and produces a recruiter-facing
// summary: shortlist card fields, one-line verdict, evidence highlights.
// Consumed by the matching and explanations engines.

import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";
import type { SeniorityLevel, RoleFamily, CandidateArchetype } from "@/engines/shared/types/enums";

export interface ShortlistCard {
  candidate_name: string | null;
  current_title: string | null;
  years_experience: number;
  seniority_level: SeniorityLevel;
  primary_role_family: RoleFamily;
  archetype: CandidateArchetype;
  top_skills: string[];
  key_differentiators: string[];
  evidence_highlights: string[];
  risk_summary: string | null;
  profile_completeness: number;
  extraction_confidence: number;
}

// Produce a ShortlistCard from a completed CandidateProfile.
// Pure function — no Claude call.
export function buildShortlistCard(profile: CandidateProfile): ShortlistCard {
  // TODO: implement
  //   - top_skills = technical_skills.slice(0, 5) + frameworks.slice(0, 3)
  //   - evidence_highlights = top 3 quantified_achievements
  //   - risk_summary from risk_signals.overall_risk_level + risk_flags[0]
  void profile;
  throw new Error("TODO: implement buildShortlistCard");
}

// Produce a one-line recruiter verdict for the candidate.
// Used as the opening line in recruiter reports.
export function buildVerdictLine(
  profile: CandidateProfile,
  matchScore: number,
): string {
  // TODO: implement
  void profile; void matchScore;
  throw new Error("TODO: implement buildVerdictLine");
}
