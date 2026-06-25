"""
Phase 2 runner — stream candidates.jsonl, extract rubric features, save reusable artifact.
Usage: python build_features.py [--candidates PATH] [--out DIR] [--limit N]
"""
import argparse, io, json, os, sys, time
from datetime import date
from pathlib import Path
import numpy as np, pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.features import extract

_HERE    = Path(__file__).resolve().parent
DEF_CAND = os.environ.get("CANDIDATES_PATH", str(_HERE.parent.parent / "data" / "candidates.jsonl"))
DEF_OUT  = os.environ.get("ARTIFACTS_DIR",   str(_HERE / "artifacts"))

def find_ref_date(path, sample=20000):
    """Anchor 'today' to the max last_active_date in the data."""
    mx = "0000"
    with io.open(path, encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i >= sample: break
            if not line.strip(): continue
            la = (json.loads(line).get("redrob_signals") or {}).get("last_active_date") or ""
            if la > mx: mx = la
    y, m, d = int(mx[:4]), int(mx[5:7]), int(mx[8:10])
    return date(y, m, d)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidates", default=DEF_CAND)
    ap.add_argument("--out", default=DEF_OUT)
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    ref = find_ref_date(args.candidates)
    print(f"[build_features] ref_date (today) anchored to {ref}")
    t0 = time.time()
    rows = []
    with io.open(args.candidates, encoding="utf-8") as f:
        for i, line in enumerate(f):
            if not line.strip(): continue
            rows.append(extract(json.loads(line), ref))
            if args.limit and len(rows) >= args.limit: break
            if (i + 1) % 20000 == 0:
                print(f"  parsed {i+1:,} ... {time.time()-t0:.1f}s")
    df = pd.DataFrame(rows)
    print(f"[build_features] extracted {df.shape[0]:,} rows x {df.shape[1]} cols in {time.time()-t0:.1f}s")

    # dtype tidy
    bool_cols = [c for c in df.columns if df[c].dtype == bool]
    for c in bool_cols:
        df[c] = df[c].astype("boolean")

    saved = None
    try:
        import pyarrow  # noqa
        p = os.path.join(args.out, "candidate_features.parquet")
        df.to_parquet(p, index=False)
        saved = p
    except Exception as e:
        print(f"[build_features] parquet unavailable ({e}); writing csv.gz")
        p = os.path.join(args.out, "candidate_features_full.csv.gz")
        df.to_csv(p, index=False, compression="gzip")
        saved = p
    print(f"[build_features] saved -> {saved}")

    # ---- quick QA summary ----
    print("\n==== QA SUMMARY ====")
    print("rows:", len(df), "| cols:", df.shape[1])
    print("title classes:\n", df["current_title_class"].value_counts().to_string())
    print("\nhoneypot_flag:", int(df["honeypot_flag"].sum()),
          "| reasons breakdown:")
    for c in ["hp_expert0","hp_skilldur_gt_career","hp_tenure_gt_career","hp_sum_overlap",
              "hp_current_enddate","hp_edu_impossible","hp_end_before_start","hp_senior_no_history","hp_expert_overload"]:
        print(f"   {c}: {int(df[c].sum())}")
    print("\ngate counts:")
    for c in ["gate_services_only","gate_research_only","gate_cv_primary","gate_recent_llm_only","gate_wrong_role_stuffer"]:
        print(f"   {c}: {int(df[c].sum())}")
    print("\nhas_retrieval_evidence:", int(df["has_retrieval_evidence"].sum()),
          "| has_shipped_ranking:", int(df["has_shipped_ranking"].sum()),
          "| has_eval_evidence:", int(df["has_eval_evidence"].sum()))
    print("location tiers:\n", df["location_tier"].value_counts().to_string())
    print("\ncurrent_company_class:\n", df["current_company_class"].value_counts().to_string())
    print("\navail_modifier: mean %.3f  min %.3f  max %.3f" %
          (df["avail_modifier"].mean(), df["avail_modifier"].min(), df["avail_modifier"].max()))

    # candidates that look strong on the deterministic core (sanity peek)
    strong = df[(df["current_title_class"]=="core_ml") & (df["has_retrieval_evidence"]) &
                (~df["honeypot_flag"].astype(bool)) & (df["ever_product"]==True)]
    print(f"\nCore-ML + retrieval-evidence + product + non-honeypot: {len(strong)} candidates")
    cols = ["candidate_id","current_title","current_company","yoe","evid_strong_ir",
            "evid_eval","product_ratio","avail_modifier"]
    print(strong.sort_values("evid_strong_ir", ascending=False)[cols].head(12).to_string(index=False))

if __name__ == "__main__":
    main()
