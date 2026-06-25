# Path Portability Audit & Migration Plan

_Review only. No code has been modified._

---

## 1. Scope of the Problem

Every script uses Windows-absolute raw string literals of the form:

```python
r"D:\Data Challenge India Runs\Datasets\candidates.jsonl"
r"D:\Data Challenge India Runs\Codes\artifacts"
```

These fail on Linux/macOS outright and are fragile even on the same Windows
machine if the repo is moved. **30 literals across 16 production/EDA files.**

### Actual directory layout

```
D:\Data Challenge India Runs\        ← GRANDPARENT (call it GP)
├── Codes\                           ← PROJECT ROOT (all .py files live here)
│   ├── src\
│   ├── artifacts\
│   ├── analysis_outputs\
│   ├── submissions\
│   └── *.py
└── Datasets\                        ← GP / "Datasets"   (one level UP from Codes)
    └── candidates.jsonl
```

This means the candidates input is **not inside** the project root;
it is a sibling directory. Any portability solution must handle that relationship.

---

## 2. Portability Strategy

### 2a. Core resolution pattern (pathlib)

Every script knows its own location via `__file__`. That is the anchor:

```python
from pathlib import Path
import os

_HERE  = Path(__file__).resolve().parent          # = Codes/
_ART   = _HERE / "artifacts"
_SUB   = _HERE / "submissions"

# Datasets is a sibling of Codes — but also overridable via env var
_DATASETS = Path(os.environ.get("DATASETS_DIR",  str(_HERE.parent / "Datasets")))
_CAND     = Path(os.environ.get("CANDIDATES_PATH", str(_DATASETS / "candidates.jsonl")))
```

Scripts that already expose `argparse` overrides (`build_features.py`,
`build_embeddings.py`, `rank.py`) just update their default= values.
Scripts that don't expose CLI flags keep the module-level constants
but derive them portably.

### 2b. Two-tier override hierarchy

```
1. CLI --flag (where argparse already exists)          ← highest priority
2. Environment variable CANDIDATES_PATH / DATASETS_DIR  ← deployment override
3. Path(__file__).resolve().parent  derived relative path  ← local default
```

No env vars are required on a developer machine. The sibling relationship
(`Codes/../Datasets`) is encoded in the default, so it resolves correctly
on any OS without configuration.

### 2c. Platform compatibility matrix

| Mechanism | Windows (local) | Linux (local) | Railway | Render |
|-----------|:-:|:-:|:-:|:-:|
| `Path(__file__).resolve().parent` | ✅ | ✅ | ✅ | ✅ |
| `../Datasets` sibling default | ✅ (if both dirs present) | ✅ (if both dirs present) | ⚠️ needs `DATASETS_DIR` env var | ⚠️ needs `DATASETS_DIR` env var |
| `CANDIDATES_PATH` env var | ✅ | ✅ | ✅ | ✅ |
| `ARTIFACTS_DIR` env var | ✅ | ✅ | ✅ | ✅ |
| Raw `r"D:\..."` strings | ✅ (this machine only) | ❌ | ❌ | ❌ |

**Railway / Render notes:**
- Both are Linux containers. Code is typically mounted at `/app` (Railway)
  or `/opt/render/project/src` (Render).
- `Datasets/` will not exist as a sibling unless explicitly mounted or copied.
- Set `CANDIDATES_PATH=/data/candidates.jsonl` (or wherever the volume mounts)
  in the service's environment variables.
- `artifacts/` lives inside the project root and is unaffected — it resolves
  to `/app/artifacts` automatically.
- No other code changes are required for Railway/Render compatibility.

---

## 3. File-by-File Inventory

### Legend
- **Type:** P = production ranking path | E = EDA/research | D = duplicate (delete)
- **Risk:** LOW = isolated constants, no logic change | MED = default args + cross-file imports

---

### FILE 1 — `build_features.py`
**Type:** P | **Risk:** LOW-MED

**Current hardcoded paths (lines 14–15):**
```python
DEF_CAND = r"D:\Data Challenge India Runs\Datasets\candidates.jsonl"
DEF_OUT  = r"D:\Data Challenge India Runs\Codes\artifacts"
```

**Proposed replacement (lines 1–15 preamble):**
```python
from pathlib import Path
import os

_HERE    = Path(__file__).resolve().parent
DEF_CAND = os.environ.get("CANDIDATES_PATH", str(_HERE.parent / "Datasets" / "candidates.jsonl"))
DEF_OUT  = os.environ.get("ARTIFACTS_DIR",   str(_HERE / "artifacts"))
```

**How it works:** `__file__` = `Codes/build_features.py`, so `.parent` = `Codes/`,
`.parent.parent / "Datasets"` = the sibling Datasets dir. The existing `argparse`
flags (`--candidates`, `--out`) continue to work and override these defaults.

**Risk justification:** Only the two default string values change. The `argparse`
setup, `find_ref_date()`, extraction loop, parquet write, and QA summary are
untouched. Existing callers who pass `--candidates` / `--out` explicitly see
zero change.

---

### FILE 2 — `build_embeddings.py`
**Type:** P | **Risk:** LOW-MED

**Current hardcoded paths (lines 17–18):**
```python
DEF_CAND = r"D:\Data Challenge India Runs\Datasets\candidates.jsonl"
ART      = r"D:\Data Challenge India Runs\Codes\artifacts"
```

`ART` is also used as a bare string in multiple `os.path.join(ART, ...)` calls
throughout the file (lines 81–84, 87, 91, 171).

**Proposed replacement:**
```python
from pathlib import Path
import os

_HERE    = Path(__file__).resolve().parent
DEF_CAND = os.environ.get("CANDIDATES_PATH", str(_HERE.parent / "Datasets" / "candidates.jsonl"))
ART      = Path(os.environ.get("ARTIFACTS_DIR", str(_HERE / "artifacts")))
```

All `os.path.join(ART, "emb_profile.npy")` calls become `ART / "emb_profile.npy"`
(Path accepts `/` operator) — or they continue to work as-is since `os.path.join`
accepts `Path` objects in Python 3.6+.

**Risk justification:** `ART` is consumed only by `np.save`, `pd.read_parquet`,
`.to_parquet`, `pd.Series.to_csv`, `pd.read_csv`. All accept `Path`. `DEF_CAND`
feeds only argparse default. No scoring/embedding/twin logic is touched.

---

### FILE 3 — `submissions/build_embeddings.py`
**Type:** D | **Risk:** N/A — **recommend deletion**

Byte-identical duplicate of `build_embeddings.py` (confirmed by `diff`).
Contains the same two hardcoded paths. The fix is to delete this file, not patch it.
If the submission package requires a copy, it should be generated from the
canonical source at packaging time, not stored as a live duplicate.

---

### FILE 4 — `finalize_embeddings.py`
**Type:** P | **Risk:** LOW-MED

**Current hardcoded paths (lines 14–15):**
```python
ART  = r"D:\Data Challenge India Runs\Codes\artifacts"
CAND = r"D:\Data Challenge India Runs\Datasets\candidates.jsonl"
```

**Additional coupling:** Line 12 does `from build_embeddings import load_texts`.
This is a direct import from a root-level script (not a package).
`sys.path.insert(0, ...)` already handles this correctly on line 11.

**Proposed replacement:**
```python
from pathlib import Path
import os

_HERE = Path(__file__).resolve().parent
ART   = Path(os.environ.get("ARTIFACTS_DIR",   str(_HERE / "artifacts")))
CAND  = Path(os.environ.get("CANDIDATES_PATH", str(_HERE.parent / "Datasets" / "candidates.jsonl")))
```

**Risk justification:** `ART` and `CAND` are module-level constants used only for
file I/O. The embedding arithmetic, twin detection, merge logic, and profile function
are untouched. The `from build_embeddings import load_texts` import is unaffected.

---

### FILE 5 — `fix_twin_flag.py`
**Type:** P | **Risk:** LOW

**Current hardcoded paths (lines 13–14):**
```python
ART  = r"D:\Data Challenge India Runs\Codes\artifacts"
PATH = r"D:\Data Challenge India Runs\Datasets\candidates.jsonl"
```

**Proposed replacement:**
```python
from pathlib import Path
import os

_HERE = Path(__file__).resolve().parent
ART   = Path(os.environ.get("ARTIFACTS_DIR",   str(_HERE / "artifacts")))
PATH  = Path(os.environ.get("CANDIDATES_PATH", str(_HERE.parent / "Datasets" / "candidates.jsonl")))
```

**Risk justification:** This script is entirely self-contained. Its hashing and
twin-detection logic reads only `PATH` (candidates.jsonl) and `ART/candidate_features.parquet`.
The structural-identity definition (the authoritative twin logic) is not touched.

---

### FILE 6 — `build_reasoning_facts.py`
**Type:** P | **Risk:** LOW

**Current hardcoded paths (lines 4–5):**
```python
PATH = r"D:\Data Challenge India Runs\Datasets\candidates.jsonl"
ART  = r"D:\Data Challenge India Runs\Codes\artifacts"
```

**Proposed replacement:**
```python
from pathlib import Path
import os

_HERE = Path(__file__).resolve().parent
PATH  = Path(os.environ.get("CANDIDATES_PATH", str(_HERE.parent / "Datasets" / "candidates.jsonl")))
ART   = Path(os.environ.get("ARTIFACTS_DIR",   str(_HERE / "artifacts")))
```

**Risk justification:** Reads only `PATH` (candidates.jsonl), writes only
`ART/reasoning_facts.parquet`. No reasoning logic, no scoring. Pure I/O wrapper.

---

### FILE 7 — `rank.py`
**Type:** P | **Risk:** LOW-MED

**Current hardcoded paths (lines 15, 21):**
```python
ART = r"D:\Data Challenge India Runs\Codes\artifacts"
# ...
ap.add_argument("--out", default=r"D:\Data Challenge India Runs\Codes\submissions\team_redrob.csv")
```

**Proposed replacement:**
```python
from pathlib import Path
import os

_HERE = Path(__file__).resolve().parent
ART   = Path(os.environ.get("ARTIFACTS_DIR", str(_HERE / "artifacts")))
# ...
ap.add_argument("--out", default=str(_HERE / "submissions" / "team_redrob.csv"))
```

The `--features` and `--facts` defaults use `os.path.join(ART, ...)` which work
naturally once `ART` is a `Path`.

**Risk justification:** `rank.py` is the submission generator. The path change
affects only `ART` (artifact load location) and the `--out` default. The scoring
call `score_dataframe(df)`, reasoning call `reason(...)`, and self-checks are
not touched. `os.makedirs(os.path.dirname(args.out), exist_ok=True)` on line 24
works with both `str` and `Path`.

---

### FILE 8 — `calibrate_thresholds.py`
**Type:** E | **Risk:** LOW

**Current hardcoded path (line 7):**
```python
df = pd.read_parquet(r"D:\Data Challenge India Runs\Codes\artifacts\candidate_features.parquet")
```

**Proposed replacement:**
```python
from pathlib import Path
import os

_HERE = Path(__file__).resolve().parent
ART   = Path(os.environ.get("ARTIFACTS_DIR", str(_HERE / "artifacts")))

df = pd.read_parquet(ART / "candidate_features.parquet")
```

**Risk justification:** Development script only. One literal, one read call.
The scoring import and distribution analysis are untouched.

---

### FILE 9 — `simulate_ranking.py`
**Type:** E | **Risk:** LOW

**Current hardcoded path (line 14):**
```python
ART = r"D:\Data Challenge India Runs\Codes\artifacts"
```

**Proposed replacement:**
```python
from pathlib import Path
import os

_HERE = Path(__file__).resolve().parent
ART   = Path(os.environ.get("ARTIFACTS_DIR", str(_HERE / "artifacts")))
```

`os.path.join(ART, ...)` → `ART / "candidate_features.parquet"` (or leave as-is;
`os.path.join` accepts Path objects).

**Risk justification:** Silver-set simulation and ablation logic are untouched.
Only the parquet load path changes.

---

### FILE 10 — `build_gold_set.py`
**Type:** E | **Risk:** LOW

**Current hardcoded path (line 15):**
```python
ART = r"D:\Data Challenge India Runs\Codes\artifacts"
```

**Proposed replacement:**
```python
from pathlib import Path
import os

_HERE = Path(__file__).resolve().parent
ART   = Path(os.environ.get("ARTIFACTS_DIR", str(_HERE / "artifacts")))
```

**Risk justification:** Human-labeling sheet generator. No ranking logic.
Reads parquet, writes `gold_set_to_label.csv`. Minimal change.

---

### FILE 11 — `_featurize_tmp.py`
**Type:** E (scratch) | **Risk:** LOW

**Current hardcoded paths (lines 3, 87):**
```python
PATH = r"D:\Data Challenge India Runs\Datasets\candidates.jsonl"
# ...
candidate_features.to_csv(r"D:\Data Challenge India Runs\Datasets\candidate_features.csv", index=False)
```

**Proposed replacement:**
```python
from pathlib import Path
import os

_HERE  = Path(__file__).resolve().parent
PATH   = Path(os.environ.get("CANDIDATES_PATH", str(_HERE.parent / "Datasets" / "candidates.jsonl")))
OUT_CSV = Path(os.environ.get("DATASETS_DIR", str(_HERE.parent / "Datasets"))) / "candidate_features.csv"
# ...
candidate_features.to_csv(OUT_CSV, index=False)
```

**Risk justification:** Scratch script, not on ranking path. The featurize
logic (DEGREE_RANK, TIER_RANK, `smean`, `featurize`) is not touched.

---

### FILE 12 — `_mine_vocab.py`
**Type:** E (scratch) | **Risk:** LOW

**Current hardcoded path (line 4):**
```python
PATH = r"D:\Data Challenge India Runs\Datasets\candidates.jsonl"
```

**Proposed replacement:**
```python
from pathlib import Path
import os
_HERE = Path(__file__).resolve().parent
PATH  = Path(os.environ.get("CANDIDATES_PATH", str(_HERE.parent / "Datasets" / "candidates.jsonl")))
```

**Risk justification:** Print-only mining script. One path, zero logic change.

---

### FILE 13 — `_mine_evidence.py`
**Type:** E (scratch) | **Risk:** LOW

**Current hardcoded path (line 5):**
```python
PATH = r"D:\Data Challenge India Runs\Datasets\candidates.jsonl"
```

**Proposed replacement:** Identical pattern to `_mine_vocab.py` above.

**Risk justification:** Same — print-only analysis, zero logic change.

---

### FILE 14 — `analyze_candidates.py`
**Type:** E | **Risk:** LOW

**Current hardcoded paths (lines 9–10):**
```python
CSV = r"D:\Data Challenge India Runs\Datasets\candidate_features.csv"
OUT = r"D:\Data Challenge India Runs\Codes\analysis_outputs"
```

**Proposed replacement:**
```python
from pathlib import Path
import os

_HERE = Path(__file__).resolve().parent
_DS   = Path(os.environ.get("DATASETS_DIR", str(_HERE.parent / "Datasets")))
CSV   = _DS / "candidate_features.csv"
OUT   = Path(os.environ.get("ANALYSIS_OUT", str(_HERE / "analysis_outputs")))
```

**Risk justification:** EDA Stage A. CSV load and `os.makedirs(OUT)` are the
only path-dependent lines. All analysis logic is untouched.

---

### FILE 15 — `analyze_candidates_b.py`
**Type:** E | **Risk:** LOW

**Current hardcoded paths (lines 10–11):**
```python
CSV = r"D:\Data Challenge India Runs\Datasets\candidate_features.csv"
OUT = r"D:\Data Challenge India Runs\Codes\analysis_outputs"
```

**Proposed replacement:** Identical pattern to `analyze_candidates.py`.

**Risk justification:** EDA Stage B. PCA, visualisation, and quality-indicator
logic are untouched.

---

### FILE 16 — `quality_score.py`
**Type:** E | **Risk:** LOW

**Current hardcoded paths (lines 9–10):**
```python
CSV = r"D:\Data Challenge India Runs\Datasets\candidate_features.csv"
OUT = r"D:\Data Challenge India Runs\Codes\analysis_outputs"
```

**Proposed replacement:** Identical pattern to `analyze_candidates.py`.

**Risk justification:** EDA Stage C. Pillar weighting, percentile ranking,
tier banding, validation, and chart logic are untouched.

---

## 4. Paths Not in Python Files

`artifacts/_emb_log.txt` contains three absolute path references — but this is
a **log file** (captured stdout), not source code. It is not read by any script
and requires no migration. It should be excluded from VCS (`.gitignore`).

---

## 5. Complete Path-Type Inventory

| Logical path | Current literal | Env var override | Relative anchor |
|---|---|---|---|
| `candidates.jsonl` | `D:\...\Datasets\candidates.jsonl` | `CANDIDATES_PATH` | `_HERE.parent / "Datasets" / "candidates.jsonl"` |
| `Datasets/` dir | `D:\...\Datasets` | `DATASETS_DIR` | `_HERE.parent / "Datasets"` |
| `artifacts/` dir | `D:\...\Codes\artifacts` | `ARTIFACTS_DIR` | `_HERE / "artifacts"` |
| `analysis_outputs/` | `D:\...\Codes\analysis_outputs` | `ANALYSIS_OUT` | `_HERE / "analysis_outputs"` |
| `submissions/team_redrob.csv` | `D:\...\Codes\submissions\team_redrob.csv` | (CLI `--out`) | `_HERE / "submissions" / "team_redrob.csv"` |
| `Datasets/candidate_features.csv` | `D:\...\Datasets\candidate_features.csv` | `DATASETS_DIR` | `_HERE.parent / "Datasets" / "candidate_features.csv"` |

---

## 6. Files With Zero Path Issues (no changes needed)

| File | Reason |
|------|--------|
| `src/features.py` | Receives `ref: date` as arg; opens no files |
| `src/scoring.py` | Pure in-memory computation; no I/O |
| `src/evaluation.py` | Pure metrics; no I/O |
| `src/reasoning.py` | Pure string generation; no I/O |
| `src/taxonomies.py` | In-memory dicts; only `import re` |
| `src/jd_intent.py` | String constants only |
| `src/__init__.py` | One-line docstring |

---

## 7. Risk Summary

| File | Type | Hardcoded paths | Risk | Notes |
|------|------|-----------------|------|-------|
| `rank.py` | **P** | 2 | **MED** | Submission generator — test after change |
| `build_features.py` | **P** | 2 | **MED** | Argparse defaults only; `--candidates`/`--out` unaffected |
| `build_embeddings.py` | **P** | 2 | **MED** | `ART` used in 6 `os.path.join` calls |
| `finalize_embeddings.py` | **P** | 2 | **MED** | Imports `load_texts` from `build_embeddings` |
| `fix_twin_flag.py` | **P** | 2 | **LOW** | Self-contained; twin logic untouched |
| `build_reasoning_facts.py` | **P** | 2 | **LOW** | Pure I/O wrapper |
| `submissions/build_embeddings.py` | **D** | 2 | **N/A** | Delete; do not patch |
| `calibrate_thresholds.py` | **E** | 1 | **LOW** | Dev script; one read |
| `simulate_ranking.py` | **E** | 1 | **LOW** | Dev script; one read |
| `build_gold_set.py` | **E** | 1 | **LOW** | Dev script; one read + one write |
| `_featurize_tmp.py` | **E** | 2 | **LOW** | Scratch; not on ranking path |
| `_mine_vocab.py` | **E** | 1 | **LOW** | Print-only; zero logic |
| `_mine_evidence.py` | **E** | 1 | **LOW** | Print-only; zero logic |
| `analyze_candidates.py` | **E** | 2 | **LOW** | EDA; no ranking path |
| `analyze_candidates_b.py` | **E** | 2 | **LOW** | EDA; no ranking path |
| `quality_score.py` | **E** | 2 | **LOW** | EDA; no ranking path |

**Total: 30 path literals across 16 files. No logic change required in any file.**

---

## 8. Recommended Execution Order

If/when applying the fix, apply in this order to minimise risk:

1. **All 9 EDA/scratch files first** (11–16 in §3, plus `calibrate_thresholds.py`,
   `simulate_ranking.py`, `build_gold_set.py`) — zero impact on submission output.
2. **`build_reasoning_facts.py`** and **`fix_twin_flag.py`** — isolated I/O.
3. **`build_features.py`** — verify parquet output shape matches before/after.
4. **`build_embeddings.py`** + **`finalize_embeddings.py`** together (share the
   `load_texts` import; change both atomically).
5. **`rank.py`** last — run and verify CSV output is byte-for-byte identical
   to current `submissions/team_redrob.csv`.
6. **Delete `submissions/build_embeddings.py`** (duplicate).

---

## 9. Deployment Checklist (Railway / Render)

When deploying:

```bash
# Minimum required env vars when Datasets/ is not a sibling of the code root:
CANDIDATES_PATH=/path/to/candidates.jsonl
ARTIFACTS_DIR=/app/artifacts          # optional if code is at /app

# Optional (EDA scripts only):
DATASETS_DIR=/path/to/Datasets
ANALYSIS_OUT=/app/analysis_outputs
```

No changes to `src/` are needed. The five `src/` modules are purely computational.
