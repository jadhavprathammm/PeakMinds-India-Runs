"""
Offline precompute of grounded facts for the reasoning column (so rank.py stays fast/offline).
Saves artifacts/reasoning_facts.parquet: candidate_id, top_skills, current_snippet.
"""
import io, json, os
from pathlib import Path
import pandas as pd
_HERE = Path(__file__).resolve().parent
PATH  = Path(os.environ.get("CANDIDATES_PATH", str(_HERE.parent.parent / "data" / "candidates.jsonl")))
ART   = Path(os.environ.get("ARTIFACTS_DIR",   str(_HERE / "artifacts")))

rows = []
with io.open(PATH, encoding="utf-8") as f:
    for line in f:
        if not line.strip(): continue
        r = json.loads(line); ch = r.get("career_history", []) or []
        sk = sorted(r.get("skills", []) or [], key=lambda s: (s.get("endorsements") or 0), reverse=True)
        top = ", ".join(s.get("name", "") for s in sk[:3] if s.get("name"))
        snip = ""
        for j in ch:
            if j.get("is_current") and j.get("description"):
                snip = j["description"].strip().replace("\n", " ")[:140]; break
        if not snip and ch and ch[0].get("description"):
            snip = ch[0]["description"].strip().replace("\n", " ")[:140]
        rows.append((r["candidate_id"], top, snip))

df = pd.DataFrame(rows, columns=["candidate_id", "top_skills", "current_snippet"])
df.to_parquet(os.path.join(ART, "reasoning_facts.parquet"), index=False)
print(f"saved reasoning_facts.parquet: {df.shape}")
print(df.head(3).to_string(index=False))
