# Team Intelligence — Module 5: Contribution Engine

Compatibility asks **"will they fit?"**. Contribution asks **"what will they ADD?"** — the net-new
value a candidate brings beyond the team's existing capabilities.

Input: `CandidateProfile` + `TeamDNA` → Output: `ContributionScore` (Module 1 contract).

## Files changed (all inside `src/engines/team-intelligence/`)

| File | Change |
|------|--------|
| `contribution.ts` | **Implemented** — 3-axis net-new scorer + item breakdown |
| `index.ts` | Barrel — exports `scoreContribution`, `DEFAULT_CONTRIBUTION_CONFIG` |

`ContributionConfig` was **extended** with an axis-`weights` object while keeping the Module-1
fields (`gap_fill_weight`, `redundancy_penalty`). **No protected file modified**
(`matching.ts`, `lib/embeddings.ts`, `rank-candidates/route.ts`, `analyze/route.ts`).

## Contract compliance (Module 1)

Compile-time proof that the implementation satisfies the contract:
`export const scoreContributionContract: ScoreContribution = scoreContribution;`
Reuses `ContributionScore`, `ContributionItem`, `CompositionEffect`, `ConfidenceTier`.

## Scoring methodology

Every candidate capability (skills + tools + frameworks + cloud + databases + specializations +
domain keywords, de-duplicated) is classified **once** against the team's Module-3 signals:

| Candidate capability matches… | Effect | Counts as |
|-------------------------------|--------|-----------|
| a team **gap** (`TeamDNA.gaps`) | `diversifies` | gap fill (net-new) |
| a team **strength** (`TeamDNA.strengths`) | `reinforces` | overlap |
| a team **skill** (non-strength) | `redundant` | overlap |
| **nothing** on the team | `diversifies` | net-new |

Matching is domain-agnostic term matching (normalise → equality or containment) over the signals
Module 3 already extracted — **no hardcoded skill list**, so it works identically for software,
finance, healthcare, legal, security, and data science.

### Axis 1 — Gap Coverage
Confidence-weighted fraction of `TeamDNA.gaps` the candidate covers:
`gapScore = Σ(conf of covered gaps) / Σ(conf of all gaps)`.
Weighting by gap confidence means filling a *clearly-stated* gap ("thin on ML") counts more than a
faintly-signalled one. Covered gap labels are returned in `fills_gaps`.

### Axis 2 — Unique Strengths
Net-new capabilities (matching neither team skills nor strengths) measured with **saturating**
returns — "does the candidate bring genuinely new capability?":
`uniqueScore = 1 − e^(−netNewCount / 1.5)` → 1 new ≈ 0.49, 2 ≈ 0.74, 3 ≈ 0.86.

### Axis 3 — Expertise Diversity
Breadth added to the team's capability **surface** — "how much do they expand it?":
`diversity = min(1, netNewCount / teamSkillCount)` (relative expansion), or
`min(1, netNewCount / 5)` when the team is too sparse to have a skill baseline.

## Weighting — Team Expansion Value (overall)

```
overall = Σ(axisScore · weight) / Σ(weight)      # over signal-bearing axes only
```

Default weights: **Gap Coverage 0.45, Unique Strengths 0.30, Expertise Diversity 0.25**
(gap coverage is weighted highest — filling a declared hole is the most valuable contribution).
`gap_fill_weight` further scales the gap axis.

## Assumptions & design choices

- **Redundancy never penalises.** `redundancy_penalty` defaults to `0`. Overlaps are *recorded*
  (`overlaps`, and `redundant`/`reinforces` items) but do not subtract — the score reflects
  net-new value, and absence of it (not presence of overlap) is what keeps a score low.
- **Missing signals never penalise.** An axis with no signal (e.g. team has no identified gaps,
  or the candidate has no parsed skills) is **excluded from the blend**, not scored as 0. Only
  `confidence` drops.
- **Confidence-aware:** `confidence = clamp01(TeamDNA.overall_confidence·0.5 + signalCoverage·0.5)`
  bucketed to high / medium / low / insufficient (`insufficient` when no axis had signal).
- **Never throws:** all work is wrapped in try/catch; a mid-way failure returns whatever was
  computed as a valid `ContributionScore`.
- **Gap-fills double-count intentionally** across Gap Coverage and the net-new axes — they answer
  different questions ("did they fill declared holes?" vs "do they bring capability the team
  lacks?"), and the overall is a weighted *blend*, not a sum, so no inflation results.

## Validation results

Team: *"Backend platform team… Node.js, PostgreSQL, Kafka, Docker, Kubernetes, AWS, REST APIs,
microservices. Strong in cloud infrastructure. Thin on machine learning and light on data
analytics."* → gaps: **machine learning, data analytics**.

| Candidate | Capabilities | overall | fills_gaps | overlaps |
|-----------|--------------|:------:|-----------|----------|
| **Strong** | ML, Data Analytics, Python, Data Engineering, Spark | **99** | machine learning, data analytics | — |
| **Average** | Python, Data Analytics, Docker | **61** | data analytics | — |
| **Low** | Node.js, PostgreSQL, AWS, Kubernetes | **30** | — | Node.js, AWS |

Clear separation: the strong contributor fills both declared gaps and adds breadth; the average
fills one; the low contributor mostly overlaps and adds little net-new.

## Known limitation (Module 3 recall, not a Module-5 bug)

In the low-contributor case, `PostgreSQL`/`Kubernetes` were treated as net-new because Module 3's
cue-span extraction currently truncates long comma-lists and aborts spans on dotted tokens
(`Node.js`), so those terms didn't enter `TeamDNA.skills`. Contribution scored correctly against
the DNA it was given; improving multi-item cue-list recall is a Module-3 follow-up. The effect is
conservative (a low contributor is slightly *over*-credited, never wrongly penalised).

## Data flow

```
CandidateProfile ─┐
                  ├─▶ scoreContribution()
TeamDNA ──────────┘        ├─ classify each capability vs gaps / strengths / skills
                           ├─ Gap Coverage      : confidence-weighted gap fill
                           ├─ Unique Strengths   : saturating net-new count
                           ├─ Expertise Diversity: net-new / team breadth
                           └─ weighted blend (signal-bearing axes) → Team Expansion Value
                                    ▼
                     ContributionScore { overall, fills_gaps, overlaps, items[], confidence }
                                    ▼  (orchestrator) CandidateTeamFit → TeamAnalysisResult
```
```
```
