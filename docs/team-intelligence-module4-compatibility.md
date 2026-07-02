# Team Intelligence — Module 4: Compatibility Engine

Scores how smoothly a `CandidateProfile` **fits** a `TeamDNA`, across six axes, as a
`CompatibilityScore`. (Net-new value / redundancy is Module 5's job — not here.)

## Files touched (all inside `src/engines/team-intelligence/`)

| File | Change |
|------|--------|
| `compatibility.ts` | **Implemented** — 6-axis scorer + blend + confidence |
| `types.ts` | `CompatibilityAxis` union realigned to the 6 required axes |
| `index.ts` | Barrel — exports `scoreCompatibility`, `DEFAULT_COMPATIBILITY_CONFIG` |

**Untouched:** `matching.ts`, `lib/embeddings.ts`, `rank-candidates/route.ts`, `analyze/route.ts`.

## Contract compliance (Module 1)

- Implements the Module-1 `ScoreCompatibility` signature. A compile-time assertion proves it:
  `export const scoreCompatibilityContract: ScoreCompatibility = scoreCompatibility;`
- Reuses Module-1 shapes: `CompatibilityScore`, `CompatibilityAxisScore`, `CompatibilityConfig`,
  `CompatibilityWeights`, `ConfidenceTier`.
- `CompatibilityAxis` was realigned from the original speculative set to the **six required axes**
  (permitted contract refinement; the axes were interface-only with no runtime dependents).

## Inputs / Output

```ts
scoreCompatibility(
  candidate: CandidateProfile,          // shared, frozen
  candidate_id: string,
  teamDna: TeamDNA,                     // Module 3
  teamEmbedding: TeamEmbedding | null,  // Module 1
  config = DEFAULT_COMPATIBILITY_CONFIG,
  candidateVector?: number[] | null,    // optional — enables the semantic axis
): CompatibilityScore
```

`candidateVector` is an **optional extra param** (the Module-1 signature carries no candidate
vector). Adding an optional trailing param keeps the function assignable to `ScoreCompatibility`
while letting the semantic axis run when a vector is available.

## The six axes

| Axis | How it's computed (domain-agnostic) | Signal source |
|------|--------------------------------------|---------------|
| **skill_alignment** | Confidence-weighted coverage of `TeamDNA.skills` by candidate skills/tools/frameworks/cloud/db/specializations | term match (equality or containment) |
| **domain_alignment** | Weighted coverage of `TeamDNA.domains` by candidate `domain_keywords` + specializations + role families | term match |
| **seniority_alignment** | Band-ordinal similarity: candidate band (from `seniority_level`, or inferred from `years_experience`) vs team's weighted-mean band; blended with years-of-experience similarity when both sides expose years | ordinal distance |
| **leadership_alignment** | Altitude similarity `1 − |candIntensity − teamIntensity|` from candidate leadership/ownership booleans vs team leadership signal strength | boolean + signal confidence |
| **work_style_alignment** | Weighted coverage of `TeamDNA.work_style_signals` by work-style tokens inferred from `work_mode`, communication tier, mentoring/community, ownership, and archetype | term match |
| **semantic_alignment** | `cosine(candidateVector, teamEmbedding.vector)`, floored at 0.25 then normalised (mirrors the live engine); raw cosine stored in `semantic_similarity` | embeddings (optional) |

No hardcoded domain skill list is used anywhere — matching is purely lexical over the signals
Module 3 already extracted, so the engine works identically for software, finance, healthcare,
legal, security, and data science.

## Blending & confidence

- Only axes **with real signal** contribute to the weighted blend; axes that fall back to a
  neutral 50 (e.g. team has no domains, or seniority unknown on one side) are shown for
  transparency but **excluded from weighting**, so a missing axis never silently deflates the score.
- `overall = Σ(score · weight) / Σ(weight over signal-bearing axes)`.
- Default weights: skill 0.28, semantic 0.22, domain 0.15, seniority 0.15, leadership 0.10,
  work-style 0.10.
- `confidence` (tier) = `clamp01(teamDna.overall_confidence·0.5 + signalCoverage·0.5)` bucketed to
  high / medium / low / insufficient. `insufficient` when no axis had signal.

## Graceful degradation (never throws)

- The whole axis computation is wrapped in try/catch; a mid-way failure keeps the axes computed so
  far and still returns a valid `CompatibilityScore`.
- Semantic axis is skipped cleanly when `use_semantic_axis` is false, the team embedding is
  missing/`degraded`, or no candidate vector is supplied → `semantic_similarity: null`.
- Empty/low-signal `TeamDNA` yields neutral axes + `confidence: "insufficient"`, not an error.

## Verified behaviour (Healthcare team)

| Candidate | overall | skill | domain | seniority | leadership | work-style | semantic |
|-----------|:------:|:-----:|:------:|:---------:|:----------:|:----------:|:--------:|
| Strong fit (FHIR/HL7, senior, remote) | **77** | 67 | 67 | 90 | 76 | 100 | — |
| Weak fit (Java/Spring, junior, onsite, fintech) | **25** | 0 | 0 | 45 | 76 | 50 | — |
| Strong fit + semantic (cos 0.99) | **82** | 67 | 67 | 90 | 76 | 100 | 99 |

Clear separation between fit and non-fit; the semantic axis lifts a genuinely-aligned candidate.

## Data flow

```
CandidateProfile ─┐
                  ├─▶ scoreCompatibility()
TeamDNA ──────────┤        ├─ skill / domain / work-style : weighted signal coverage
TeamEmbedding? ───┤        ├─ seniority                    : band-ordinal + years similarity
candidateVector? ─┘        ├─ leadership                   : intensity altitude similarity
                           └─ semantic                     : cosine (optional)
                                    │  weighted blend (signal-bearing axes only)
                                    ▼
                           CompatibilityScore { overall, axes[], semantic_similarity, confidence }
                                    │
                                    ▼  (Module 5) Contribution + (orchestrator) TeamAnalysisResult
```
```
```
