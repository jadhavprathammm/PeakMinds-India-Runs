# PeakMinds Monorepo Migration Plan

_Assessment only. No files have been moved, created, or modified._

---

## 1. Current Repository Inventory

All 72 file-system entries inside `Codes/`, grouped by role:

### 1a. Core library (`src/` package) — 7 source files
```
src/__init__.py
src/features.py          — per-candidate feature extractor (deterministic)
src/taxonomies.py        — title/company/location classifiers + KW dicts
src/jd_intent.py         — JD semantic query + exemplars
src/scoring.py           — vectorised S / tier scoring function
src/evaluation.py        — NDCG / MAP / P@k / composite metric
src/reasoning.py         — grounded reasoning string generator
```

### 1b. Production pipeline scripts — 6 files
```
build_features.py        — Step 1: feature extraction
build_embeddings.py      — Step 2a: encode + merge semantic embeddings
finalize_embeddings.py   — Step 2b: re-merge embeddings without re-encoding
fix_twin_flag.py         — Step 3: structural twin detection
build_reasoning_facts.py — Step 4: precompute reasoning snippets
rank.py                  — Step 5: score + rank + produce submission CSV
```

### 1c. Research / EDA / development scripts — 9 files
```
_featurize_tmp.py        — scratch EDA feature builder (superseded)
_mine_vocab.py           — vocabulary / distribution mining
_mine_evidence.py        — IR-keyword evidence + honeypot mining
analyze_candidates.py    — EDA Stage A: stats, correlations
analyze_candidates_b.py  — EDA Stage B: PCA, top indicators, charts
quality_score.py         — EDA Stage C: pillar quality score
calibrate_thresholds.py  — S-distribution threshold inspection
simulate_ranking.py      — ablation study on silver set
build_gold_set.py        — human-labeling instrument
```

### 1d. Precomputed artifacts — 11 files (total ~310 MB)
```
artifacts/candidate_features.parquet    5.5 MB   ← ranking input
artifacts/reasoning_facts.parquet       1.7 MB   ← ranking input
artifacts/emb_profile.npy             ~147 MB   ← sentence-transformer output
artifacts/emb_career.npy              ~147 MB   ← sentence-transformer output
artifacts/jd_vec.npy                    2 KB    ← JD query vector
artifacts/emb_ids.csv                   1.3 MB   ← ID order for .npy arrays
artifacts/feature_schema.csv            4 KB    ← schema reference
artifacts/gold_set_to_label.csv        20 KB    ← human-labeling sheet
artifacts/candidate_features_full.csv.gz 5.8 MB ← csv fallback (redundant)
artifacts/_emb_log.txt                  47 KB   ← embedding run log
artifacts/_sample_features_head50.csv   25 KB   ← sample for inspection
```

### 1e. Submission deliverable — 1 file
```
submissions/team_redrob.csv            27 KB
```

### 1f. EDA outputs — 14 files (total ~13 MB)
```
analysis_outputs/01_correlation_heatmap.png
analysis_outputs/02_distributions.png
analysis_outputs/03_outlier_boxplots.png
analysis_outputs/04_pca.png
analysis_outputs/05_quality_score.png
analysis_outputs/06_score_contributions.png
analysis_outputs/candidate_quality_scores.csv
analysis_outputs/correlation_matrix.csv
analysis_outputs/correlation_matrix_spearman.csv
analysis_outputs/outliers.csv
analysis_outputs/redundant_pairs.csv
analysis_outputs/summary_statistics.csv
analysis_outputs/top_quality_indicators.csv
analysis_outputs/_num_clean.csv          9.5 MB  ← intermediate scratch
analysis_outputs/_job_description.txt           ← reference doc
analysis_outputs/_redrob_signals_doc.txt        ← reference doc
analysis_outputs/_submission_spec.txt           ← reference doc
```

### 1g. Documentation — 8 files
```
README.md                    — project overview + run-order
requirements.txt             — Python dependencies
ranking_architecture.md      — scoring design rationale
relevance_rubric.md          — rubric + tier definitions (13 KB)
CLEANUP_REPORT.md            — engineering audit report
FEATURE_TABLE_ASSESSMENT.md  — EDA vs. ranking schema analysis
PATH_PORTABILITY_PLAN.md     — path portability migration plan
SMOKE_TEST_CHECKLIST.md      — post-migration smoke tests
```

### 1h. Research notebook — 1 file
```
Working with JSON.ipynb      — exploratory notebook
```

### 1i. Generated / compiled — NOT to be migrated
```
__pycache__/                 — 15 .pyc files (root-level)
src/__pycache__/             — 7 .pyc files
.claude/                     — IDE metadata
```

---

## 2. Proposed Target Structure

```
PeakMinds/
│
├── apps/
│   ├── web/                            ← (empty; future frontend)
│   └── api/                            ← (empty; future REST/gRPC API)
│
├── services/
│   └── ranking-engine/
│       ├── src/                        ← core library (unchanged internals)
│       │   ├── __init__.py
│       │   ├── features.py
│       │   ├── taxonomies.py
│       │   ├── jd_intent.py
│       │   ├── scoring.py
│       │   ├── evaluation.py
│       │   └── reasoning.py
│       ├── artifacts/                  ← precomputed data products (.gitignored)
│       │   ├── candidate_features.parquet
│       │   ├── reasoning_facts.parquet
│       │   ├── emb_profile.npy
│       │   ├── emb_career.npy
│       │   ├── emb_ids.csv
│       │   ├── jd_vec.npy
│       │   ├── feature_schema.csv
│       │   ├── gold_set_to_label.csv
│       │   ├── candidate_features_full.csv.gz
│       │   ├── _emb_log.txt
│       │   └── _sample_features_head50.csv
│       ├── research/                   ← EDA + experiments (NOT production)
│       │   ├── _featurize_tmp.py
│       │   ├── _mine_vocab.py
│       │   ├── _mine_evidence.py
│       │   ├── analyze_candidates.py
│       │   ├── analyze_candidates_b.py
│       │   ├── quality_score.py
│       │   ├── build_gold_set.py
│       │   ├── notebooks/
│       │   │   └── Working with JSON.ipynb
│       │   └── outputs/                ← EDA charts and CSVs (.gitignored)
│       │       ├── 01_correlation_heatmap.png
│       │       ├── 02_distributions.png
│       │       ├── 03_outlier_boxplots.png
│       │       ├── 04_pca.png
│       │       ├── 05_quality_score.png
│       │       ├── 06_score_contributions.png
│       │       ├── candidate_quality_scores.csv
│       │       ├── correlation_matrix.csv
│       │       ├── correlation_matrix_spearman.csv
│       │       ├── outliers.csv
│       │       ├── redundant_pairs.csv
│       │       ├── summary_statistics.csv
│       │       ├── top_quality_indicators.csv
│       │       └── _num_clean.csv
│       ├── submissions/
│       │   └── team_redrob.csv
│       ├── build_features.py
│       ├── build_embeddings.py
│       ├── finalize_embeddings.py
│       ├── fix_twin_flag.py
│       ├── calibrate_thresholds.py     ← kept at root (see §5 below)
│       ├── simulate_ranking.py         ← kept at root (see §5 below)
│       ├── build_reasoning_facts.py
│       ├── rank.py
│       ├── requirements.txt
│       └── README.md
│
├── data/
│   ├── candidates.jsonl                ← moved from Datasets/ (sibling)
│   └── eda/
│       └── candidate_features.csv      ← EDA legacy CSV (see §5)
│
├── docs/
│   ├── product/
│   │   └── product-spec.md             ← NEW (see §8)
│   ├── design/
│   │   └── design-system.md            ← NEW (see §8)
│   ├── engineering/
│   │   ├── build-plan.md               ← NEW (see §8)
│   │   ├── CLEANUP_REPORT.md
│   │   ├── FEATURE_TABLE_ASSESSMENT.md
│   │   ├── PATH_PORTABILITY_PLAN.md
│   │   └── SMOKE_TEST_CHECKLIST.md
│   └── ranking-engine/
│       ├── ranking_architecture.md
│       ├── relevance_rubric.md
│       └── reference/
│           ├── _job_description.txt
│           ├── _redrob_signals_doc.txt
│           └── _submission_spec.txt
│
├── scripts/                            ← (empty; repo-level utilities go here)
│
├── infra/                              ← (empty; deployment config goes here)
│   ├── railway/
│   └── render/
│
└── README.md                           ← NEW: PeakMinds top-level README
```

---

## 3. File-Move Table: Everything into `services/ranking-engine/`

| Source (`Codes/`) | Destination (`PeakMinds/`) | Notes |
|---|---|---|
| `src/` (all 7 files) | `services/ranking-engine/src/` | move as-is |
| `build_features.py` | `services/ranking-engine/` | path defaults change (§6) |
| `build_embeddings.py` | `services/ranking-engine/` | path defaults change (§6) |
| `finalize_embeddings.py` | `services/ranking-engine/` | path defaults change (§6) |
| `fix_twin_flag.py` | `services/ranking-engine/` | path defaults change (§6) |
| `build_reasoning_facts.py` | `services/ranking-engine/` | path defaults change (§6) |
| `rank.py` | `services/ranking-engine/` | path defaults change (§6) |
| `calibrate_thresholds.py` | `services/ranking-engine/` | kept at root — see §5 |
| `simulate_ranking.py` | `services/ranking-engine/` | kept at root — see §5 |
| `build_gold_set.py` | `services/ranking-engine/research/` | no src imports; safe |
| `_featurize_tmp.py` | `services/ranking-engine/research/` | no src imports; safe |
| `_mine_vocab.py` | `services/ranking-engine/research/` | no src imports; safe |
| `_mine_evidence.py` | `services/ranking-engine/research/` | no src imports; safe |
| `analyze_candidates.py` | `services/ranking-engine/research/` | no src imports; safe |
| `analyze_candidates_b.py` | `services/ranking-engine/research/` | no src imports; safe |
| `quality_score.py` | `services/ranking-engine/research/` | no src imports; safe |
| `Working with JSON.ipynb` | `services/ranking-engine/research/notebooks/` | |
| `artifacts/` (all 11 files) | `services/ranking-engine/artifacts/` | ~310 MB; must be .gitignored |
| `submissions/team_redrob.csv` | `services/ranking-engine/submissions/` | |
| `analysis_outputs/*.png, *.csv` | `services/ranking-engine/research/outputs/` | .gitignored |
| `analysis_outputs/_*.txt` | `docs/ranking-engine/reference/` | these are reference docs, not outputs |
| `README.md` | `services/ranking-engine/README.md` | keep as service README |
| `requirements.txt` | `services/ranking-engine/requirements.txt` | service-scoped dependencies |
| `ranking_architecture.md` | `docs/ranking-engine/ranking_architecture.md` | |
| `relevance_rubric.md` | `docs/ranking-engine/relevance_rubric.md` | |
| `CLEANUP_REPORT.md` | `docs/engineering/CLEANUP_REPORT.md` | |
| `FEATURE_TABLE_ASSESSMENT.md` | `docs/engineering/FEATURE_TABLE_ASSESSMENT.md` | |
| `PATH_PORTABILITY_PLAN.md` | `docs/engineering/PATH_PORTABILITY_PLAN.md` | |
| `SMOKE_TEST_CHECKLIST.md` | `docs/engineering/SMOKE_TEST_CHECKLIST.md` | |
| `MIGRATION_PLAN.md` (this file) | `docs/engineering/MIGRATION_PLAN.md` | |

### New files to be created (not moves)
```
PeakMinds/README.md                          ← monorepo overview
PeakMinds/.gitignore                         ← excludes .npy, .parquet, _num_clean.csv, __pycache__, etc.
PeakMinds/docs/product/product-spec.md       ← Product Specification (see §8)
PeakMinds/docs/design/design-system.md       ← Design System (see §8)
PeakMinds/docs/engineering/build-plan.md     ← Build Plan (see §8)
```

### Data moved from `Datasets/` (currently a sibling of `Codes/`)
```
Datasets/candidates.jsonl          → PeakMinds/data/candidates.jsonl
Datasets/candidate_features.csv    → PeakMinds/data/eda/candidate_features.csv
```
_(Other files in Datasets/ — .docx competition docs, validate_submission.py, sample files —
are competition artefacts; they can remain in Datasets/ or go to `docs/ranking-engine/reference/`.)_

---

## 4. New Folders to Be Created

```
PeakMinds/                                  ← monorepo root
PeakMinds/apps/
PeakMinds/apps/web/
PeakMinds/apps/api/
PeakMinds/services/
PeakMinds/services/ranking-engine/
PeakMinds/services/ranking-engine/research/
PeakMinds/services/ranking-engine/research/notebooks/
PeakMinds/services/ranking-engine/research/outputs/
PeakMinds/data/
PeakMinds/data/eda/
PeakMinds/docs/
PeakMinds/docs/product/
PeakMinds/docs/design/
PeakMinds/docs/engineering/
PeakMinds/docs/ranking-engine/
PeakMinds/docs/ranking-engine/reference/
PeakMinds/scripts/
PeakMinds/infra/
PeakMinds/infra/railway/
PeakMinds/infra/render/
```

**Total new folders: 20**

---

## 5. Imports That Would Break

### 5a. `calibrate_thresholds.py` and `simulate_ranking.py` — sys.path issue

**Problem:** Both scripts do:
```python
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.scoring import score_dataframe   # or evaluation
```

If moved to `research/`, `os.path.dirname(__file__)` = `services/ranking-engine/research/`.
Python would look for `research/src/scoring.py`, which does not exist.
`src/` is at `services/ranking-engine/src/`, one level above.

**Why they are kept at `services/ranking-engine/` root (not in `research/`):**
Keeping them alongside the production pipeline scripts means the existing
`sys.path` logic continues to work without any code change — the script's
directory is `services/ranking-engine/`, and `src/` is at that same level.

**Alternative (if they must live in `research/`):** change one line in each:
```python
# was:
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
# becomes:
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
```
This is a one-line change per file, but it is a code modification — requiring approval.

### 5b. `finalize_embeddings.py` → `from build_embeddings import load_texts`

**Status: safe.** Both files move to the same directory (`services/ranking-engine/`).
`sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` adds
`services/ranking-engine/` to `sys.path`, so `import build_embeddings` resolves correctly.
**No change needed.**

### 5c. Research scripts in `research/` that import from `src/`

| Script | Moved to | Imports src? | Breaks? |
|---|---|---|---|
| `_featurize_tmp.py` | `research/` | No | Safe |
| `_mine_vocab.py` | `research/` | No | Safe |
| `_mine_evidence.py` | `research/` | No | Safe |
| `analyze_candidates.py` | `research/` | No | Safe |
| `analyze_candidates_b.py` | `research/` | No | Safe |
| `quality_score.py` | `research/` | No | Safe |
| `build_gold_set.py` | `research/` | No | Safe |
| `calibrate_thresholds.py` | **root** (kept) | Yes | Safe (kept at root) |
| `simulate_ranking.py` | **root** (kept) | Yes | Safe (kept at root) |

---

## 6. Artifact-Path Changes Required

### The `_HERE.parent` relationship changes

Currently every script anchors paths as:
```python
_HERE = Path(__file__).resolve().parent   # = Codes/
CAND  = Path(os.environ.get("CANDIDATES_PATH",
             str(_HERE.parent / "Datasets" / "candidates.jsonl")))
```

After the move:
- `_HERE` = `PeakMinds/services/ranking-engine/`
- `_HERE.parent` = `PeakMinds/services/`
- The default becomes `PeakMinds/services/Datasets/candidates.jsonl` ← **does not exist**

`candidates.jsonl` will be at `PeakMinds/data/candidates.jsonl`,
which is `_HERE.parent.parent / "data" / "candidates.jsonl"`.

### Affected files and required default changes

| Script | Current default | Required default (new) |
|---|---|---|
| `build_features.py` `DEF_CAND` | `_HERE.parent / "Datasets" / "candidates.jsonl"` | `_HERE.parent.parent / "data" / "candidates.jsonl"` |
| `build_embeddings.py` `DEF_CAND` | same | same |
| `finalize_embeddings.py` `CAND` | same | same |
| `fix_twin_flag.py` `PATH` | same | same |
| `build_reasoning_facts.py` `PATH` | same | same |
| `_mine_vocab.py` `PATH` | same | same |
| `_mine_evidence.py` `PATH` | same | same |
| `_featurize_tmp.py` `_DS` | `_HERE.parent / "Datasets"` | `_HERE.parent.parent / "data"` |
| `analyze_candidates.py` `_DS` | `_HERE.parent / "Datasets"` | `_HERE.parent.parent / "data" / "eda"` |
| `analyze_candidates_b.py` `_DS` | same | same |
| `quality_score.py` `_DS` | same | same |

**These are 11 one-liner default changes across 9 files.** All scripts already
support the `CANDIDATES_PATH` and `DATASETS_DIR` environment variables, so:
- On Railway / Render: no change needed; set the env var to the mount path.
- Local development without env vars: the default path needs updating.

### Paths that do NOT break after the move

| Path expression | Resolves to | Status |
|---|---|---|
| `ART = _HERE / "artifacts"` | `services/ranking-engine/artifacts/` | ✅ correct |
| `_HERE / "submissions" / ...` | `services/ranking-engine/submissions/` | ✅ correct |
| `from src.xxx import yyy` (pipeline scripts) | `services/ranking-engine/src/` | ✅ correct |
| `from build_embeddings import load_texts` | same dir as finalize_embeddings.py | ✅ correct |
| `ANALYSIS_OUT = _HERE / "analysis_outputs"` | `services/ranking-engine/analysis_outputs/` | ⚠️ resolves, but analysis_outputs moves to `research/outputs/` — minor update needed |

The `ANALYSIS_OUT` default for the three EDA scripts resolves to
`services/ranking-engine/analysis_outputs/`, but if `analysis_outputs/` becomes
`research/outputs/`, those scripts (now in `research/`) would need their
`ANALYSIS_OUT` default updated from `_HERE / "analysis_outputs"` to
`_HERE / "outputs"`. Only relevant if EDA scripts are run; not on the ranking path.

---

## 7. Deployment Risks

### 7a. Binary artifacts in version control — HIGH RISK

`artifacts/emb_profile.npy` and `artifacts/emb_career.npy` are ~147 MB each
(~294 MB combined). These will corrupt a git repository if committed:
- GitHub's 100 MB file-size hard limit rejects them.
- Railway and Render build containers would time out cloning the repo.

**Required action before first git commit in the new structure:**
Create `.gitignore` at `PeakMinds/` root before moving any files:
```gitignore
# Precomputed binary artifacts
services/ranking-engine/artifacts/*.npy
services/ranking-engine/artifacts/*.parquet
services/ranking-engine/artifacts/*.csv.gz
services/ranking-engine/artifacts/*.gz
services/ranking-engine/research/outputs/
services/ranking-engine/research/outputs/_num_clean.csv

# Python bytecode
**/__pycache__/
**/*.pyc

# Raw data (large)
data/candidates.jsonl
data/eda/candidate_features.csv
```

### 7b. `analysis_outputs/_num_clean.csv` — 9.5 MB file

This intermediate scratch file is large and machine-generated.
It should be excluded from git along with the rest of `research/outputs/`.

### 7c. No `infra/` configuration exists yet

`rank.py` claims a 5-minute compute budget, but there is no `Dockerfile`,
no `Procfile`, no `railway.toml`, no `render.yaml`.
On Railway/Render, the service has no defined entrypoint.
The `infra/` directory needs to be populated before any cloud deployment
can work. Minimum required:
- `Dockerfile` (or `railway.toml` start command)
- Environment variable declarations: `CANDIDATES_PATH`, `ARTIFACTS_DIR`
- Health-check endpoint (none exists; `rank.py` is a CLI, not a server)

`rank.py` is a batch CLI script, not a web service. Before deploying to
Railway/Render as a persistent service, the API layer (`apps/api/`) needs
to be built as a wrapper that exposes `score_dataframe()` over HTTP.

### 7d. No `apps/api/` layer exists

The ranking engine is currently a CLI pipeline. To expose it as a service
(for `apps/web/` to call), a REST/gRPC API layer must be written from scratch.
The `apps/api/` directory would import from `services/ranking-engine/src/`.
This creates a cross-service import that should be handled via:
- A shared Python package (promote `src/` to an installable package with its own `pyproject.toml`)
- Or a REST contract boundary

### 7e. `finalize_embeddings.py` imports from `build_embeddings.py` as a module

```python
from build_embeddings import load_texts
```

This works when both files are in the same directory and that directory is on
`sys.path`. In a packaged deployment (e.g., if the service is installed via pip),
root-level scripts are not importable this way. If the service is ever packaged,
`load_texts` must be moved into `src/` (e.g., `src/text_loader.py`).

### 7f. Python version not pinned

`requirements.txt` specifies minimum package versions but not the Python version.
The `.pyc` files confirm CPython 3.13. Railway and Render default to older runtimes
(typically 3.11 or 3.12). A `runtime.txt` or `.python-version` file is required:
```
python-3.13.x
```

### 7g. `sentence-transformers` model download at first run

`build_embeddings.py` downloads `all-MiniLM-L6-v2` from HuggingFace Hub at runtime.
In a cloud build/deploy context, this fails if:
- No outbound internet access during build
- No writable cache directory
- Cold-start latency is unacceptable

For production: pre-bake the model into the Docker image, or mount it from a
volume. `rank.py` itself does not download the model (uses pre-built `.npy` files),
so only the build pipeline is affected.

---

## 8. Where Documents Should Live

### Product Specification
```
docs/product/product-spec.md
```
Top-level `docs/product/` makes the spec accessible to engineering, design,
and product simultaneously. It is not scoped to a single service.
This is the definitive "what are we building and why" document.

### Design System
```
docs/design/design-system.md
```
And/or, when the frontend matures:
```
apps/web/design-system/
```
Start in `docs/design/` (service-agnostic, sharable). Migrate specific
component library tokens into `apps/web/` once the frontend is underway.

### Build Plan
```
docs/engineering/build-plan.md
```
Lives alongside the other engineering assessments already written for this
project. The build plan describes how to build and release each service —
it is broader than any single service's README.

### Summary

| Document | Location | Rationale |
|---|---|---|
| Product Specification | `docs/product/product-spec.md` | Cross-team visibility; not service-specific |
| Design System | `docs/design/design-system.md` | Shared design language; owned by design/frontend |
| Build Plan | `docs/engineering/build-plan.md` | Engineering-owned; release and infra decisions |
| Ranking Architecture | `docs/ranking-engine/ranking_architecture.md` | Service-specific design rationale |
| Relevance Rubric | `docs/ranking-engine/relevance_rubric.md` | Scoring methodology reference |
| Engineering Assessments | `docs/engineering/` | Audit + migration artefacts |
| Reference docs (JD, signals, spec) | `docs/ranking-engine/reference/` | Competition-specific source material |

---

## 9. Migration Execution Order (for when approved)

Apply in this sequence to avoid breaking the working state at each step:

1. **Create root `.gitignore`** before any files are committed to the new structure.
2. **Create the monorepo root** (`PeakMinds/`) with the empty scaffolding folders.
3. **Move `Datasets/candidates.jsonl`** → `PeakMinds/data/candidates.jsonl` and `Datasets/candidate_features.csv` → `PeakMinds/data/eda/candidate_features.csv`.
4. **Move `src/`** → `services/ranking-engine/src/` (no code changes needed).
5. **Move the 6 production pipeline scripts** into `services/ranking-engine/`; update the `CAND` / `DEF_CAND` / `_DS` defaults from `_HERE.parent / "Datasets"` to `_HERE.parent.parent / "data"` in each.
6. **Move `calibrate_thresholds.py` and `simulate_ranking.py`** to `services/ranking-engine/` root (same level as pipeline scripts; preserves `sys.path` + `src/` import).
7. **Run `python rank.py` smoke test** from `services/ranking-engine/` — verify output matches current `team_redrob.csv`.
8. **Move research scripts** (`_featurize_tmp.py`, `_mine_vocab.py`, etc.) to `services/ranking-engine/research/`; update `_DS` / `ANALYSIS_OUT` defaults.
9. **Move artifacts** → `services/ranking-engine/artifacts/` (verify `.gitignore` is active first — do NOT `git add` the `.npy` files).
10. **Move EDA outputs** → `services/ranking-engine/research/outputs/`.
11. **Move documentation** → appropriate `docs/` subtrees.
12. **Create `PeakMinds/README.md`**, `docs/product/product-spec.md`, `docs/design/design-system.md`, `docs/engineering/build-plan.md`.
13. **Create `infra/` stubs** (`railway/`, `render/`) and `apps/web/`, `apps/api/` empty directories with placeholder `README.md` files.
14. **Re-run full smoke-test checklist** (`SMOKE_TEST_CHECKLIST.md`) from the new `services/ranking-engine/` location.

---

## 10. Risk Summary

| Risk | Severity | Trigger condition | Mitigation |
|---|---|---|---|
| `.npy` files committed to git | **HIGH** | First `git init` / `git add` without `.gitignore` | Create `.gitignore` first, step 1 |
| `CAND` default path breaks (11 instances) | **MED** | Running any build script without `CANDIDATES_PATH` env var | Update 9 files, one-liner each |
| `calibrate_thresholds.py` / `simulate_ranking.py` `src/` imports | **MED** | Moving them to `research/` subdirectory | Keep at root; OR add one-liner sys.path fix |
| No API layer exists | **MED** | Deploying to Railway/Render as a web service | Build `apps/api/` before deployment |
| Python version not pinned | **MED** | Cloud runtime defaults to 3.11/3.12 | Add `runtime.txt` or `.python-version` |
| `sentence-transformers` download in cloud | **LOW** | Running `build_embeddings.py` in cloud build | Pre-bake model in Docker; `rank.py` is unaffected |
| `ANALYSIS_OUT` default for EDA scripts | **LOW** | Running EDA scripts after `analysis_outputs/` rename | Update default in 3 files; not on ranking path |
| `_num_clean.csv` (9.5 MB) committed | **LOW** | `git add research/outputs/` | Covered by `.gitignore` rule for `research/outputs/` |
