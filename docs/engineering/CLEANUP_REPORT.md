# Repository Cleanup Audit — `Codes/`

_Audit only. Nothing in the repository was modified._

Scope: `d:\Data Challenge India Runs\Codes` (Redrob candidate-ranking submission).
This is **not a git repository** and ships no dependency or environment declaration.

---

## Summary of findings

| # | Category | Count / severity |
|---|----------|------------------|
| 1 | Hardcoded paths | 30 absolute `D:\...` literals across 17 files — **Critical** |
| 2 | Duplicate files | 1 byte-identical copy + 3 superseded twin-detection generations + 2 parallel feature tables — **Critical/Recommended** |
| 3 | Experimental scripts | 8 scratch/EDA/validation scripts + 1 notebook intermixed with the pipeline — **Recommended** |
| 4 | Dead code | Superseded scripts, dead branches, unused vars, committed `__pycache__` — **Recommended/Optional** |
| 5 | Missing documentation | No README, no run-order, no artifact provenance map — **Critical** |
| 6 | Missing dependencies | 6 third-party packages, none declared or pinned — **Critical** |
| 7 | Deployment issues | Paths, external dataset dir, in-place mutation chain, runtime model download, ~300 MB binaries — **Critical** |

---

## 1. Hardcoded paths

Every script hardcodes Windows-absolute paths. The grader/another machine cannot run any of them as-is.

- `D:\Data Challenge India Runs\Datasets\candidates.jsonl` — input, hardcoded in:
  `_featurize_tmp.py`, `_mine_vocab.py`, `_mine_evidence.py`, `build_features.py` (`DEF_CAND`),
  `build_embeddings.py`, `submissions/build_embeddings.py`, `finalize_embeddings.py`,
  `fix_twin_flag.py`, `build_reasoning_facts.py`.
- `D:\Data Challenge India Runs\Datasets\candidate_features.csv` — legacy feature CSV read by
  `analyze_candidates.py`, `analyze_candidates_b.py`, `quality_score.py`; written by `_featurize_tmp.py`.
- `D:\Data Challenge India Runs\Codes\artifacts` — `ART`/`OUT`/`DEF_OUT` in `build_features.py`,
  `build_embeddings.py`, `finalize_embeddings.py`, `fix_twin_flag.py`, `calibrate_thresholds.py`,
  `simulate_ranking.py`, `build_gold_set.py`, `build_reasoning_facts.py`, `rank.py`.
- `D:\...\submissions\team_redrob.csv` — hardcoded default `--out` in `rank.py`.

`rank.py` and `build_features.py` expose `argparse` overrides, but the *defaults* are still
machine-specific absolutes. The mining/EDA/validation scripts have **no** override.

> Fix direction (later): a single `paths.py`/config or `os.environ`/CLI-relative resolution
> (`Path(__file__).resolve().parent`), so `Datasets/`, `artifacts/`, `submissions/` resolve relatively.

## 2. Duplicate files

- **Byte-identical copy:** `build_embeddings.py` ≡ `submissions/build_embeddings.py` (`diff` = no
  differences). Source code does not belong in the `submissions/` deliverable folder.
- **Three generations of twin/duplicate detection**, each overwriting `candidate_features.parquet`'s
  `twin_flag`:
  1. `build_embeddings.py` — text+career+skill MD5 + near-twin embeddings (writes `twin_flag`).
  2. `finalize_embeddings.py` — same logic minus re-encoding (writes `twin_flag` again).
  3. `fix_twin_flag.py` — the **authoritative** redefinition (structural identity only; explicitly
     rejects the text-templating heuristic the first two used).
  Generations 1–2's twin logic is dead once `fix_twin_flag.py` runs last. Only its definition survives.
- **Two parallel feature tables with different schemas:**
  - `Datasets/candidate_features.csv` (from `_featurize_tmp.py`) — consumed by all EDA scripts.
  - `artifacts/candidate_features.parquet` (from `build_features.py` + `src/features.py`) — consumed by
    the ranker. The EDA branch never sees the schema the submission actually ranks on.
- **Fallback duplicate:** `artifacts/candidate_features_full.csv.gz` is the csv.gz fallback of the same
  data as `candidate_features.parquet` (written only when pyarrow is missing) — currently both exist.

## 3. Experimental scripts

Scratch / exploratory / validation code lives in the project root alongside the production pipeline:

- `_featurize_tmp.py`, `_mine_vocab.py`, `_mine_evidence.py` — underscore-prefixed scratch
  (vocabulary mining + a superseded feature builder).
- `analyze_candidates.py`, `analyze_candidates_b.py`, `quality_score.py` — EDA stages A/B/C; produce the
  `analysis_outputs/` PNGs/CSVs. Reusable asset, but not part of the ranking path.
- `calibrate_thresholds.py`, `simulate_ranking.py` — threshold calibration and a self-validation
  (silver-set ablation) proxy. Useful, but development-time only.
- `Working with JSON.ipynb` — exploratory notebook.

None are imported by `rank.py`. Suggest moving to `eda/`, `research/`, or `scratch/` subfolders so the
production path (`build_features → build_embeddings/finalize → fix_twin_flag → build_reasoning_facts →
rank`) is unambiguous.

## 4. Dead code

- `submissions/build_embeddings.py` — duplicate, never referenced (see §2).
- `_featurize_tmp.py` — output (`candidate_features.csv`) is the legacy schema superseded by
  `src/features.py`; only the EDA scripts still read it.
- `build_embeddings.py` — once `finalize_embeddings.py` (reuses saved `.npy`) and `fix_twin_flag.py`
  are the path of record, this script's twin/hybrid-comparison body is throwaway analysis.
- Dead branch: `analyze_candidates.py:97` — `num.to_parquet(...) if False else num.to_csv(...)`
  (the parquet arm can never execute).
- Unused locals: `caresig` is built in `load_texts()` (`build_embeddings.py`/`finalize_embeddings.py`)
  but never consumed; `n` in `profile()` (`build_embeddings.py:109`); `additional` computed only to print.
- `src/__pycache__/` and `__pycache__/` (compiled `.pyc`) are present and should not be committed.

## 5. Missing documentation

- **No `README`** with what the project is, how to install, and how to run end-to-end.
- **No run-order / pipeline doc.** The scripts have a strict dependency order (features → embeddings →
  finalize → twin-fix → reasoning facts → rank) that exists only implicitly in docstrings.
- **No artifact-provenance map** (which script writes/reads which file). Critically undocumented: the
  EDA scripts read the *legacy* `Datasets/candidate_features.csv` while the ranker reads
  `artifacts/candidate_features.parquet` — a fork a reviewer would not expect.
- Existing docs `ranking_architecture.md` and `relevance_rubric.md` describe design/scoring but give **no
  reproduction steps**.

## 6. Missing dependency declarations

No `requirements.txt` / `pyproject.toml` / `environment.yml` anywhere. Third-party imports used:

| Package | Used by |
|---------|---------|
| `numpy` | nearly all scripts |
| `pandas` | nearly all scripts |
| `matplotlib` | `analyze_candidates_b.py`, `quality_score.py` |
| `pyarrow` | `build_features.py` (optional-guarded), parquet I/O in `rank.py`/scoring |
| `sentence-transformers` | `build_embeddings.py`, `submissions/build_embeddings.py` |
| `torch` | `build_embeddings.py` (CPU) |

No Python version pin (compiled artifacts indicate **CPython 3.13**). No model/version pin beyond the
string `sentence-transformers/all-MiniLM-L6-v2`.

## 7. Potential deployment issues

- **Absolute paths (see §1)** — hard blocker on any machine but this one.
- **Dataset lives outside the submission root.** `Datasets/` is a *sibling* of `Codes/`, referenced by
  absolute path. If only `Codes/` (or `Codes.zip`) is shipped, every script fails to find its input.
  The official `validate_submission.py` and spec docs also live in `Datasets/`, not in `Codes/`.
- **In-place, order-dependent mutation of `candidate_features.parquet`.** `build_features` creates it,
  then `build_embeddings`/`finalize_embeddings` and `fix_twin_flag` each re-read and overwrite it.
  Non-idempotent and order-sensitive: `finalize_embeddings.py:32` drops columns by substring match
  (`"sim_"`, `"semantic"`, `"twin"`) — fragile, and re-running steps out of sequence silently corrupts
  state. No provenance/versioning.
- **Runtime model download.** `build_embeddings.py` fetches `all-MiniLM-L6-v2` over the network. The
  "no network / offline" guarantee holds only for `rank.py` (which consumes prebuilt `.npy`), not for a
  cold rebuild — and there is no documented offline/cached-model fallback.
- **No regeneration entrypoint.** No `Makefile`/`run_all` script ties the ordered steps together; if the
  prebuilt artifacts are absent, the 300-second `rank.py` budget claim is moot because the upstream
  rebuild (embeddings) is the expensive, networked part.
- **Large committed binaries.** `artifacts/emb_career.npy` + `emb_profile.npy` ≈ 300 MB, plus a
  294 MB `Codes.zip` in the parent. With no `.gitignore` and no VCS, scratch files, `__pycache__`, logs
  (`_emb_log.txt`), and these binaries would all ship.

---

## Prioritized cleanup plan

### 🔴 Critical (blocks reproduction / submission on another machine)
1. **De-hardcode paths** — central config or `Path(__file__)`-relative resolution for
   `Datasets/`, `artifacts/`, `submissions/` (§1).
2. **Add `requirements.txt`** (pinned: numpy, pandas, matplotlib, pyarrow, sentence-transformers, torch)
   and pin the Python version (§6).
3. **Add a `README`** with install + ordered run instructions + artifact-provenance map, calling out the
   legacy-CSV-vs-parquet fork (§5).
4. **Fix the dataset-location assumption** — vendor a small sample under `Codes/` or document/parametrize
   the external `Datasets/` path so the submission is self-contained (§7).
5. **Make the artifact pipeline reproducible** — a `run_all` / `Makefile` with explicit step order, and
   stop blind in-place parquet overwrites (write versioned/intermediate outputs); document the offline
   model requirement for `build_embeddings.py` (§7).

### 🟡 Recommended (clarity, maintainability, size)
6. **Remove `submissions/build_embeddings.py`** (byte-identical duplicate; source shouldn't be in the
   deliverable folder) (§2).
7. **Collapse twin-detection to one definition** — keep `fix_twin_flag.py`'s structural-identity logic;
   delete the superseded twin/hybrid bodies in `build_embeddings.py`/`finalize_embeddings.py` (§2, §4).
8. **Quarantine experimental code** into `eda/` + `research/` (or `scratch/`) so the production path is
   obvious: `_featurize_tmp.py`, `_mine_*.py`, `analyze_candidates*.py`, `quality_score.py`,
   `calibrate_thresholds.py`, `simulate_ranking.py`, `Working with JSON.ipynb` (§3).
9. **Add `.gitignore`** (`__pycache__/`, `*.pyc`, `*.npy`, `artifacts/`, `*.zip`, logs) and initialize
   version control (§4, §7).
10. **Reconcile the two feature tables** — point EDA at the same parquet the ranker uses, or document why
    they differ; drop the redundant `candidate_features_full.csv.gz` if parquet is the source of truth (§2).

### 🟢 Optional (polish)
11. Remove the dead `if False else` branch in `analyze_candidates.py` and unused locals
    (`caresig`, `n`, `additional`) (§4).
12. Drop committed logs/scratch artifacts: `artifacts/_emb_log.txt`,
    `artifacts/_sample_features_head50.csv`, the `analysis_outputs/_*.txt` scratch files.
13. Consider removing the 294 MB `Codes.zip` from the working tree once VCS is in place.
14. Add module/usage docstrings to the EDA scripts noting they are development-time, not part of scoring.
```
