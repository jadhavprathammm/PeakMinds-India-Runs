// Evidence Engine — scores evidence quality from a completed CandidateProfile.
// Consumed by the scoring engine and recruiter report generator.

import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";
import type { EvidenceStrength } from "@/engines/shared/types/enums";

export interface EvidenceQualityReport {
  evidence_strength: EvidenceStrength;
  quantified_count: number;
  verified_count: number;
  production_count: number;
  open_source_count: number;
  publication_count: number;
  top_achievements: string[];
  evidence_summary: string;
}

// Produce an evidence quality report from a completed CandidateProfile.
export function scoreEvidenceQuality(
  profile: CandidateProfile,
): EvidenceQualityReport {
  // TODO: implement
  void profile;
  throw new Error("TODO: implement scoreEvidenceQuality");
}
