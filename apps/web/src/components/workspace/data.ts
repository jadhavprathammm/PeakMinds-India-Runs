// =============================================================================
// Talent Intelligence Workspace — candidate data.
//
// Source of truth: services/ranking-engine/submissions/team_redrob.csv +
//   candidate_features.parquet + reasoning_facts.parquet.
// The candidate rows and filter chips are GENERATED (candidates.generated.ts)
// by `python services/ranking-engine/export_web_data.py` — every field is real:
//   • score        — the model's S score (= S_fit × availability)
//   • ledger        — real per-pillar point contributions + the engine's one caveat
//   • evidence      — the actual signals the engine cited
//   • summary       — the verbatim reasoning string from the submission
//   • tags          — the candidate's top-endorsed skills
// Nothing here is invented; regenerate to stay in sync with the submission.
// =============================================================================

export type { WorkspaceCandidate, LedgerRow } from "./types";
export { CANDIDATES, FILTER_CHIPS } from "./candidates.generated";
