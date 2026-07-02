# Team Intelligence — Module 6: Orchestrator

Wires the whole engine into one executable pipeline and returns a `TeamAnalysisResult`.
Satisfies the Module-1 `RunTeamIntelligence` contract exactly. Never throws.

## Files changed (all inside `src/engines/team-intelligence/`)

| File | Change |
|------|--------|
| `orchestrator.ts` | **New** — pipeline, config, two entry points, blend |
| `index.ts` | Moved `RunTeamIntelligence`/`CandidateForTeam` into orchestrator; re-exports it + `runTeamIntelligence`, `runTeamIntelligenceFromFiles`, `DEFAULT_ORCHESTRATOR_CONFIG` |

**No protected file modified** (`matching.ts`, `lib/embeddings.ts`, `rank-candidates/route.ts`,
`analyze/route.ts`). The `RunTeamIntelligence`/`CandidateForTeam` types were relocated (not changed)
from `index.ts` to `orchestrator.ts` to avoid an import cycle; `index.ts` re-exports them, so the
public API is unchanged.

## Entry points

```ts
// Module-1 contract (text / pre-parsed profiles)
runTeamIntelligence(team: TeamParserInput, candidates: CandidateForTeam[], config?)
  : Promise<TeamAnalysisResult>

// File-upload variant (Step 1 = parseTeamFiles)
runTeamIntelligenceFromFiles(teamFiles: File[], candidates: CandidateForTeam[], config?)
  : Promise<TeamAnalysisResult>
```

Contract compliance is proven at compile time:
`export const runTeamIntelligenceContract: RunTeamIntelligence = runTeamIntelligence;`
The optional trailing `config` keeps the function assignable to the 2-arg contract type.

> **Why two entry points?** The Module-1 contract input is `TeamParserInput`, while the task's
> Step 1 is `parseTeamFiles()` (File[]). Both funnel into one shared `runPipeline()` core, so the
> exact contract is honoured *and* the file-upload flow is supported.

## Execution flow

```
Entry (TeamParserInput | File[])
   │  Step 1: parseTeamDocument() / parseTeamFiles()   → TeamDocument
   ▼
runPipeline(TeamDocument, candidates, config):
   │  Step 2: deriveTeamDNA()                          → TeamDNA
   │  Step 3: embedTeamAndCandidates(dna, cands, backend)
   │            └─ backend.embed([teamText, ...candTexts]) in ONE call
   │            → TeamEmbedding (+ per-candidate vectors)   [degraded if no backend]
   │  Step 4: for each candidate (isolated try/catch):
   │            scoreCompatibility(profile, dna, teamEmbedding, candVector)
   │            scoreContribution(profile, dna)
   │            → CandidateTeamFit { team_fit_score, summary }
   │  Rank: team_fit_score desc → compatibility desc → id
   ▼
TeamAnalysisResult { team_id, team_dna, candidates[], degraded, warnings[] }
```

Embedding text is **synthesised** (team = DNA skills+domains+strengths; candidate = title+skills+
domains), not raw document text — a focused representation, mirroring how the live engine embeds
JD *terms* rather than posting boilerplate. Team + all candidates are embedded in a **single**
backend call.

## Overall team fit — weighting

```
team_fit_score = round( (w_c · compatibility.overall + w_k · contribution.overall) / (w_c + w_k) )
default weights: compatibility 0.6, contribution 0.4   (configurable via config.weights)
```

**Rationale:** compatibility is the primary hiring gate — a brilliant addition who cannot integrate
with the team is a poor hire, so fit is weighted higher (0.6). Contribution (0.4) then differentiates
*among* candidates who fit: given two people who can integrate, prefer the one who fills the team's
gaps and adds net-new capability. The weights are normalised by their sum, so any positive pair is
valid (e.g. `{0.5, 0.5}` or `{0.7, 0.3}`).

The field is named `team_fit_score` to match the Module-1 `CandidateTeamFit` contract (the task's
example used `overall_team_fit`; the schema value is `team_fit_score`).

## Failure handling (never throws)

| Failure | Behaviour |
|---------|-----------|
| Team files fail to parse | Module 2 already degrades → `TeamDocument` with warnings; pipeline continues, `degraded: true` |
| Empty team text | DNA is empty, candidates still scored (neutral), `degraded: true`, warnings surfaced |
| No / failing embedding backend | `TeamEmbedding.degraded = true`, candidate vectors null → semantic axis skipped; other axes unaffected |
| One candidate's scoring throws | That candidate returns a **zeroed** `CandidateTeamFit` with a warning; other candidates unaffected |
| Anything else | `fatalFallback()` returns a valid, degraded `TeamAnalysisResult` |

All stage warnings are namespaced (`[parse]`, `[dna]`, `[candidate <id>]`, `[fatal]`) and
accumulated into `TeamAnalysisResult.warnings`. `degraded` = empty team text OR embedding degraded
OR zero DNA confidence.

## Performance

No parallelism (candidates scored sequentially), no BGE-M3, no infrastructure — clean orchestration
only, per spec. The single-call batch embedding is the one efficiency already inherent in the design,
not an added optimisation.

## Validation results

**Team:** *"Backend platform team of 6… Node.js, Kafka, Docker, Kubernetes, AWS, REST APIs,
microservices. Strong in cloud infrastructure. Senior engineers led architecture. Thin on machine
learning and light on data analytics."* → gaps: **machine learning, data analytics**.
Role: *ML-capable Backend Engineer*. Mock semantic backend enabled.

| Rank | Candidate | Compatibility | Contribution | **team_fit_score** | Semantic |
|:----:|-----------|:-------------:|:------------:|:------------------:|:--------:|
| **#1** | Asha — backend **+ ML/analytics** | 52 | 99 | **71** | 0.64 |
| **#2** | Ben — backend only | 78 | 30 | **59** | 1.00 |
| **#3** | Cara — frontend/design | 14 | 50 | **28** | 0.00 |

**Ranking makes sense — and demonstrates the whole thesis:**
- Ben has the **highest compatibility** (78) — he mirrors the team's existing stack — but the
  **lowest contribution** (30) because he only overlaps what the team already has.
- Asha fits slightly *less* on paper (52) yet ranks **#1**, because she fills both stated gaps
  (contribution 99). For an "ML-capable Backend Engineer" role, that is exactly right: *will they
  fit?* favours Ben; *what will they add?* favours Asha; the blend correctly prefers Asha.
- Cara (frontend) is a poor fit and ranks last.

**Degradation test:** empty team text + no backend → `degraded: true`, warnings
`[parse] No raw text…`, `[dna] no usable team text…`, and **all 3 candidates still scored**
(no throw).

## Example output (shape)

```jsonc
{
  "team_id": "team_…",
  "team_dna": { "skills": [...], "gaps": [{ "label": "machine learning", ... }], ... },
  "candidates": [
    {
      "candidate_id": "A_backend_ml",
      "candidate_name": "Asha",
      "compatibility": { "overall": 52, "axes": [...], "semantic_similarity": 0.64, "confidence": "high" },
      "contribution":  { "overall": 99, "fills_gaps": ["machine learning","data analytics"], "overlaps": [], "items": [...], "confidence": "high" },
      "team_fit_score": 71,
      "summary": "Team fit 71/100 (compatibility 52, contribution 99). Fills machine learning, data analytics."
    }
    // … ranked by team_fit_score desc
  ],
  "degraded": false,
  "warnings": []
}
```
```
```
