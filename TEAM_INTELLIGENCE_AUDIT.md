# TEAM_INTELLIGENCE_AUDIT.md

> Architecture audit of the **PeakMinds Talent Intelligence Platform** recruiter-upload flow.
> Read-only audit — no code was modified. Purpose: understand the system end-to-end and
> classify every file into `SAFE_TO_MODIFY` vs `DO_NOT_TOUCH` before any feature work begins.

---

## 0. TL;DR

- The **live** recruiter flow is small and self-contained: **browser-side file parsing** → **one API route** (`/api/rank-candidates`) → **two shared scoring libs** (`matching.ts` + `embeddings.ts`) → **one dashboard component**.
- There is **no database**. All persistence is file-based (challenge artifacts) or in-memory (per-request). The `data/` and `services/ranking-engine/` trees are the offline challenge submission, not a runtime DB.
- A large **16-stage `candidate-v2` / `recruiter-v2` engine scaffold** exists under `src/engines/` but is **NOT wired into any route or page**. It is dormant future architecture.
- The **Top 100 page** renders the actual challenge submission data (`top100data.ts`) — this is the graded deliverable and is treated as immutable.

---

## 1. Current Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (Next.js client)                          │
│                                                                                │
│   /recruiter-upload page                                                       │
│   └─ RecruiterUploadClient.tsx                                                  │
│        ├─ JD upload  ──────▶ lib/extraction.ts  (PDF/DOCX/TXT/IMG → text)       │
│        │                     (pdfjs, mammoth, tesseract — all client-side)      │
│        ├─ CSV/XLSX upload ─▶ lib/dataset.ts     (parse + column-map)            │
│        │                     (native CSV parser, lazy SheetJS for xlsx)         │
│        └─ "Run PeakMinds" ─▶ POST /api/rank-candidates  { jd, candidates[] }    │
│                                          │                                      │
│   /candidate-review page                 │                                     │
│   └─ CandidateReviewClient.tsx           │                                     │
│        └─ POST /api/analyze { jd, resume }│ (single-candidate; LLM path)        │
└──────────────────────────────────────────┼─────────────────────────────────────┘
                                            │  (JSON over HTTP)
┌───────────────────────────────────────────▼────────────────────────────────────┐
│                        SERVER (Next.js route handlers, runtime="nodejs")         │
│                                                                                  │
│   app/api/rank-candidates/route.ts        app/api/analyze/route.ts               │
│        │                                        │                                │
│        ├─ extractJdTerms() ◀────────────────────┤   (shared)                     │
│        ├─ scoreResumeAgainstTerms() ◀───────────┤   lib/matching.ts              │
│        ├─ embedTexts()/cosineSim() ─────────────┘   lib/embeddings.ts            │
│        │        │                                   (Xenova all-MiniLM-L6-v2)    │
│        │        └─ instrumentation.ts pre-warms this model at server boot        │
│        └─ returns { ranked[], summary }             analyze also calls Claude    │
│                                                     (@anthropic-ai/sdk, Haiku)   │
└──────────────────────────────────────────┬───────────────────────────────────────┘
                                            │  (JSON)
┌───────────────────────────────────────────▼────────────────────────────────────┐
│                              BROWSER — rendering                                 │
│   ResultsDashboard.tsx  (table, sort, paginate, drawer, CSV/PDF export)          │
└──────────────────────────────────────────────────────────────────────────────────┘

     ═══════════════ NOT ON THE LIVE PATH (dormant / static) ═══════════════
   src/engines/candidate-v2/**   16-stage understanding pipeline  → unused
   src/engines/recruiter-v2/**   jd-understanding/matching/ranking → unused
   src/engines/shared/**         types, schemas, prompts, utils     → unused by routes
   /top-100 page + lib/top100data.ts   static challenge submission (graded output)
   /architecture, /why-peakminds      marketing/explanatory pages
   data/**, services/ranking-engine/** offline Python submission pipeline + artifacts
```

---

## 2. Current Upload Flow (recruiter)

Two independent uploads on the **same page**, both handled **entirely in the browser** before any network call:

### 2a. JD Upload
1. User drops/selects a file or pastes text into `UploadCard` (JD variant).
2. `RecruiterUploadClient.handleJdFile()` → `extractFromFile(file)` in `lib/extraction.ts`.
3. Extraction dispatches by extension:
   - `.txt` → native `File.text()`
   - `.docx` → `mammoth.extractRawText`
   - `.pdf` → `pdfjs-dist` text layer, **OCR fallback** (`tesseract.js`) for scanned PDFs
   - `.png/.jpg/.jpeg/.webp` → `tesseract.js` OCR
4. Output text is normalized + validated (min length, corruption heuristic). State → `ready`, text held in React state (`jdText`).

### 2b. Candidate CSV/XLSX Upload
1. User selects `.csv/.xlsx/.xls` in the second `UploadCard`.
2. `handleDsFile()` → `parseDataset(file)` in `lib/dataset.ts`.
3. `.csv` uses a hand-rolled RFC-4180-ish parser; `.xlsx/.xls` lazy-loads SheetJS (`xlsx`).
4. Headers are fuzzy-mapped to canonical fields `{ name, resume, skills, experience }` via `COLUMN_MAP` synonyms; missing columns produce non-fatal **warnings** shown in the UI.
5. Rows → `DatasetCandidate[]` held in React state (`candidates`). Resume falls back to `skills + experience` when no resume column exists.

Both uploads are gated: the **Run** button appears only when `jdState === "ready" && dsState === "ready"`.

---

## 3. Backend Processing Flow

### 3a. Batch ranking — `POST /api/rank-candidates` (the live recruiter path)
1. Validate body: `jd` (≥50 chars) and non-empty `candidates[]`.
2. `extractJdTerms(jd)` — section-aware, weighted, entity-filtered, tech-boosted term extraction (≤25 terms, ≥60% technical, floor 8).
3. Build one `haystack` string per candidate (`resume . skills . experience`).
4. **Semantic scoring:** `embedTexts([jdTerms.join(" "), ...haystacks])` via all-MiniLM-L6-v2; `cosineSim` of JD vector vs each candidate. Wrapped in try/catch → **graceful keyword-only fallback** on any failure.
5. `scoreResumeAgainstTerms(haystack, jdTerms, semanticSim)` per candidate:
   - exact substring match + lemmatised (stemmed) match + semantic bonus (≤40 pts)
   - returns `{ score, matched[], missing[], verdict }`
6. Build `note` (one-line recruiter summary) + `semanticEvidence` (top-3 topically relevant resume sentences).
7. Sort by `score DESC, name ASC`; assign `rank`. Compute `summary { total, qualified(≥60), avgScore, topCandidate, semanticEnabled }`.

### 3b. Single-candidate analysis — `POST /api/analyze` (candidate-review path)
1. Validate `jd` + `resume` (≥50 chars each).
2. If `ANTHROPIC_API_KEY` set → `callClaude()` with a strict JSON-schema prompt (model `claude-haiku-4-5-20251001`), **validated + retried once**.
3. On any failure (or no key) → `deterministicFallback()` reusing `matching.ts` (`extractJdTerms` + `scoreResumeAgainstTerms`) with weak-word filtering.

### 3c. Model warmup — `instrumentation.ts`
- Next.js `register()` hook pre-loads the ~90 MB MiniLM model at server boot so the first real request doesn't cold-start into keyword-only fallback. Cached in module scope in `embeddings.ts`.

---

## 4. Ranking Flow (scoring math — `lib/matching.ts`)

```
extractJdTerms(jd, limit=25)
  ├─ splitJdIntoSections()      section headers → weighted buckets
  ├─ termFrequency() per section (stopwords, acronym allowlist)
  ├─ filters: ENTITY_BLOCKLIST, GENERIC_HIRING_WORDS, heuristic NER (mid-sentence caps)
  ├─ isTechnicalSkill() boost (×1.5) via TECH_SKILLS dictionary
  └─ enforce ≥60% technical, floor of 8 terms

scoreResumeAgainstTerms(resume, jdTerms, semanticSim?)
  ├─ exact match:  resumeLower.includes(term)
  ├─ lemma match:  stemWord(term) ∈ stemFreq(resume)
  ├─ computeScore():
  │     keywordScore  = exact/effTotal*100 + lemmaOnly/effTotal*50
  │     effTotal      = max(12, min(termCount, haystackWords*2))
  │     semanticBonus = max(0,(cos-0.25)/0.75)*40
  │     final         = clamp(0,100, round(keyword + semantic))
  └─ verdictFor(score):  ≥75 Strong · ≥60 Interview · ≥44 Borderline · else Not Competitive
```

Both API routes share this exact engine, so scoring is **consistent across single and batch** paths.

---

## 5. Frontend Files Involved

### Live recruiter/candidate flow
| File | Role |
|------|------|
| `app/recruiter-upload/page.tsx` | Route shell → renders client |
| `components/recruiter/RecruiterUploadClient.tsx` | JD + CSV upload orchestration, Run trigger, state |
| `components/recruiter/ResultsDashboard.tsx` | Ranked table, sort/filter/paginate, drawer, CSV/PDF export |
| `components/shared/UploadCard.tsx` | Reusable drag-drop / paste upload widget |
| `components/shared/score-display.tsx` | `ScoreRing`, `SpinnerIcon`, verdict badge, download icons |
| `components/workspace/SearchBar.tsx` | Search input reused in the dashboard |
| `app/candidate-review/page.tsx` + `components/candidate-review/CandidateReviewClient.tsx` | Single-resume analysis UI (`/api/analyze`) |

### Static / marketing / static-data pages
| File | Role |
|------|------|
| `app/top-100/page.tsx` + `lib/top100data.ts` | **Graded submission output** rendered as a table |
| `components/top100/ComparePanel.tsx` | Compare two finalists |
| `app/architecture/page.tsx`, `app/why-peakminds/page.tsx`, `app/page.tsx` | Marketing / explanatory |
| `components/hero/**`, `components/challenge/**`, `components/engineering/**`, `components/navigation/**` | Landing-page sections + nav |
| `components/workspace/**` (except SearchBar) + `candidates.generated.ts` | Static workspace demo data/components |
| `layout.tsx`, `globals.css`, `styles/**`, `lib/design-tokens.ts`, `lib/motion.ts` | Global shell, theming, animation tokens |

---

## 6. Backend Files Involved

| File | Role | On live path? |
|------|------|:---:|
| `app/api/rank-candidates/route.ts` | Batch ranking endpoint | ✅ |
| `app/api/analyze/route.ts` | Single-candidate analysis (Claude + fallback) | ✅ |
| `lib/matching.ts` | Core JD-term extraction + scoring engine (shared) | ✅ |
| `lib/embeddings.ts` | MiniLM semantic embeddings + cosine | ✅ |
| `instrumentation.ts` | Boot-time model warmup | ✅ |
| `lib/extraction.ts` | Client-side doc/image → text (browser-only) | ✅ |
| `lib/dataset.ts` | Client-side CSV/XLSX parse + column map | ✅ |
| `lib/analysis-types.ts` | Type guards / schema for `/api/analyze` output | ✅ |
| `lib/resume-analyzer.ts` | Deterministic ML-resume signal engine + `SAMPLE_ANALYSIS` (candidate-review) | ✅ |
| `lib/candidate-review-sample.ts` | Sample data for candidate-review | ✅ |
| `src/engines/candidate-v2/**` | 16-stage understanding pipeline (Stages 0–15) | ❌ dormant |
| `src/engines/recruiter-v2/**` | JD-understanding, matching, ranking, taxonomy | ❌ dormant |
| `src/engines/shared/**` | Types, schemas, prompts, utils (claude-client, skill-vocabulary…) | ❌ dormant |
| `lib/domain-audit.ts` | Dev script — prints `extractJdTerms` across 10 domains | ❌ dev tool |
| `lib/final-validation.js` | Dev/validation script | ❌ dev tool |
| `services/ranking-engine/**` (Python) | Offline challenge pipeline (features, embeddings, rank) | ❌ offline |

---

## 7. Database Models Involved

**None.** There is no database, ORM, or migration layer (`grep` for prisma/drizzle/mongoose/pg/etc. → no matches).

Data “models” are TypeScript shapes + file artifacts:

| Shape / artifact | Where | Meaning |
|------|------|------|
| `DatasetCandidate { name, resume, skills, experience }` | `lib/dataset.ts` | Parsed upload row (in-memory) |
| `RankedCandidate { rank, name, score, experience, verdict, matched[], missing[], note, semanticEvidence[] }` | `lib/matching.ts` | Ranking API response item |
| `MatchResult`, `Summary` | `lib/matching.ts`, route/UI | Scoring + dashboard summary |
| `AnalysisOutput` | `lib/analysis-types.ts` | `/api/analyze` contract |
| `CandidateProfile` (+ stage outputs, enums, sub-types) | `src/engines/shared/types/**` | Rich profile schema for the **dormant** v2 engine |
| `data/candidates.jsonl`, `data/eda/candidate_features.csv` | `data/` | Offline challenge dataset (not read at runtime) |
| `services/ranking-engine/artifacts/*.parquet/.npy/.csv` | `services/` | Offline model artifacts (submission provenance) |
| `lib/top100data.ts` | `lib/` | Final 100-candidate submission rendered by `/top-100` |

---

## 8. File Classification

### ⛔ DO_NOT_TOUCH
*Load-bearing on the live recruiter/analysis path, or a graded submission artifact. Changing these risks breaking working scoring behaviour or altering the deliverable.*

**Core scoring / API (live, shared, high blast radius):**
- `apps/web/src/lib/matching.ts` — the scoring engine; shared by both routes. Any edit changes every score.
- `apps/web/src/lib/embeddings.ts` — semantic component + model caching.
- `apps/web/src/app/api/rank-candidates/route.ts` — the recruiter ranking endpoint.
- `apps/web/src/app/api/analyze/route.ts` — single-candidate endpoint (Claude + fallback contract).
- `apps/web/src/lib/analysis-types.ts` — response schema/type guards for `/api/analyze`.
- `apps/web/src/instrumentation.ts` — boot warmup; silent-fallback behaviour depends on it.

**Upload ingestion (live, correctness-sensitive):**
- `apps/web/src/lib/extraction.ts` — JD/document/image → text.
- `apps/web/src/lib/dataset.ts` — CSV/XLSX parsing + column mapping.

**Graded submission / provenance (immutable deliverable):**
- `apps/web/src/lib/top100data.ts` — the actual Top-100 submission data.
- `data/candidates.jsonl`, `data/eda/**` — offline challenge dataset.
- `services/ranking-engine/**` (Python + `artifacts/**`) — offline submission pipeline & artifacts.
- `submission_metadata.yaml` — submission descriptor.

### ✅ SAFE_TO_MODIFY
*Presentation, dormant scaffolds, dev tooling, and static content. Editable for feature work without risking the live scoring path or the graded output.*

**Presentation (consume the API/data; safe to restyle/extend — keep the response contract intact):**
- `apps/web/src/components/recruiter/RecruiterUploadClient.tsx`
- `apps/web/src/components/recruiter/ResultsDashboard.tsx`
- `apps/web/src/components/shared/UploadCard.tsx`, `score-display.tsx`
- `apps/web/src/components/candidate-review/CandidateReviewClient.tsx`
- `apps/web/src/app/recruiter-upload/page.tsx`, `app/candidate-review/page.tsx`
- `apps/web/src/lib/resume-analyzer.ts`, `lib/candidate-review-sample.ts` (candidate-review demo logic/data)

**Dormant v2 engine (not wired to any route — this is where NEW intelligence work belongs):**
- `apps/web/src/engines/candidate-v2/**`
- `apps/web/src/engines/recruiter-v2/**`
- `apps/web/src/engines/shared/**` (types, schemas, prompts, utils)

**Static content, marketing, workspace demo, theming:**
- `apps/web/src/app/top-100/page.tsx` (UI only — **not** `top100data.ts`), `components/top100/**`
- `apps/web/src/app/architecture/page.tsx`, `app/why-peakminds/page.tsx`, `app/page.tsx`
- `apps/web/src/components/{hero,challenge,engineering,navigation,workspace}/**`
- `apps/web/src/app/layout.tsx`, `globals.css`, `styles/**`, `lib/{design-tokens,motion,top100data-adjacent UI}.ts`

**Dev / validation tooling (not imported by app runtime):**
- `apps/web/src/lib/domain-audit.ts`
- `apps/web/src/lib/final-validation.js`
- `docs/**`

> ⚠️ **Boundary rule:** The **shape** of the `/api/rank-candidates` and `/api/analyze` JSON responses (`RankedCandidate`, `Summary`, `AnalysisOutput`) is the contract between DO_NOT_TOUCH backend and SAFE_TO_MODIFY frontend. UI edits are safe as long as they keep consuming these shapes; changing the shapes means touching both sides and should be treated as a DO_NOT_TOUCH-level change.

---

## 9. Key Observations for Future Work

1. **The v2 engine is the intended home for new intelligence.** Stages 0–15 (`candidate-v2/understanding/**`) and `recruiter-v2/**` are fully scaffolded with types/schemas/prompts but **never invoked**. New features should build here and wire into a route, rather than expanding `matching.ts`.
2. **No persistence.** Every recruiter run is stateless/in-memory. Adding saved searches, history, or auth requires introducing a storage layer that doesn't exist yet.
3. **Graceful degradation is a design invariant.** Embeddings, Claude, and OCR all fall back silently. Preserve this when extending.
4. **The submission (`top100data.ts`, `data/`, `services/`) is frozen.** Treat as read-only evidence of the graded result.
