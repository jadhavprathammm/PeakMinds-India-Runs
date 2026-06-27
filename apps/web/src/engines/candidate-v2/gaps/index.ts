// Gaps Engine — computes skill and experience gaps relative to a JD profile.
// Consumed by the scoring engine and improvement recommendations engine.

import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";

export interface JdProfileV2 {
  role_title: string;
  seniority: string;
  years_required: number | null;
  required_skills: string[];
  required_frameworks: string[];
  required_tools: string[];
  domain_knowledge: string[];
  leadership_requirements: string[];
  nice_to_have_skills: string[];
}

export type GapSeverity = "critical" | "high" | "medium" | "low";

export interface Gap {
  title: string;
  severity: GapSeverity;
  description: string;
  category: "skill" | "experience" | "seniority" | "domain";
}

// Compute gaps between a candidate profile and a JD profile.
export function computeGaps(
  profile: CandidateProfile,
  jd: JdProfileV2,
): Gap[] {
  // TODO: implement
  //   1. Skill gaps: jd.required_skills not present in any profile skill array
  //   2. Experience gaps: years_experience < jd.years_required
  //   3. Seniority gaps: profile.seniority_level < required seniority
  //   4. Domain gaps: jd.domain_knowledge not in profile.domain_keywords
  void profile; void jd;
  throw new Error("TODO: implement computeGaps");
}
