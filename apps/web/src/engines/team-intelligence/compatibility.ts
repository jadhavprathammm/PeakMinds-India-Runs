// Team Intelligence — Module 4: Compatibility Engine.
//
// Input:  CandidateProfile (shared, frozen) + TeamDNA (Module 3)
// Output: CompatibilityScore (Module 1 contract)
//
// Answers: "how smoothly does this candidate FIT the existing team?" across six
// axes — Skill, Domain, Seniority, Leadership, Work-style, Semantic. (Net-new
// value / redundancy is Module 5's job, not this one.)
//
// Honours the Module-1 `ScoreCompatibility` contract. `scoreCompatibility` is
// assignable to it (the extra optional `candidateVector` param does not break
// assignability). Domain-agnostic — reuses TeamDNA signals + CandidateProfile
// fields, never a hardcoded skill list. Never throws.

import type {
  TeamDNA,
  TeamEmbedding,
  TeamSignal,
  SenioritySignal,
  SeniorityBand,
  CompatibilityScore,
  CompatibilityAxisScore,
  CompatibilityAxis,
  ConfidenceTier,
} from "./types";
import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";
import type { SeniorityLevel } from "@/engines/shared/types/enums";

// ── Module-1 contract types (kept) ────────────────────────────────────────────────

export type CompatibilityWeights = Partial<Record<CompatibilityAxis, number>>;

export interface CompatibilityConfig {
  weights: CompatibilityWeights;
  /** Include the semantic axis only when a team + candidate vector are available. */
  use_semantic_axis: boolean;
}

export type ScoreCompatibility = (
  candidate: CandidateProfile,
  candidate_id: string,
  teamDna: TeamDNA,
  teamEmbedding: TeamEmbedding | null,
  config: CompatibilityConfig,
) => CompatibilityScore;

export const DEFAULT_COMPATIBILITY_CONFIG: CompatibilityConfig = {
  weights: {
    skill_alignment: 0.28,
    domain_alignment: 0.15,
    seniority_alignment: 0.15,
    leadership_alignment: 0.1,
    work_style_alignment: 0.1,
    semantic_alignment: 0.22,
  },
  use_semantic_axis: true,
};

// ── Normalisation + matching helpers (domain-agnostic) ────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#./\- ]/g, " ").replace(/\s+/g, " ").trim();
}

/** True when two normalised terms refer to the same thing (equality or containment). */
function termsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 3 && b.length >= 3 && (a.includes(b) || b.includes(a))) return true;
  return false;
}

/** Does the candidate's normalised skill/term set cover a team signal label? */
function candidateCovers(candTerms: string[], teamLabel: string): boolean {
  const t = norm(teamLabel);
  return candTerms.some((c) => termsMatch(c, t));
}

/** Weighted coverage of team signals by candidate terms → 0–1 + matched labels. */
function weightedCoverage(
  candTerms: string[],
  teamSignals: TeamSignal[],
): { ratio: number; matched: string[]; hasSignal: boolean } {
  const active = teamSignals.filter((s) => s.confidence > 0);
  if (active.length === 0) return { ratio: 0, matched: [], hasSignal: false };
  let total = 0;
  let hit = 0;
  const matched: string[] = [];
  for (const s of active) {
    total += s.confidence;
    if (candidateCovers(candTerms, s.label)) {
      hit += s.confidence;
      matched.push(s.label);
    }
  }
  return { ratio: total > 0 ? hit / total : 0, matched, hasSignal: true };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
function pct(n01: number): number {
  return Math.round(clamp01(n01) * 100);
}

// ── Candidate term collectors ─────────────────────────────────────────────────────

function candidateSkillTerms(c: CandidateProfile): string[] {
  return [
    ...c.technical_skills,
    ...c.tools,
    ...c.frameworks,
    ...c.cloud_platforms,
    ...c.databases,
    ...c.specializations,
  ].map(norm).filter(Boolean);
}

function candidateDomainTerms(c: CandidateProfile): string[] {
  const roleWords = [c.primary_role_family, ...c.secondary_role_families]
    .filter((r) => r && r !== "unknown")
    .map((r) => r.replace(/_/g, " "));
  return [...c.domain_keywords, ...c.specializations, ...roleWords].map(norm).filter(Boolean);
}

/** Cross-industry work-style tokens inferred from structured profile signals. */
function candidateWorkStyleTerms(c: CandidateProfile): string[] {
  const out: string[] = [];
  const wm = c.career_preferences?.work_mode;
  if (wm && wm !== "unknown") out.push(wm); // remote / hybrid / onsite
  const cs = c.communication_signals;
  if (cs) {
    if (cs.communication_tier === "strong" || cs.communication_tier === "exceptional")
      out.push("collaborative");
    if (cs.mentoring?.formal_mentoring_role) out.push("mentoring");
    if (cs.community?.open_source_maintainer) out.push("open-source", "community");
  }
  const os = c.ownership_signals;
  if (os?.owned_full_pipeline || os?.drove_measurable_outcomes) out.push("ownership", "autonomous");
  // Archetype → a coarse work-style flavour (domain-agnostic).
  const arche: Record<string, string[]> = {
    builder: ["fast-paced", "ownership"],
    researcher: ["research-driven"],
    operator: ["process-oriented", "on-call"],
    leader: ["collaborative", "stakeholder"],
    founder: ["autonomous", "startup"],
    specialist: ["specialist"],
    generalist: ["generalist"],
    transitioner: ["adaptable"],
  };
  if (c.archetype && arche[c.archetype]) out.push(...arche[c.archetype]);
  return out.map(norm).filter(Boolean);
}

// ── Seniority mapping ─────────────────────────────────────────────────────────────

const BAND_ORD: Record<SeniorityBand, number> = {
  entry: 0, mid: 1, senior: 2, lead: 3, executive: 4, unknown: -1,
};

function seniorityToBand(level: SeniorityLevel): SeniorityBand {
  switch (level) {
    case "intern":
    case "junior": return "entry";
    case "mid": return "mid";
    case "senior": return "senior";
    case "staff":
    case "principal": return "lead";
    default: return "unknown";
  }
}

function bandFromYears(years: number): SeniorityBand {
  if (years <= 0) return "unknown";
  if (years < 2) return "entry";
  if (years < 5) return "mid";
  if (years < 9) return "senior";
  return "lead";
}

/** Weighted-mean ordinal of the team's seniority distribution (excl. unknown). */
function teamSeniorityOrdinal(s: SenioritySignal): number | null {
  let wsum = 0;
  let acc = 0;
  for (const d of s.distribution) {
    const ord = BAND_ORD[d.band];
    if (ord < 0) continue;
    acc += ord * d.weight;
    wsum += d.weight;
  }
  return wsum > 0 ? acc / wsum : null;
}

// ── Leadership intensity ──────────────────────────────────────────────────────────

function candidateLeadershipIntensity(c: CandidateProfile): number {
  const l = c.leadership_signals;
  let s = 0;
  if (c.has_management_experience) s += 0.25;
  if (l?.managed_teams) s += 0.3;
  if (l?.led_cross_functional_projects) s += 0.2;
  if (l?.mentored_juniors) s += 0.15;
  if (l?.presented_externally) s += 0.1;
  return clamp01(s);
}

function teamLeadershipIntensity(dna: TeamDNA): number {
  const sig = dna.leadership_signals.filter((x) => x.confidence > 0);
  if (sig.length === 0) return 0;
  const meanConf = sig.reduce((a, x) => a + x.confidence, 0) / sig.length;
  const breadth = clamp01(sig.length / 5);
  return clamp01(meanConf * 0.6 + breadth * 0.4);
}

// ── Semantic ──────────────────────────────────────────────────────────────────────

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (na === 0 || nb === 0) return 0;
  return Math.max(-1, Math.min(1, dot / (Math.sqrt(na) * Math.sqrt(nb))));
}

// ── Axis assembly ─────────────────────────────────────────────────────────────────

interface AxisResult extends CompatibilityAxisScore {
  hasSignal: boolean;
}

function tierFrom(n01: number): ConfidenceTier {
  if (n01 >= 0.75) return "high";
  if (n01 >= 0.5) return "medium";
  if (n01 >= 0.25) return "low";
  return "insufficient";
}

// ── Public entry point ────────────────────────────────────────────────────────────

/**
 * Score one candidate's compatibility with a team. Never throws.
 * `candidateVector` is optional (Module-1 contract has no candidate vector); when
 * supplied together with `teamEmbedding` and `use_semantic_axis`, the semantic axis
 * is computed. Otherwise it is omitted and confidence is lowered accordingly.
 */
export function scoreCompatibility(
  candidate: CandidateProfile,
  candidate_id: string,
  teamDna: TeamDNA,
  teamEmbedding: TeamEmbedding | null,
  config: CompatibilityConfig = DEFAULT_COMPATIBILITY_CONFIG,
  candidateVector: number[] | null = null,
): CompatibilityScore {
  const axes: AxisResult[] = [];
  let semantic_similarity: number | null = null;

  try {
    // 1. Skill alignment
    const skillTerms = candidateSkillTerms(candidate);
    const sk = weightedCoverage(skillTerms, teamDna.skills);
    axes.push({
      axis: "skill_alignment",
      score: sk.hasSignal ? pct(sk.ratio) : 50,
      hasSignal: sk.hasSignal,
      rationale: sk.hasSignal
        ? `Covers ${sk.matched.length}/${teamDna.skills.length} team skills${sk.matched.length ? ` (${sk.matched.slice(0, 4).join(", ")})` : ""}.`
        : "Team has no extracted skills — neutral.",
    });

    // 2. Domain alignment
    const domainTerms = candidateDomainTerms(candidate);
    const dm = weightedCoverage(domainTerms, teamDna.domains);
    axes.push({
      axis: "domain_alignment",
      score: dm.hasSignal ? pct(dm.ratio) : 50,
      hasSignal: dm.hasSignal,
      rationale: dm.hasSignal
        ? `Overlaps team domains${dm.matched.length ? `: ${dm.matched.slice(0, 3).join(", ")}` : " weakly"}.`
        : "Team has no extracted domains — neutral.",
    });

    // 3. Seniority alignment
    let candBand = seniorityToBand(candidate.seniority_level);
    if (candBand === "unknown") candBand = bandFromYears(candidate.years_experience);
    const teamOrd = teamSeniorityOrdinal(teamDna.seniority);
    const candOrd = BAND_ORD[candBand];
    let senScore = 50;
    let senSignal = false;
    if (teamOrd !== null && candOrd >= 0) {
      senSignal = true;
      let sim = 1 - Math.abs(candOrd - teamOrd) / 4;
      // Blend a years-of-experience similarity when both sides expose years.
      const ty = teamDna.seniority.max_years_experience;
      if (ty && candidate.years_experience > 0) {
        const ys = 1 - Math.abs(candidate.years_experience - ty) / Math.max(candidate.years_experience, ty, 1);
        sim = sim * 0.7 + clamp01(ys) * 0.3;
      }
      senScore = pct(sim);
    }
    axes.push({
      axis: "seniority_alignment",
      score: senScore,
      hasSignal: senSignal,
      rationale: senSignal
        ? `Candidate band "${candBand}" vs team ~"${teamDna.seniority.dominant_band}".`
        : "Seniority unknown on one side — neutral.",
    });

    // 4. Leadership alignment (altitude similarity)
    const cl = candidateLeadershipIntensity(candidate);
    const tl = teamLeadershipIntensity(teamDna);
    const leadSignal = teamDna.leadership_signals.some((x) => x.confidence > 0);
    axes.push({
      axis: "leadership_alignment",
      score: leadSignal ? pct(1 - Math.abs(cl - tl)) : 50,
      hasSignal: leadSignal,
      rationale: leadSignal
        ? `Candidate leadership intensity ${cl.toFixed(2)} vs team ${tl.toFixed(2)}.`
        : "No team leadership signal — neutral.",
    });

    // 5. Work-style alignment
    const wsTerms = candidateWorkStyleTerms(candidate);
    const ws = weightedCoverage(wsTerms, teamDna.work_style_signals);
    const wsSignal = ws.hasSignal && wsTerms.length > 0;
    axes.push({
      axis: "work_style_alignment",
      score: wsSignal ? pct(ws.ratio) : 50,
      hasSignal: wsSignal,
      rationale: wsSignal
        ? `Shares work-style traits${ws.matched.length ? `: ${ws.matched.slice(0, 3).join(", ")}` : " weakly"}.`
        : "Insufficient work-style signal on one side — neutral.",
    });

    // 6. Semantic alignment
    if (
      config.use_semantic_axis &&
      teamEmbedding &&
      !teamEmbedding.degraded &&
      candidateVector &&
      candidateVector.length > 0
    ) {
      const cos = cosine(candidateVector, teamEmbedding.vector);
      semantic_similarity = Math.round(cos * 10000) / 10000;
      const normed = clamp01((cos - 0.25) / 0.75); // mirror live engine's floor
      axes.push({
        axis: "semantic_alignment",
        score: pct(normed),
        hasSignal: true,
        rationale: `Cosine(candidate, team) = ${semantic_similarity}.`,
      });
    }
  } catch {
    // Any unexpected failure → keep whatever axes we computed; never throw.
  }

  // ── Blend ──────────────────────────────────────────────────────────────────────
  let wsum = 0;
  let acc = 0;
  for (const a of axes) {
    if (!a.hasSignal) continue;
    const w = config.weights[a.axis] ?? 0;
    if (w <= 0) continue;
    acc += a.score * w;
    wsum += w;
  }
  const overall = wsum > 0 ? Math.round(acc / wsum) : 0;

  // Confidence: team DNA confidence × how much real signal we had.
  const signalCoverage = axes.filter((a) => a.hasSignal).length / 6;
  const confNum = clamp01(teamDna.overall_confidence * 0.5 + signalCoverage * 0.5);

  return {
    team_id: teamDna.team_id,
    candidate_id,
    overall,
    axes: axes.map(({ axis, score, rationale, hasSignal }) => ({ axis, score, rationale, has_signal: hasSignal })),
    semantic_similarity,
    confidence: wsum > 0 ? tierFrom(confNum) : "insufficient",
  };
}

// Compile-time proof that the implementation satisfies the Module-1 contract.
export const scoreCompatibilityContract: ScoreCompatibility = scoreCompatibility;
