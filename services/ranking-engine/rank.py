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


def build_ranking(features_path, facts_path=None, topk: int = 100):
    """The actual Redrob ranking pipeline — the single implementation used both by
    this CLI (to produce submissions/team_redrob.csv) and by the sandbox's Full
    Dataset mode. No duplication: both callers run this exact function.

    load features -> load reasoning facts -> score -> sort desc (tie-break by id
    asc) -> select top-k -> generate reasoning -> return.

    Returns a DataFrame with candidate_id, rank (1..k), score (float, rounded to
    6dp), reasoning, plus the underlying feature columns (tier, honeypot_flag,
    current_title, current_company, yoe, ...) so callers can display detail
    without re-scoring.
    """
    df = pd.read_parquet(features_path)
    facts = (pd.read_parquet(facts_path).set_index("candidate_id")
              if facts_path and os.path.exists(facts_path) else None)

    scored = score_dataframe(df)
    # Round FIRST, then sort by [score desc, candidate_id asc] so any equal scores
    # are id-ascending (validator tie-break requirement, §3).
    scored["score"] = scored["S"].round(6)
    scored = scored.sort_values(["score", "candidate_id"], ascending=[False, True]).reset_index(drop=True)
    top = scored.head(topk).copy()
    top["rank"] = np.arange(1, len(top) + 1)

    reasoning = []
    for _, r in top.iterrows():
        f = facts.loc[r["candidate_id"]].to_dict() if (facts is not None and r["candidate_id"] in facts.index) else {}
        reasoning.append(reason(r.to_dict(), f, band=band_for_rank(int(r["rank"]))))
    top["reasoning"] = reasoning
    return top


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--features", default=str(ART / "candidate_features.parquet"))
    ap.add_argument("--facts", default=str(ART / "reasoning_facts.parquet"))
    ap.add_argument("--out", default=str(_HERE / "submissions" / "team_redrob.csv"))
    ap.add_argument("--topk", type=int, default=100)
    args = ap.parse_args()
    os.makedirs(os.path.dirname(args.out), exist_ok=True)

    t0 = time.time()
    top = build_ranking(args.features, args.facts, args.topk)
    print(f"[rank] loaded and ranked {len(top):,} candidates in {time.time()-t0:.2f}s")

    out = pd.DataFrame({
        "candidate_id": top["candidate_id"],
        "rank": top["rank"].astype(int),
        "score": top["score"].map(lambda s: f"{s:.6f}"),
        "reasoning": top["reasoning"],
    })
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
