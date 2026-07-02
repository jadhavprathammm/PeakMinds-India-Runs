// Deterministic Team Intelligence insight generation for the recruiter dashboard.
// No LLM — pure template logic derived from compatibility, contribution, team gaps
// and team strengths. Reused by ResultsDashboard (drawer + top recommendation).

import { capTerm } from "@/lib/matching";
import type { CandidateTeamFit, TeamDNA, CompatibilityAxis } from "@/engines/team-intelligence";

export interface TeamFitBadge {
  label: string;
  className: string;
}

/** Map a 0–100 team-fit score to a labelled badge (matches dashboard design language). */
export function teamFitBadge(score: number): TeamFitBadge {
  if (score >= 90) return { label: "Excellent Team Fit", className: "border border-emerald-500/30 bg-emerald-500/12 text-emerald-300" };
  if (score >= 75) return { label: "Strong Team Fit", className: "border border-accent/30 bg-accent/12 text-accent" };
  if (score >= 60) return { label: "Moderate Team Fit", className: "border border-amber-500/30 bg-amber-500/12 text-amber-300" };
  return { label: "Low Team Fit", className: "border border-border bg-surface-elevated text-muted" };
}

/** Human-friendly list join: "A", "A and B", "A, B and C". */
function joinList(items: string[]): string {
  const xs = items.map(capTerm);
  if (xs.length === 0) return "";
  if (xs.length === 1) return xs[0];
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

function topStrengthPhrase(dna: TeamDNA): string {
  const s = dna.strengths[0]?.label ?? dna.skills[0]?.label;
  return s ? `${capTerm(s)}` : "the team's";
}

/** Net-new capability dimensions the candidate adds (excluding declared gap fills). */
function netNewDimensions(fit: CandidateTeamFit): string[] {
  const fills = new Set(fit.contribution.fills_gaps.map((g) => g.toLowerCase()));
  return fit.contribution.items
    .filter((i) => i.effect === "diversifies" && !fills.has(i.dimension.toLowerCase()))
    .map((i) => i.dimension);
}

/**
 * One-to-two sentence recruiter-facing insight explaining the recommendation.
 * Deterministic — same inputs always yield the same text.
 */
export function generateInsight(fit: CandidateTeamFit, dna: TeamDNA): string {
  const fills = fit.contribution.fills_gaps;
  const compat = fit.compatibility.overall;
  const contrib = fit.contribution.overall;
  const netNew = netNewDimensions(fit).slice(0, 3);

  if (fills.length > 0 && compat >= 60) {
    return `Fills critical ${joinList(fills.slice(0, 3))} capability ${fills.length > 1 ? "gaps" : "gap"} while maintaining strong alignment with existing ${topStrengthPhrase(dna)} practices.`;
  }
  if (fills.length > 0) {
    return `Brings ${joinList(fills.slice(0, 3))} the team currently lacks, though alignment with existing practices is limited (${compat}% compatibility).`;
  }
  if (contrib >= 60) {
    return `Adds valuable ${netNew.length ? joinList(netNew) + " " : "new "}expertise that expands overall team capability.`;
  }
  if (contrib < 40 && compat >= 70) {
    return "Strong compatibility with current team strengths but introduces limited new expertise.";
  }
  return `Fits the team at ${compat}% compatibility with ${contrib}% net-new contribution.`;
}

/** Bulleted reasons for the top-recommendation panel. Always returns ≥1 item. */
export function whyRecommended(fit: CandidateTeamFit, dna: TeamDNA): string[] {
  const out: string[] = [];
  for (const g of fit.contribution.fills_gaps.slice(0, 3)) out.push(`Covers ${capTerm(g)} gap`);
  for (const d of netNewDimensions(fit).slice(0, 2)) out.push(`Adds ${capTerm(d)}`);
  if (fit.contribution.overall >= 70) out.push("Expands overall team capability");
  if (fit.compatibility.overall >= 60) out.push(`Maintains alignment with existing ${topStrengthPhrase(dna)} practices`);
  // Dedupe, keep order, cap.
  const seen = new Set<string>();
  const unique = out.filter((x) => (seen.has(x) ? false : (seen.add(x), true))).slice(0, 5);
  if (unique.length === 0) unique.push(`${fit.team_fit_score}% overall team fit`);
  return unique;
}

// ── Explainability layer (Sprint 3) ───────────────────────────────────────────────
// Recruiter-friendly "because…" bullets generated from the ACTUAL axis/contribution
// signals — never generic AI text. Only signal-bearing axes are considered so we
// never justify a score with a meaningless neutral 50 (Sprint 5).

/** Axes that carried real evidence — used both for reasons and the drawer breakdown. */
export function signalAxes(fit: CandidateTeamFit) {
  return fit.compatibility.axes.filter((a) => a.has_signal !== false);
}

const AXIS_REASON: Record<CompatibilityAxis, (score: number) => string> = {
  skill_alignment: (s) => (s >= 75 ? "Strong overlap with the team's core skills" : "Shares several of the team's core skills"),
  domain_alignment: () => "Works in the team's domain",
  seniority_alignment: () => "Seniority in line with the team",
  leadership_alignment: () => "Leadership profile matches the team",
  work_style_alignment: () => "Similar working style to the team",
  semantic_alignment: (s) => (s >= 75 ? "Strong overall alignment with the team profile" : "Broadly aligns with the team profile"),
};

/** Why the Compatibility score is what it is (positive, signal-bearing axes ≥ 55). */
export function compatibilityReasons(fit: CandidateTeamFit): string[] {
  const out = signalAxes(fit)
    .filter((a) => a.score >= 55)
    .sort((a, b) => b.score - a.score)
    .map((a) => AXIS_REASON[a.axis]?.(a.score))
    .filter(Boolean) as string[];
  if (out.length === 0) out.push(`${fit.compatibility.overall}% overall compatibility with the team`);
  return out.slice(0, 4);
}

/** Why the Contribution score is what it is (gaps filled + net-new capability). */
export function contributionReasons(fit: CandidateTeamFit): string[] {
  const out: string[] = [];
  for (const g of fit.contribution.fills_gaps.slice(0, 3)) out.push(`Fills the team's ${capTerm(g)} gap`);
  for (const d of netNewDimensions(fit).slice(0, 3)) out.push(`Adds ${capTerm(d)} — new to the team`);
  if (fit.contribution.overall >= 70 && out.length < 3) out.push("Expands overall team capability");
  const seen = new Set<string>();
  const unique = out.filter((x) => (seen.has(x) ? false : (seen.add(x), true))).slice(0, 4);
  if (unique.length === 0) unique.push("Mostly reinforces existing team strengths");
  return unique;
}

// ── Team DNA summary + narrative (Sprints 4 & 8) ──────────────────────────────────

export interface TeamDnaSummary {
  strengths: string[];
  gaps: string[];
  characteristics: string[];
}

const BAND_PHRASE: Record<string, string> = {
  entry: "Junior-weighted team",
  mid: "Mid-level engineering team",
  senior: "Senior-heavy team",
  lead: "Lead/staff-heavy team",
  executive: "Leadership-heavy team",
  unknown: "",
};

/** Structured, recruiter-facing Team DNA summary derived from extracted signals. */
export function teamDnaSummary(dna: TeamDNA): TeamDnaSummary {
  const strengths = (dna.strengths.length ? dna.strengths : dna.skills).slice(0, 5).map((s) => capTerm(s.label));
  const gaps = dna.gaps.slice(0, 5).map((g) => capTerm(g.label));

  const characteristics: string[] = [];
  const band = BAND_PHRASE[dna.seniority.dominant_band];
  if (band) characteristics.push(band);
  if (dna.member_count > 0) characteristics.push(`~${dna.member_count} people`);
  if (dna.leadership_signals.some((s) => s.confidence > 0.4)) characteristics.push("Strong leadership presence");
  if (dna.work_style_signals[0]) characteristics.push(`${capTerm(dna.work_style_signals[0].label)} culture`);
  if (dna.gaps[0]) characteristics.push(`Limited ${capTerm(dna.gaps[0].label)} coverage`);

  return { strengths, gaps, characteristics: characteristics.slice(0, 4) };
}

/** One-to-two sentence executive narrative of the team. Deterministic. */
export function teamDnaNarrative(dna: TeamDNA): string {
  const { strengths, gaps } = teamDnaSummary(dna);
  if (strengths.length === 0 && gaps.length === 0) {
    return "Not enough team information was extracted to characterise this team.";
  }
  const parts: string[] = [];
  if (strengths.length > 0) {
    parts.push(`This team is strongest in ${joinList(strengths.slice(0, 3))}.`);
  }
  if (gaps.length > 0) {
    parts.push(`Current hiring opportunities exist in ${joinList(gaps.slice(0, 3))}, where coverage is limited.`);
  }
  return parts.join(" ");
}
