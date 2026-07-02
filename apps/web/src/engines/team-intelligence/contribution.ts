// Team Intelligence — Module 5: Contribution Engine.
//
// Input:  CandidateProfile (shared, frozen) + TeamDNA (Module 3)
// Output: ContributionScore (Module 1 contract)
//
// Compatibility asks "will they fit?"; Contribution asks "what will they ADD?".
// It measures NET-NEW value beyond the team's existing capabilities, across three
// axes blended into an overall "Team Expansion Value":
//   1. Gap Coverage       — how much of TeamDNA.gaps the candidate fills
//   2. Unique Strengths    — candidate capabilities not represented on the team
//   3. Expertise Diversity — breadth the candidate adds to the capability surface
//
// Domain-agnostic: matches over Module 3's extracted signals, never a hardcoded
// skill list. Confidence-aware. Never throws. Missing signals lower confidence but
// never create penalties (an axis with no signal is excluded from the blend).

import type {
  TeamDNA,
  TeamSignal,
  ContributionScore,
  ContributionItem,
  CompositionEffect,
  ConfidenceTier,
} from "./types";
import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";

// ── Module-1 contract types (kept + extended with axis weights) ───────────────────

export interface ContributionConfig {
  /** Weight given to filling an outright team gap vs. deepening coverage. (Module 1) */
  gap_fill_weight: number;
  /** Penalty applied to redundant dimensions. (Module 1) Kept at 0 by default —
   *  per spec, redundancy is recorded but does not penalise the score. */
  redundancy_penalty: number;
  /** Blend weights for the three contribution axes (sum ≈ 1). */
  weights: {
    gap_coverage: number;
    unique_strengths: number;
    expertise_diversity: number;
  };
}

export type ScoreContribution = (
  candidate: CandidateProfile,
  candidate_id: string,
  teamDna: TeamDNA,
  config: ContributionConfig,
) => ContributionScore;

export const DEFAULT_CONTRIBUTION_CONFIG: ContributionConfig = {
  gap_fill_weight: 1.0,
  redundancy_penalty: 0, // redundancy never penalises — only absence of net-new lowers score
  weights: {
    gap_coverage: 0.45,
    unique_strengths: 0.3,
    expertise_diversity: 0.25,
  },
};

// ── Normalisation + matching (domain-agnostic, self-contained) ────────────────────

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#./\- ]/g, " ").replace(/\s+/g, " ").trim();
}

function termsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 3 && b.length >= 3 && (a.includes(b) || b.includes(a))) return true;
  return false;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
function pct(n01: number): number {
  return Math.round(clamp01(n01) * 100);
}

// ── Candidate capability collection (norm → display label) ────────────────────────

function candidateCapabilities(c: CandidateProfile): { norm: string; label: string }[] {
  const raw = [
    ...c.technical_skills,
    ...c.tools,
    ...c.frameworks,
    ...c.cloud_platforms,
    ...c.databases,
    ...c.specializations,
    ...c.domain_keywords,
  ];
  const seen = new Map<string, string>();
  for (const term of raw) {
    const n = norm(term);
    if (n && !seen.has(n)) seen.set(n, term.trim());
  }
  return [...seen.entries()].map(([n, label]) => ({ norm: n, label }));
}

function matchesAny(termNorm: string, signals: TeamSignal[]): TeamSignal | null {
  for (const s of signals) {
    if (s.confidence > 0 && termsMatch(termNorm, norm(s.label))) return s;
  }
  return null;
}

// ── Confidence bucketing ──────────────────────────────────────────────────────────

function tierFrom(n01: number): ConfidenceTier {
  if (n01 >= 0.75) return "high";
  if (n01 >= 0.5) return "medium";
  if (n01 >= 0.25) return "low";
  return "insufficient";
}

// ── Public entry point ────────────────────────────────────────────────────────────

/**
 * Score one candidate's net-new contribution to a team. Never throws.
 * Missing team signals reduce confidence but never penalise the score.
 */
export function scoreContribution(
  candidate: CandidateProfile,
  candidate_id: string,
  teamDna: TeamDNA,
  config: ContributionConfig = DEFAULT_CONTRIBUTION_CONFIG,
): ContributionScore {
  const fills_gaps: string[] = [];
  const overlaps: string[] = [];
  const items: ContributionItem[] = [];

  // Axis signal + score accumulators.
  let gapScore = 0, gapHasSignal = false;
  let uniqueScore = 0, uniqueHasSignal = false;
  let diversityScore = 0, diversityHasSignal = false;

  try {
    const caps = candidateCapabilities(candidate);
    const teamSkills = teamDna.skills.filter((s) => s.confidence > 0);
    const teamStrengths = teamDna.strengths.filter((s) => s.confidence > 0);
    const teamGaps = teamDna.gaps.filter((s) => s.confidence > 0);
    const represented = [...teamSkills, ...teamStrengths]; // what the team already has

    // ── 1. Gap Coverage ──────────────────────────────────────────────────────────
    if (teamGaps.length > 0) {
      gapHasSignal = true;
      let totalW = 0, coveredW = 0;
      for (const g of teamGaps) {
        totalW += g.confidence;
        const covered = caps.some((cap) => termsMatch(cap.norm, norm(g.label)));
        if (covered) {
          coveredW += g.confidence;
          fills_gaps.push(g.label);
          items.push({
            dimension: g.label,
            effect: "diversifies",
            marginal_value: pct(0.6 + 0.4 * g.confidence),
            rationale: `Fills a stated team gap ("${g.label}").`,
          });
        }
      }
      gapScore = totalW > 0 ? coveredW / totalW : 0;
    }

    // ── 2 & 3. Classify every candidate capability once ──────────────────────────
    let netNewCount = 0;
    for (const cap of caps) {
      const gapHit = matchesAny(cap.norm, teamGaps);
      if (gapHit) { netNewCount++; continue; } // already itemised under gap coverage

      const strengthHit = matchesAny(cap.norm, teamStrengths);
      if (strengthHit) {
        overlaps.push(cap.label);
        items.push({
          dimension: cap.label,
          effect: "reinforces",
          marginal_value: 30,
          rationale: `Deepens an existing team strength ("${strengthHit.label}").`,
        });
        continue;
      }

      const skillHit = matchesAny(cap.norm, teamSkills);
      if (skillHit) {
        overlaps.push(cap.label);
        items.push({
          dimension: cap.label,
          effect: "redundant",
          marginal_value: 15,
          rationale: `Team already covers "${skillHit.label}".`,
        });
        continue;
      }

      // Net-new capability the team does not have at all.
      netNewCount++;
      items.push({
        dimension: cap.label,
        effect: "diversifies",
        marginal_value: 70,
        rationale: `Adds a capability not present on the team ("${cap.label}").`,
      });
    }

    // Unique Strengths — saturating on net-new count (quality of net-new value).
    if (caps.length > 0) {
      uniqueHasSignal = true;
      uniqueScore = 1 - Math.exp(-netNewCount / 1.5); // 1→0.49, 2→0.74, 3→0.86
    }

    // Expertise Diversity — how much the candidate expands the capability surface.
    if (caps.length > 0) {
      diversityHasSignal = true;
      diversityScore = teamSkills.length > 0
        ? clamp01(netNewCount / teamSkills.length)   // net-new relative to team breadth
        : clamp01(netNewCount / 5);                  // sparse team → absolute breadth
    }
  } catch {
    // Any unexpected failure → return whatever was computed; never throw.
  }

  // ── Team Expansion Value (weighted blend of signal-bearing axes) ────────────────
  const axisInputs: { score01: number; weight: number; on: boolean }[] = [
    { score01: gapScore, weight: config.weights.gap_coverage * config.gap_fill_weight, on: gapHasSignal },
    { score01: uniqueScore, weight: config.weights.unique_strengths, on: uniqueHasSignal },
    { score01: diversityScore, weight: config.weights.expertise_diversity, on: diversityHasSignal },
  ];
  let wsum = 0, acc = 0;
  for (const a of axisInputs) {
    if (!a.on || a.weight <= 0) continue;
    acc += a.score01 * a.weight;
    wsum += a.weight;
  }
  const overall = wsum > 0 ? Math.round((acc / wsum) * 100) : 0;

  // ── Confidence ──────────────────────────────────────────────────────────────────
  const signalCoverage = axisInputs.filter((a) => a.on).length / 3;
  const confNum = clamp01(teamDna.overall_confidence * 0.5 + signalCoverage * 0.5);

  // Order items: highest marginal value first, cap for readability.
  items.sort((a, b) => b.marginal_value - a.marginal_value);

  return {
    team_id: teamDna.team_id,
    candidate_id,
    overall,
    fills_gaps,
    overlaps,
    items: items.slice(0, 12),
    confidence: wsum > 0 ? tierFrom(confNum) : "insufficient",
  };
}

// Compile-time proof that the implementation satisfies the Module-1 contract.
export const scoreContributionContract: ScoreContribution = scoreContribution;
