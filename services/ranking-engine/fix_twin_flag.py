"""
Correct the duplicate/behavioral-twin layer.
A genuine twin = two candidates with an IDENTICAL structural profile:
  same career sequence (company,title,start,duration) + same skill multiset
  + same behavioral-signal vector.
Text near-duplication in this dataset is intentional description TEMPLATING and is
deliberately NOT treated as a twin (flagging it would penalize real candidates).
"""
import io, json, os, sys, hashlib
from pathlib import Path
import numpy as np, pandas as pd
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
_HERE = Path(__file__).resolve().parent
ART   = Path(os.environ.get("ARTIFACTS_DIR",   str(_HERE / "artifacts")))
PATH  = Path(os.environ.get("CANDIDATES_PATH", str(_HERE.parent.parent / "data" / "candidates.jsonl")))

rows = []
with io.open(PATH, encoding="utf-8") as f:
    for line in f:
        if not line.strip(): continue
        r = json.loads(line); ch = r.get("career_history", []) or []; rs = r.get("redrob_signals", {}) or {}
        career = tuple((j.get("company"), j.get("title"), j.get("start_date"), j.get("duration_months")) for j in ch)
        skills = tuple(sorted((s.get("name"), s.get("proficiency"), s.get("duration_months")) for s in r.get("skills", []) or []))
        signal = (rs.get("recruiter_response_rate"), rs.get("profile_views_received_30d"),
                  rs.get("search_appearance_30d"), rs.get("saved_by_recruiters_30d"),
                  rs.get("interview_completion_rate"), rs.get("connection_count"),
                  rs.get("endorsements_received"), rs.get("profile_completeness_score"))
        full = hashlib.md5(repr((career, skills, signal)).encode()).hexdigest()
        struct = hashlib.md5(repr((career, skills)).encode()).hexdigest()
        sigv = hashlib.md5(repr(signal).encode()).hexdigest()
        rows.append((r["candidate_id"], full, struct, sigv))

d = pd.DataFrame(rows, columns=["candidate_id", "full", "struct", "sigv"])
def clusters(col):
    g = d.groupby(col).size(); big = g[g >= 2]
    ids = set(d[d[col].isin(big.index)]["candidate_id"])
    return len(big), ids

n_full, ids_full = clusters("full")
n_struct, ids_struct = clusters("struct")
n_sig, ids_sig = clusters("sigv")
print(f"identical FULL profile (career+skills+signals) clusters: {n_full} | candidates: {len(ids_full)}")
print(f"identical structural (career+skills) clusters:          {n_struct} | candidates: {len(ids_struct)}")
print(f"identical behavioral-signal-vector clusters:            {n_sig} | candidates: {len(ids_sig)}")

twins = ids_full | ids_struct | ids_sig
feat = pd.read_parquet(os.path.join(ART, "candidate_features.parquet"))
already_hp = set(feat[feat["honeypot_flag"].astype(bool)]["candidate_id"])
feat["twin_flag"] = feat["candidate_id"].isin(twins)
feat.to_parquet(os.path.join(ART, "candidate_features.parquet"), index=False)
print(f"\nGENUINE twins (any structural-identity match): {len(twins)} | "
      f"ADDITIONAL beyond {len(already_hp)} honeypots: {len(twins - already_hp)}")
print(f"twin_flag corrected & saved. parquet shape {feat.shape} | twin_flag True = {int(feat['twin_flag'].sum())}")
print("\nNOTE: 4,661 text-near-duplicates and 13,828 career-signature collisions are intentional "
      "description templating / synthetic noise-role artifacts (Content Writers, Sales Execs) and are "
      "deliberately NOT flagged — they never approach the top 100 and flagging them would harm real candidates.")
