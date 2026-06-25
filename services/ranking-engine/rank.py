"""
Redrob ranking pipeline — produces the top-100 submission CSV.
Loads precomputed artifacts only (no network, no GPU) and runs well under 5 min on CPU.

  python rank.py --features artifacts/candidate_features.parquet \
                 --facts artifacts/reasoning_facts.parquet \
                 --out submissions/team_xxx.csv
"""
import argparse, csv, os, sys, time
from pathlib import Path
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.scoring import score_dataframe
from src.reasoning import reason, band_for_rank

_HERE = Path(__file__).resolve().parent
ART   = Path(os.environ.get("ARTIFACTS_DIR", str(_HERE / "artifacts")))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--features", default=str(ART / "candidate_features.parquet"))
    ap.add_argument("--facts", default=str(ART / "reasoning_facts.parquet"))
    ap.add_argument("--out", default=str(_HERE / "submissions" / "team_redrob.csv"))
    ap.add_argument("--topk", type=int, default=100)
    args = ap.parse_args()
    os.makedirs(os.path.dirname(args.out), exist_ok=True)

    t0 = time.time()
    df = pd.read_parquet(args.features)
    facts = pd.read_parquet(args.facts).set_index("candidate_id") if os.path.exists(args.facts) else None
    print(f"[rank] loaded {len(df):,} candidates in {time.time()-t0:.2f}s")

    scored = score_dataframe(df)
    # Round FIRST, then sort by [score desc, candidate_id asc] so any equal scores
    # are id-ascending (validator tie-break requirement, §3).
    scored["score"] = scored["S"].round(6)
    scored = scored.sort_values(["score", "candidate_id"], ascending=[False, True]).reset_index(drop=True)
    top = scored.head(args.topk).copy()
    top["rank"] = np.arange(1, len(top) + 1)

    # reasoning
    out_rows = []
    for _, r in top.iterrows():
        f = facts.loc[r["candidate_id"]].to_dict() if (facts is not None and r["candidate_id"] in facts.index) else {}
        txt = reason(r.to_dict(), f, band=band_for_rank(int(r["rank"])))
        out_rows.append({"candidate_id": r["candidate_id"], "rank": int(r["rank"]),
                         "score": f"{r['score']:.6f}", "reasoning": txt})

    out = pd.DataFrame(out_rows, columns=["candidate_id", "rank", "score", "reasoning"])
    out.to_csv(args.out, index=False, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
    dt = time.time() - t0
    print(f"[rank] wrote {len(out)} rows -> {args.out} | total {dt:.2f}s (budget 300s)")

    # quick self-check
    assert out["rank"].tolist() == list(range(1, len(out)+1))
    assert out["candidate_id"].is_unique
    s = out["score"].astype(float).to_numpy()
    assert np.all(np.diff(s) <= 1e-9), "score not non-increasing"
    print(f"[rank] self-check OK | tiers in top-{args.topk}:",
          top["tier"].value_counts().sort_index(ascending=False).to_dict(),
          "| honeypots:", int(top["honeypot_flag"].sum()))
    print("\n[rank] head of submission:")
    for _, r in out.head(5).iterrows():
        print(f"  #{r['rank']:>3} {r['candidate_id']} {r['score']}  {r['reasoning']}")
    print("  ...")
    for _, r in out.tail(2).iterrows():
        print(f"  #{r['rank']:>3} {r['candidate_id']} {r['score']}  {r['reasoning']}")

if __name__ == "__main__":
    main()
