# Team Intelligence — Module 8: Dashboard Enhancement

Exposes the engine's output as a visible, persuasive recruiter feature. Every addition is gated on
Team Intelligence being present — with no team documents, the dashboard is **byte-for-byte identical
to today**.

## Files changed

| File | Type | Change |
|------|------|--------|
| `components/recruiter/ResultsDashboard.tsx` | modified | Team Fit column, enriched panel (top recommendation + comparison table), drawer breakdown |
| `lib/team-insights.ts` | **new** | Deterministic badges, insight templates, "why recommended" |
| `docs/team-intelligence-module8-dashboard.md` | **new** | This document |

**No protected file modified** (`matching.ts`, `lib/embeddings.ts`, `rank-candidates/route.ts`,
`analyze/route.ts` — `embeddings.ts`/`rank-candidates` 0-diff; the `matching.ts`/`analyze` diffs
pre-existed this work). `tsc` and `eslint` pass.

## UI additions

All gated on `hasTeam = !!teamAnalysis && fitByName.size > 0`. Candidates are joined to their
`CandidateTeamFit` by `candidate_id` (== candidate name, set by the Module-7 adapter).

1. **Ranked table — "Team Fit" column.** One extra column (a `TeamFitPill`: score + badge) appears
   only when team data exists. Empty-state `colSpan` adjusts (5 → 6).
2. **Top Team Recommendation panel.** The highest team-fit candidate with a badge, a deterministic
   insight sentence, and a bulleted "Why recommended" list.
3. **Candidate comparison table.** Every analysed candidate with **Job Match · Compatibility ·
   Contribution · Team Fit** — the core demo artifact showing why PeakMinds may rank differently from
   a traditional ATS (which ranks on Job Match alone).
4. **Candidate drawer — "Team Fit" section.** Per-candidate 4-metric breakdown (Job Match, Team
   Compatibility, Team Contribution, Overall Team Fit) with bars, badge, insight, and filled-gap
   chips.

## Badge logic

`teamFitBadge(score)` (matches the dashboard's existing badge styling vocabulary):

| Score | Label | Style |
|-------|-------|-------|
| 90–100 | Excellent Team Fit | emerald |
| 75–89 | Strong Team Fit | accent |
| 60–74 | Moderate Team Fit | amber |
| < 60 | Low Team Fit | muted |

## Insight generation rules (deterministic — no LLM)

`generateInsight(fit, dna)` selects one template from compatibility, contribution, filled gaps, and
net-new dimensions:

| Condition | Insight |
|-----------|---------|
| fills gaps **and** compat ≥ 60 | *"Fills critical {gaps} capability gap(s) while maintaining strong alignment with existing {top strength} practices."* |
| fills gaps **and** compat < 60 | *"Brings {gaps} the team currently lacks, though alignment with existing practices is limited ({compat}% compatibility)."* |
| no gaps filled, contrib ≥ 60 | *"Adds valuable {net-new} expertise that expands overall team capability."* |
| no gaps, contrib < 40, compat ≥ 70 | *"Strong compatibility with current team strengths but introduces limited new expertise."* |
| otherwise | *"Fits the team at {compat}% compatibility with {contrib}% net-new contribution."* |

`whyRecommended(fit, dna)` builds ≥1 bullet from: `Covers {gap} gap` (per filled gap) → `Adds
{dimension}` (per net-new item) → `Expands overall team capability` (contrib ≥ 70) → `Maintains
alignment with existing {strength} practices` (compat ≥ 60), de-duplicated and capped at 5. The
fallback insight wording deliberately avoids the badge words ("Strong/Moderate/Low") so insight text
never contradicts the badge label.

## Comparison methodology

The comparison table is sorted by **Team Fit** (the PeakMinds view), while **Job Match** is the raw
`/api/rank-candidates` score (the ATS view). Placing both side by side makes the differentiator
explicit: a candidate can top Job Match yet rank lower on Team Fit (great match, redundant), or fill
critical gaps and rank higher despite a lower Job Match. This is the "why PeakMinds beats a
traditional ATS" story in one table.

## Backward compatibility

| Scenario | Result |
|----------|--------|
| **No team documents** | `hasTeam = false` → no Team Fit column, no panel, no drawer section, no banner. Dashboard identical to current PeakMinds. **No empty Team Intelligence sections.** |
| **Team documents present** | All Team Intelligence UI becomes visible. |

## Validation results

Team: backend/cloud platform, gaps = *machine learning, data analytics*. CSV → adapter → engine.

**Case 1 — No team docs:** `hasTeam` false; every Team Intelligence element is skipped; ranked table
renders 5 columns as before. ✅ Unchanged.

**Case 2 — Team docs + strong contributor (Asha):** drawer + panel show Compatibility 47,
Contribution 93, Team Fit 65, and the insight *"Brings Machine learning and Data analytics the team
currently lacks…"*. ✅

**Case 3 — Multiple candidates (comparison correctly differentiates):**

| Candidate | Job Match | Compatibility | Contribution | Team Fit | Badge |
|-----------|:--------:|:-------------:|:------------:|:--------:|-------|
| Asha | (ATS score) | 47 | 93 | **65** | Moderate Team Fit |
| Ben | (ATS score) | **65** | 32 | 52 | Low Team Fit |
| Cara | (ATS score) | 27 | 41 | 33 | Low Team Fit |

Ben has the **highest compatibility** (65) but a **lower team fit** than Asha, because Asha fills
both team gaps (contribution 93). The comparison view surfaces exactly this High-Compatibility vs
High-Contribution distinction — the demo's core point. ✅

## Screens / components modified

- **Results dashboard** (`/recruiter-upload` results): Team Fit column, Top Team Recommendation
  panel, candidate comparison table, and the candidate drawer's Team Fit breakdown.
```
```
