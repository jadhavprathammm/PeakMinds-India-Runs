# Redrob Candidate Ranking — Team Submission

Hybrid candidate-ranking pipeline for the Redrob Data Challenge India.
Ranks 100k+ candidates for a Senior AI Engineer (retrieval/ranking systems) role.
Final deliverable is a 100-row `submissions/team_redrob.csv` with columns
`candidate_id`, `rank`, `score`, `reasoning`.

---

## Project Overview

The challenge provides a synthetic `candidates.jsonl` of ~100k profiles and asks
for a top-100 ranked shortlist judged on:

```
composite = 0.50 × NDCG@10 + 0.30 × NDCG@50 + 0.15 × MAP + 0.05 × P@10
```

Graded relevance (tier 0–5) mirrors the rubric in `relevance_rubric.md`.
The pipeline is entirely offline at ranking time: no network calls, no GPU,
runs well under the 5-minute compute budget on CPU.

---

## Directory Layout

```
Codes/                          ← submission root (this repo)
├── src/
│   ├── __init__.py
│   ├── features.py             ← per-candidate feature extractor (deterministic)
│   ├── taxonomies.py           ← title / company / location classifiers + KW dictionaries
│   ├── jd_intent.py            ← JD semantic query + positive exemplars
│   ├── scoring.py              ← vectorised S scoring function
│   ├── evaluation.py           ← NDCG / MAP / P@k / composite metric
│   └── reasoning.py            ← grounded reasoning string generator
├── artifacts/                  ← precomputed data products (written by build_* scripts)
│   ├── candidate_features.parquet
│   ├── reasoning_facts.parquet
│   ├── emb_profile.npy         ← (384-d, float32, ~147 MB)
│   ├── emb_career.npy          ← (384-d, float32, ~147 MB)
│   ├── jd_vec.npy
│   └── emb_ids.csv
├── submissions/
│   └── team_redrob.csv         ← final output
├── analysis_outputs/           ← EDA charts and CSVs (not on ranking path)
├── build_features.py           ← Step 1
├── build_embeddings.py         ← Step 2a  (first run; downloads model)
├── finalize_embeddings.py      ← Step 2b  (re-run without re-encoding)
├── fix_twin_flag.py            ← Step 3
├── build_reasoning_facts.py    ← Step 4
├── rank.py                     ← Step 5  (the only step needed for re-scoring)
├── relevance_rubric.md         ← rubric + tier definitions
├── ranking_architecture.md     ← design rationale
├── requirements.txt
│
│   ── EDA / research (not on ranking critical path) ──
├── _featurize_tmp.py           ← legacy EDA feature builder (superseded by src/features.py)
├── _mine_vocab.py              ← vocab/distribution mining
├── _mine_evidence.py           ← evidence keyword + honeypot mining
├── analyze_candidates.py       ← EDA Stage A: stats, correlations
├── analyze_candidates_b.py     ← EDA Stage B: PCA, top indicators, charts
├── quality_score.py            ← EDA Stage C: pillar-based quality score
├── calibrate_thresholds.py     ← tier-cut calibration against S distribution
├── simulate_ranking.py         ← ablation study on a silver (synthetic) gold set
├── build_gold_set.py           ← human-labeling instrument (outputs gold_set_to_label.csv)
└── Working with JSON.ipynb     ← exploratory notebook
```

`Datasets/` is a sibling of `Codes/` (not inside it):

```
Data Challenge India Runs/
├── Codes/          ← this repo
└── Datasets/
    ├── candidates.jsonl
    ├── candidate_features.csv   ← legacy CSV (EDA only; not used by ranker)
    └── ...
```

> **Note:** `Datasets/` is currently referenced by absolute Windows path
> (`D:\Data Challenge India Runs\Datasets\`). If running on a different machine,
> update `DEF_CAND` in `build_features.py` / `build_embeddings.py` /
> `finalize_embeddings.py` / `fix_twin_flag.py` / `build_reasoning_facts.py`
> and `DEF_OUT` / `ART` in those same files before rebuilding.

---

## Installation

```bash
pip install -r requirements.txt
```

Requires **Python 3.13**. CPU-only; no GPU needed.

The sentence-transformer model (`sentence-transformers/all-MiniLM-L6-v2`) is
downloaded from HuggingFace Hub on the first run of `build_embeddings.py`.
All subsequent steps are fully offline.

---

## Architecture

```
candidates.jsonl
      │
      ▼
build_features.py  ──(src/features.py, src/taxonomies.py)──►  candidate_features.parquet
      │                                                              │
      ▼                                                              ▼
build_embeddings.py  ─(all-MiniLM-L6-v2)──► emb_*.npy     candidate_features.parquet
      │                                      jd_vec.npy     (+ semantic_fit merged)
      │ (or finalize_embeddings.py if .npy already exist)
      ▼
fix_twin_flag.py  ──────────────────────────────────────►  candidate_features.parquet
      │                                                     (+ twin_flag corrected)
      ▼
build_reasoning_facts.py  ──────────────────────────────►  reasoning_facts.parquet
      │
      ▼
rank.py  ──(src/scoring.py, src/reasoning.py)──────────►  submissions/team_redrob.csv
```

The rubric identifies five tiers (0–5). The score `S` is a continuous surrogate
for tier; `S ≥ 0.80` → Tier 5 (elite), down to `S < 0.15` → Tier 0.
Honeypots and structural twins are set to `S = -1` and excluded from the top 100.

---

## Feature Engineering Pipeline

**Script:** `build_features.py`  
**Module:** `src/features.py`, `src/taxonomies.py`  
**Output:** `artifacts/candidate_features.parquet`

Processes `candidates.jsonl` line-by-line (pure Python, no RAM spike) and
extracts ~70 deterministic features per candidate, grouped into eight pillars:

| Pillar | Key features |
|--------|-------------|
| **A. Identity / Experience** | `yoe`, `n_jobs`, `avg_tenure_months`, `n_short_stints` |
| **B. Role fit** | `current_title_class` (core_ml / ml_adjacent / swe_generic / non_eng), `applied_ml_years`, `n_core_ml_jobs` |
| **C. IR / ML evidence** | `evid_strong_ir`, `evid_med_ml`, `evid_weak_hype`, `evid_eval`, `evid_deploy`, `evid_scale`, `domain_nlp_ir`, `domain_cv` — keyword counts from summary + all job descriptions |
| **D. Product vs Services** | `product_ratio`, `services_ratio`, `all_jobs_services`, `current_company_class` |
| **E. Pre-LLM depth** | `has_pre_llm_ml`, `earliest_ml_year`, `ai_evidence_recent_only` |
| **F. Location / Logistics** | `location_tier` (A/B/C/D), `location_score`, `notice_score`, `willing_to_relocate` |
| **G. Availability** | `activity_recency_score`, `avail_modifier` (0.50–1.10; caps score for inactive candidates) |
| **H. Trust** | `profile_completeness_score`, `verified_email`, `verified_phone`, `linkedin_connected`, `github_activity_score`, `best_edu_tier` |
| **I. Honeypot flags** | `honeypot_flag` — set when any hard consistency contradiction is detected (expert skill at 0 months, max tenure > career length, impossible dates, etc.) |
| **J. Gate booleans** | `gate_services_only`, `gate_research_only`, `gate_cv_primary`, `gate_recent_llm_only`, `gate_wrong_role_stuffer` |

`ref_date` ("today") is anchored to the latest `last_active_date` in the data
(not `datetime.now()`) so the pipeline is deterministic across runs.

`semantic_fit` is initialised to `NaN` here and filled by Step 2.

---

## Embedding Pipeline

**Scripts:** `build_embeddings.py` (Step 2a — first run), `finalize_embeddings.py` (Step 2b — re-run)  
**Model:** `sentence-transformers/all-MiniLM-L6-v2` (384-d, CPU)  
**Outputs:** `artifacts/emb_profile.npy`, `artifacts/emb_career.npy`, `artifacts/jd_vec.npy`, `artifacts/emb_ids.csv`

Two text channels are encoded per candidate:

- **Profile:** `headline + ". " + summary`
- **Career:** concatenation of all `career_history[].description` fields

The JD query vector is the L2-normalised mean of the JD intent document (`src/jd_intent.py:JD_INTENT`) plus a set of 5 positive role exemplars (`JD_EXEMPLARS`).

```
semantic_cosine = 0.4 × cos(emb_profile, jd_vec)
                + 0.6 × cos(emb_career,  jd_vec)
```

`semantic_fit = percentile_rank(semantic_cosine)` — a [0, 1] normalised score
used in the S formula. Career descriptions are weighted more heavily (0.6)
because profile summaries in this dataset exhibit heavy keyword-templating.

**`finalize_embeddings.py`** reloads the saved `.npy` files and merges a
clean `semantic_fit` into the parquet without re-encoding. Use this for any
re-merge after schema changes without paying the encoding cost again.

> The `.npy` files are the expensive precomputation. Once built, `rank.py`
> reads them indirectly via the merged parquet column and never touches them.

---

## Hybrid Retrieval

**Built into:** `build_embeddings.py` (Step 2a), `finalize_embeddings.py` (Step 2b) — analysis sections  
**Used in:** `src/scoring.py`

Three retrieval modes are compared during development (not at submission time):

| Mode | Formula |
|------|---------|
| Keyword-only | `0.5 × title_weight + 0.5 × kw_evidence` |
| Semantic-only | `semantic_cosine` percentile rank |
| **Hybrid (used)** | `(0.55 × semantic_fit + 0.45 × keyword_score) × avail_modifier` |

Hybrid outperforms either alone on core-ML precision, retrieval-evidence rate,
and noise exclusion in ablation (`simulate_ranking.py`).

Twin / duplicate detection also runs here: candidates with identical structural
profiles (career sequence + skill multiset + signal vector) are flagged
`twin_flag = True` and excluded from the top 100. The **authoritative**
twin-detection logic is in `fix_twin_flag.py` (Step 3); the versions in Steps
2a/2b are superseded.

---

## Ranking Engine

**Script:** `rank.py`  
**Module:** `src/scoring.py`  
**Input:** `artifacts/candidate_features.parquet`  
**Output:** `submissions/team_redrob.csv`

### Fit score (S_fit)

`S_fit` is a weighted sum of seven sub-scores, each in [0, 1]:

| Sub-score | Weight | Key inputs |
|-----------|--------|------------|
| `sc_role` | 0.42 | `title_fit` (30%) + `semantic_fit` (40%) + `evid_score` (30%) |
| `sc_exp` | 0.18 | `years_band` centred at 7 yrs (Gaussian) + `applied_ml_years` + `evid_scale` |
| `sc_prod` | 0.12 | `product_ratio`, `current_is_ai_product`, github/cert external validation |
| `sc_prellm` | 0.08 | `has_pre_llm_ml`, `applied_ml_years`, `evid_med_ml` |
| `sc_loc` | 0.08 | `location_score` (A/B/C/D tier), `notice_score`; relocation bonus for tier-C |
| `sc_tenure` | 0.07 | `avg_tenure_months`, `n_short_stints` hop-penalty |
| `sc_trust` | 0.05 | `profile_completeness_score`, `verified_email`, `verified_phone`, `linkedin_connected` |

### Availability modifier

```
S = S_fit × avail_modifier     (avail_modifier ∈ [0.50, 1.10])
```

`avail_modifier` is a function of recency of platform activity, recruiter
response rate, and open-to-work flag. Strong but inactive candidates are
down-weighted, not excluded.

### Hard gates

Five gates apply a multiplicative S penalty **and** cap the tier ceiling:

| Gate | Penalty | Tier cap |
|------|---------|----------|
| `gate_wrong_role_stuffer` | ×0.10 | 1 |
| `gate_services_only` | ×0.50 | 1 |
| `gate_research_only` | ×0.60 | 1 |
| `gate_cv_primary` | ×0.60 | 2 |
| `gate_recent_llm_only` | ×0.60 | 2 |

Gates are additive (a candidate can hit multiple). `honeypot_flag` and
`twin_flag` force `S = -1` (excluded).

### Tier assignment

```
S ≥ 0.80 → Tier 5    (elite — top ~0.25%)
S ≥ 0.62 → Tier 4
S ≥ 0.45 → Tier 3
S ≥ 0.30 → Tier 2
S ≥ 0.15 → Tier 1
S <  0.15 → Tier 0
```

Tier is also capped by any active gate.

### Tie-breaking

Scores are rounded to 6 decimal places, then sorted `[score DESC, candidate_id ASC]`
to produce a deterministic, validator-compliant ordering.

---

## Reasoning Engine

**Module:** `src/reasoning.py`  
**Input:** feature row dict + `artifacts/reasoning_facts.parquet` (precomputed top skills + current-role snippet)

Each top-100 entry gets a one-sentence, grounded `reasoning` string. The
generator is rule-based (no LLM) — every claim derives directly from a
feature value, preventing hallucination.

Structure:

```
{Lead}: {title}, {exp_phrase}; {positive_1}; {positive_2}; {positive_3}.
{Closer}: {honest_concern}.
```

- **Lead / Closer** vocabulary varies by rank band: `"Top pick:" / "Concern:"` (ranks 1–20),
  `"Strong fit:" / "Watch:"` (21–60), `"Solid fit:" / "Caveat:"` (61–100).
- **Positives** are drawn in priority order from: shipped ranking systems, retrieval evidence count,
  company class (AI-product → product), eval-framework signal, pre-LLM roots, top-3 endorsed skills.
- **Concern** is the single most salient honest weakness: availability, services firm, YoE band,
  location/relocation, notice period, missing eval signal, mixed product/services history.

`build_reasoning_facts.py` precomputes `top_skills` (top-3 by endorsements) and
`current_snippet` (first 140 chars of the current role description) per candidate
so `rank.py` never needs to stream `candidates.jsonl` at ranking time.

---

## Submission Generation

```bash
python rank.py \
  --features artifacts/candidate_features.parquet \
  --facts    artifacts/reasoning_facts.parquet \
  --out      submissions/team_redrob.csv \
  --topk     100
```

Output columns: `candidate_id`, `rank` (1–100), `score` (6 d.p.), `reasoning`.

`rank.py` self-checks before exit:
- Ranks are contiguous 1–100.
- `candidate_id` is unique.
- `score` is non-increasing (within floating-point tolerance).

---

## Artifact Provenance

| Artifact | Written by | Read by | Notes |
|----------|-----------|---------|-------|
| `artifacts/candidate_features.parquet` | `build_features.py` | `build_embeddings.py`, `finalize_embeddings.py`, `fix_twin_flag.py`, `build_gold_set.py`, `calibrate_thresholds.py`, `simulate_ranking.py`, `rank.py` | Mutated in-place by Steps 2–3; schema grows with each step |
| `artifacts/emb_profile.npy` | `build_embeddings.py` | `finalize_embeddings.py` | 384-d float32, ~147 MB |
| `artifacts/emb_career.npy` | `build_embeddings.py` | `finalize_embeddings.py` | 384-d float32, ~147 MB |
| `artifacts/jd_vec.npy` | `build_embeddings.py` | `finalize_embeddings.py` | 384-d JD query vector |
| `artifacts/emb_ids.csv` | `build_embeddings.py` | `finalize_embeddings.py` | Candidate ID order matching `.npy` rows |
| `artifacts/reasoning_facts.parquet` | `build_reasoning_facts.py` | `rank.py` | top_skills + current_snippet per candidate |
| `artifacts/gold_set_to_label.csv` | `build_gold_set.py` | _(human raters)_ | Human-labeling sheet; `human_tier` + `notes` columns left blank for raters |
| `artifacts/candidate_features_full.csv.gz` | `build_features.py` | _(none)_ | csv.gz fallback written if pyarrow is absent; redundant when parquet exists |
| `artifacts/feature_schema.csv` | `build_features.py` (_sample_) | _(reference)_ | First-50 rows for schema inspection |
| `submissions/team_redrob.csv` | `rank.py` | _(grader)_ | Final deliverable |
| `Datasets/candidate_features.csv` | `_featurize_tmp.py` | `analyze_candidates.py`, `analyze_candidates_b.py`, `quality_score.py` | **EDA only** — different schema from parquet; not on ranking path |
| `analysis_outputs/*.png, *.csv` | `analyze_candidates*.py`, `quality_score.py` | _(reference)_ | EDA charts and summary tables |

---

## Run Order

### Prerequisites

```
Data Challenge India Runs/
└── Datasets/
    └── candidates.jsonl    ← required
```

Verify the hardcoded `DEF_CAND` path in `build_features.py` matches your
local location before running Step 1.

---

### Step 1 — Feature extraction (≈ 3–5 min, CPU, streaming)

```bash
python build_features.py
```

Streams `candidates.jsonl`, extracts ~70 deterministic features per candidate,
writes `artifacts/candidate_features.parquet`.

Optional: limit to N candidates for testing:
```bash
python build_features.py --limit 5000
```

---

### Step 2a — Semantic embeddings (≈ 20–40 min, CPU, one-time)

```bash
python build_embeddings.py
```

Downloads `all-MiniLM-L6-v2` from HuggingFace Hub (first run only),
encodes all candidates, saves `emb_*.npy` + `jd_vec.npy`, merges
`semantic_fit` into the parquet. **Run once; Step 2b handles re-merges.**

---

### Step 2b — Re-merge semantic fit (≈ 2 min, offline)

If `.npy` files already exist and you need to re-merge (e.g. after schema
changes), use this instead of Step 2a:

```bash
python finalize_embeddings.py
```

Reloads saved vectors, re-derives `semantic_cosine` / `semantic_fit`, drops
any stale semantic/twin columns, re-merges cleanly.

---

### Step 3 — Correct twin flags (≈ 2–3 min, CPU)

```bash
python fix_twin_flag.py
```

Replaces the twin-detection heuristic from Step 2 with the authoritative
definition: structural identity (career sequence + skill multiset + signal
vector). Text near-duplicates from templating are intentionally excluded.
Overwrites `twin_flag` in the parquet.

---

### Step 4 — Precompute reasoning facts (≈ 3–4 min, streaming)

```bash
python build_reasoning_facts.py
```

Streams `candidates.jsonl`, extracts top-3 endorsed skills + current-role
snippet per candidate, writes `artifacts/reasoning_facts.parquet`.

---

### Step 5 — Rank and generate submission (≈ 5–15 s)

```bash
python rank.py
```

Reads parquet + reasoning facts, scores all candidates, selects top 100,
generates `reasoning` strings, writes `submissions/team_redrob.csv`.
Self-checks rank order, uniqueness, and score monotonicity before exit.

Override paths if needed:
```bash
python rank.py \
  --features artifacts/candidate_features.parquet \
  --facts    artifacts/reasoning_facts.parquet \
  --out      submissions/team_redrob.csv \
  --topk     100
```

---

### Re-score only (no rebuild)

If the parquet and reasoning facts are already built and you only change
`src/scoring.py` or `src/reasoning.py`:

```bash
python rank.py   # ← Step 5 only
```

This is the fast path (< 30 s end-to-end).

---

### EDA / Validation scripts (optional, development-time)

These are not on the ranking critical path and can be run in any order
after Step 1 builds `Datasets/candidate_features.csv` (via `_featurize_tmp.py`):

```bash
python _mine_vocab.py          # vocabulary/distribution analysis
python _mine_evidence.py       # IR-evidence keyword + honeypot mining
python analyze_candidates.py   # EDA Stage A: stats, correlations
python analyze_candidates_b.py # EDA Stage B: PCA, quality indicators
python quality_score.py        # EDA Stage C: pillar quality score

# After Step 1 parquet is available:
python simulate_ranking.py     # ablation study on silver set
python calibrate_thresholds.py # tier-cut inspection
python build_gold_set.py       # generate human-labeling sheet
```
