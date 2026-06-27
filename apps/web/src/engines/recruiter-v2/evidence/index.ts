// Recruiter Evidence Engine
// Assembles recruiter-facing evidence cards from a completed CandidateProfile.
// Distinct from candidate-v2/evidence/: this produces display-ready structures
// for the recruiter workspace (evidence chips, proof points, citations).

import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";

export type EvidenceChipType =
  | "metric"
  | "deployment"
  | "open_source"
  | "publication"
  | "award";

export interface EvidenceChip {
  type: EvidenceChipType;
  label: string;
  detail: string | null;
  url: string | null;
  source_role_index: number | null;
}

export interface RecruiterEvidenceBundle {
  chips: EvidenceChip[];
  strongest_metric: string | null;
  production_proof_count: number;
  has_verifiable_evidence: boolean;
  evidence_summary_line: string;
}

// Produce a RecruiterEvidenceBundle from a completed profile.
// Pure function — no Claude call.
export function buildRecruiterEvidenceBundle(
  profile: CandidateProfile,
): RecruiterEvidenceBundle {
  // TODO: implement
  //   - map quantified_achievements → "metric" chips
  //   - map production_deployments → "deployment" chips
  //   - map open_source_contributions → "open_source" chips (with url)
  //   - map publications → "publication" chips
  //   - map awards_and_recognition → "award" chips
  //   - has_verifiable_evidence = any chip with url !== null
  //   - evidence_summary_line: "{N} quantified outcomes, {M} verified signals"
  void profile;
  throw new Error("TODO: implement buildRecruiterEvidenceBundle");
}
