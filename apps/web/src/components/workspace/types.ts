// Workspace demo types. Candidate data is generated from the real ranking
// outputs — see candidates.generated.ts (do not hand-edit that file).

export interface LedgerRow {
  label: string;
  weight: number; // positive pillar point-contribution, or -1 for the single caveat
}

export interface WorkspaceCandidate {
  id: string;
  rank: number;
  score: number; // real model score (S = S_fit × availability)
  role: string;
  company: string;
  experience: number;
  appliedMl: number;
  tags: string[];
  ledger: LedgerRow[];
  evidence: string[];
  summary: string;
}
