# Team Intelligence — Module 7: Recruiter Upload Integration

Adds **optional** Team Intelligence to the recruiter upload workflow with **zero regression** and
complete backward compatibility. If no team documents are uploaded, PeakMinds behaves exactly as
before.

## Files changed

| File | Type | Change |
|------|------|--------|
| `components/recruiter/RecruiterUploadClient.tsx` | modified | Team file state + handlers; runs the engine additively after ranking |
| `components/recruiter/ResultsDashboard.tsx` | modified | Optional `teamAnalysis`/`teamWarning` props + compact `TeamIntelligencePanel` |
| `components/recruiter/TeamUploadCard.tsx` | **new** | Multi-file (`teamFiles[]`) PDF/DOCX/TXT upload card, drag-and-drop |
| `lib/team-candidate-adapter.ts` | **new** | Maps recruiter CSV rows (`DatasetCandidate`) → engine `CandidateProfile` |
| `docs/team-intelligence-module7-upload-integration.md` | **new** | This document |

**No protected file modified** — `matching.ts`, `lib/embeddings.ts`, `rank-candidates/route.ts`,
`analyze/route.ts` are all byte-for-byte unchanged (`git diff` = 0 for `embeddings.ts` and
`rank-candidates`; the `matching.ts`/`analyze` diffs pre-existed this work and were never opened).

## Design decisions (zero-regression)

- **Runs entirely client-side.** The engine's scoring is pure TypeScript, and its parser reuses the
  same browser extraction (`lib/extraction.ts` → pdf.js / mammoth) that the JD upload already uses.
  So Team Intelligence runs in the browser after ranking — **no new API route, no change to any
  server route.**
- **UploadCard left untouched.** JD/CSV depend on the single-file `UploadCard`; rather than risk a
  regression by adding multi-file branches to it, a dedicated `TeamUploadCard` was added, reusing the
  same Tailwind vocabulary to match the visual style.
- **Additive orchestrator call.** The existing `fetch("/api/rank-candidates", …)` call and its body
  `{ jd, candidates }` are unchanged. Team Intelligence runs in a **separate try/catch after** the
  ranking result is set, so it can never block or alter candidate ranking.
- **Reuses Module 6 contracts** — `TeamAnalysisResult`, `CandidateTeamFit`, `CompatibilityScore`,
  `ContributionScore` from the engine. No duplicate models created.

## Upload flow (new)

```
1. Upload Job Description        (unchanged)
2. Upload Candidate CSV/XLSX     (unchanged)
3. Upload Team Documents         (NEW — optional, multiple PDF/DOCX/TXT)
4. Run PeakMinds
```

The Team Intelligence card is titled **"Team Intelligence (Optional)"** with the description
*"Upload team documentation to evaluate candidate compatibility and contribution."* It accepts
multiple files via `teamFiles[]`, supports drag-and-drop, lists uploaded files with per-file remove,
and rejects unsupported types with an inline note.

## Integration flow

```
Run PeakMinds
  ├─ POST /api/rank-candidates  { jd, candidates }         ← unchanged production path
  │     → ranked[] + summary  (always rendered)
  └─ if teamFiles.length > 0:                              ← additive
        toCandidatesForTeam(candidates)   // CSV rows → CandidateProfile[]
        runTeamIntelligenceFromFiles(teamFiles, cands)     // Module 6 orchestrator
          → TeamAnalysisResult  → stored in state → dashboard panel
```

The CSV→profile adapter is lightweight (splits the skills column, infers seniority/years and coarse
leadership/work-style keywords) — it does **not** invoke the heavy 16-stage understanding pipeline,
keeping the client-side run fast.

## Fallback behavior

| Situation | Behavior |
|-----------|----------|
| No team files | Team Intelligence never runs; UI + results identical to today |
| Team docs unreadable / parse fails | `runTeamIntelligenceFromFiles` degrades (never throws); `TeamAnalysisResult.degraded = true`; amber warning shown; **candidate ranking unaffected** |
| Engine throws unexpectedly | Caught in the component's try/catch → warning shown, ranking still displayed |
| No semantic backend (current default) | Normal lexical mode — **not** flagged as degraded (no spurious warning). `degraded` is reserved for genuine signal loss (empty team text, failed configured backend, zero-confidence DNA) |

Team Intelligence is strictly **additive** — it renders as an extra panel above the existing ranked
table and never modifies the ranked results.

## Validation results

Executed via the real integration path (CSV rows → adapter → `runTeamIntelligenceFromFiles`, mock
extractor for Node). Team: backend/cloud platform, gaps = *machine learning, data analytics*.

**Case 1 — JD + CSV only:** Team Intelligence block is skipped (`teamFiles.length === 0`); the
`/api/rank-candidates` request/response and dashboard are unchanged. ✅ No regression.

**Case 2 — JD + CSV + Team Docs:** engine executes, `TeamAnalysisResult` generated, `degraded:false`.

| Rank | Candidate | team_fit | compat | contrib | fills |
|:----:|-----------|:-------:|:------:|:-------:|-------|
| #1 | Asha (ML + analytics) | 65 | 47 | 93 | machine learning, data analytics |
| #2 | Ben (backend only) | 52 | 65 | 32 | — |
| #3 | Cara (frontend) | 33 | 27 | 41 | — |

Ranking is sensible and mirrors the engine's thesis (Ben fits best but adds least; Asha fills the
gaps and wins). ✅

**Case 3 — Invalid team docs (extractor throws):** `degraded: true`, warning
`[parse] [bad.pdf] Failed to parse "bad.pdf": corrupt PDF`, **all candidates still scored**, standard
ranking unaffected. ✅

## Screens / components modified

- **Recruiter Upload page** (`/recruiter-upload`) — new optional "Team Intelligence (Optional)"
  upload card below the JD + Candidate Dataset cards.
- **Results dashboard** — new "Team Intelligence — Candidate ↔ Team Fit" panel (team gaps + top
  candidates by team fit) shown only when team docs were analysed; an amber banner when degraded.
```
```
