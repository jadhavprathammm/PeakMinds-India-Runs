// Stage 14 — Assembly
// No Claude call. Pure merge of all stage outputs into a single CandidateProfile.
// Applies conflict resolution rules and backward-compat aliases.
// Fields owned: the complete CandidateProfile object. No new fields.

import type { AllStageOutputs, AssemblyOutput } from "@/engines/shared/types/stage-outputs";
import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";

// Run Stage 14.
// Assembly order (15 steps from the spec):
//   1. Identity (Stage 2)
//   2. Skills (Stage 3)
//   3. Experience (Stage 4)
//   4. Projects (Stage 5)
//   5. Education + Languages (Stage 6)
//   6. Evidence (Stage 7)
//   7. Communication Signals — set publication_count = publications.length (Stage 8)
//   8. Career Preferences (Stage 9)
//   9. Quality Signals (Stage 10)
//   10. Risk Signals (Stage 11)
//   11. Recruiter Signals (Stage 12)
//   12. Archetype + Differentiators (Stage 13)
//   13. Resolve conflicts per conflict resolution rules
//   14. Set backward-compat aliases (role_family = primary_role_family)
//   15. Final profile_completeness recomputation
export function runStage14Assembly(stages: AllStageOutputs): AssemblyOutput {
  // TODO: implement
  void stages;
  throw new Error("TODO: implement Stage 14 — Assembly");
}

// Resolve years_experience conflict between stated (Stage 2) and computed (Stage 4).
// delta <= 2 → use computed (more precise)
// delta > 2  → use stated; add warning YOE_CONFLICT_LARGE_DELTA
export function resolveYoE(
  stated: number | null,
  computed: number | null,
): number {
  // TODO: implement
  //   if both null → 0
  //   if stated null → computed
  //   if computed null → stated
  //   delta = |stated - computed|
  //   if delta <= 2 → return computed
  //   else → return stated (add warning via caller)
  void stated; void computed;
  return 0;
}

// Apply all conflict resolution rules from the spec.
// Mutates the draft profile to resolve inconsistencies.
export function resolveConflicts(
  draft: Partial<CandidateProfile>,
  stages: AllStageOutputs,
): Partial<CandidateProfile> {
  // TODO: implement conflict resolution rules:
  //   - years_experience: use resolveYoE result
  //   - multiple is_current === true → retain highest start_year; warn
  //   - publication_count = publications.length (always recompute)
  //   - profile_completeness: recompute from final state
  void draft; void stages;
  throw new Error("TODO: implement resolveConflicts");
}
