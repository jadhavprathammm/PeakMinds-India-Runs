# Smoke-Test Checklist — Path Portability Migration

Run these checks in order to confirm the ranking pipeline still produces correct output.
All commands are run from `Codes/` unless stated otherwise.

---

## 0. Prerequisites

```
Data Challenge India Runs/
├── Codes/         ← working directory for all commands
└── Datasets/
    └── candidates.jsonl   ← must exist
```

---

## 1. Syntax check (< 1 s)

```bash
python -m py_compile _mine_vocab.py _mine_evidence.py _featurize_tmp.py \
    analyze_candidates.py analyze_candidates_b.py quality_score.py \
    calibrate_thresholds.py simulate_ranking.py build_gold_set.py \
    build_reasoning_facts.py fix_twin_flag.py build_features.py \
    build_embeddings.py finalize_embeddings.py rank.py
```

**Pass:** exits with no output.

---

## 2. Path resolution dry-run (< 1 s)

```bash
python - <<'EOF'
from pathlib import Path
import os, sys
sys.path.insert(0, ".")

scripts = {
    "build_features":       ("DEF_CAND", "DEF_OUT"),
    "build_embeddings":     ("DEF_CAND", "ART"),
    "finalize_embeddings":  ("ART", "CAND"),
    "fix_twin_flag":        ("ART", "PATH"),
    "build_reasoning_facts":("PATH", "ART"),
    "rank":                 ("ART",),
}

import importlib, types
for mod_name, attrs in scripts.items():
    spec = importlib.util.spec_from_file_location(mod_name, f"{mod_name}.py")
    mod  = types.ModuleType(mod_name)
    exec(open(f"{mod_name}.py").read().split("def main")[0].split("def load_texts")[0], mod.__dict__)
    for attr in attrs:
        val = getattr(mod, attr, None)
        print(f"  {mod_name}.{attr} = {val!r}")
print("OK")
EOF
```

**Pass:** every path prints without `D:\`, all `ART`/`_DS` values end with
`artifacts` or `Datasets`, and "OK" is printed.

---

## 3. Rank.py self-check against prebuilt artifacts (< 30 s)

This is the golden-path test. Artifacts are already built; only `rank.py` runs.

```bash
python rank.py
```

**Pass criteria (all must hold):**

- `[rank] self-check OK` appears in output.
- `submissions/team_redrob.csv` is written.
- CSV has exactly 100 rows (excluding header).
- Ranks are 1–100, contiguous, no gaps.
- `candidate_id` column has no duplicates.
- `score` column is non-increasing (rank 1 has highest score).

Quick verification:
```bash
python - <<'EOF'
import pandas as pd, numpy as np
df = pd.read_csv("submissions/team_redrob.csv")
assert len(df) == 100,                          f"Expected 100 rows, got {len(df)}"
assert list(df["rank"]) == list(range(1, 101)), "Ranks not 1–100"
assert df["candidate_id"].is_unique,            "Duplicate candidate_ids"
s = df["score"].astype(float).to_numpy()
assert np.all(np.diff(s) <= 1e-9),             "Score not non-increasing"
print("CSV validation PASSED")
EOF
```

---

## 4. Byte-for-byte regression check (optional but recommended)

If you kept a copy of the pre-migration `submissions/team_redrob.csv`
(it was not touched by the migration), confirm the output is identical:

```bash
# On Windows PowerShell:
(Get-FileHash "submissions\team_redrob.csv").Hash

# Compare to hash you recorded before migration
```

Because `rank.py` only changed its path defaults (not scoring or tie-breaking),
the output CSV **must be byte-identical** to the pre-migration version.

---

## 5. Env-var override test (< 30 s)

Verify that the `ARTIFACTS_DIR` env var correctly overrides the default:

```bash
# PowerShell
$env:ARTIFACTS_DIR = "artifacts"   # same as the default — should work identically
python rank.py
# Should produce identical output

# Then unset it
Remove-Item Env:\ARTIFACTS_DIR
```

---

## 6. EDA scripts path resolution spot-check (< 5 s each)

These scripts read the legacy `Datasets/candidate_features.csv`.
Run only if that file exists. They are not on the ranking path.

```bash
python -c "
import analyze_candidates, pathlib
print('CSV:', analyze_candidates.CSV)
print('OUT:', analyze_candidates.OUT)
print('CSV exists:', pathlib.Path(str(analyze_candidates.CSV)).exists())
"
```

**Pass:** printed `CSV` path points to `Datasets/candidate_features.csv`
relative to the repo, and `CSV exists: True`.

---

## 7. Cross-platform path format check (< 1 s)

```bash
python - <<'EOF'
from pathlib import Path
import os

_HERE = Path(".").resolve()
ART   = Path(os.environ.get("ARTIFACTS_DIR", str(_HERE / "artifacts")))
CAND  = Path(os.environ.get("CANDIDATES_PATH",
             str(_HERE.parent / "Datasets" / "candidates.jsonl")))

assert "/" in str(ART) or "\\" in str(ART)   # has a separator
assert "D:" not in str(ART),  f"Absolute Windows path leaked: {ART}"
assert "D:" not in str(CAND), f"Absolute Windows path leaked: {CAND}"
print(f"ART  = {ART}")
print(f"CAND = {CAND}")
print("Path format OK")
EOF
```

---

## 8. Deleted duplicate check (< 1 s)

```bash
python - <<'EOF'
import os
assert not os.path.exists("submissions/build_embeddings.py"), \
    "Duplicate submissions/build_embeddings.py still exists!"
print("Duplicate confirmed absent")
EOF
```

---

## Summary

| # | Test | Time | Blocker? |
|---|------|------|----------|
| 1 | Syntax compile | < 1 s | Yes |
| 2 | Path resolution dry-run | < 1 s | Yes |
| 3 | rank.py self-check | < 30 s | Yes |
| 4 | Byte-for-byte CSV regression | < 1 s | Recommended |
| 5 | Env-var override | < 30 s | Recommended |
| 6 | EDA path spot-check | < 5 s | Optional |
| 7 | Cross-platform format | < 1 s | Optional |
| 8 | Duplicate absent | < 1 s | Yes |

Tests 1, 2, 3, 8 are the minimum required to confirm the migration is correct.
Test 3 (rank.py self-check) is the definitive end-to-end gate.
