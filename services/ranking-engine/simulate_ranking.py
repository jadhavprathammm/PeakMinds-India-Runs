"""
Phase 3 ranking-quality simulation + ablation.
Builds a SILVER gold set from representative real candidates with rubric-derived EXPECTED
tiers (independent of the exact S weighting), then scores the challenge composite for the
full pipeline and for ablations (no-semantic / no-availability / no-gates).

This is a self-validation proxy; the real submission is validated against HUMAN gold labels
(build_gold_set.py). Expected tiers here follow the rubric's tier definitions, not S.
"""
import os, sys, numpy as np, pandas as pd
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.scoring import score_dataframe
from src.evaluation import composite, mrr, recall_at_k
_HERE = Path(__file__).resolve().parent
ART   = Path(os.environ.get("ARTIFACTS_DIR", str(_HERE / "artifacts")))
df = pd.read_parquet(ART / "candidate_features.parquet")
rng = 7

def sample(mask, k, rel, name):
    sub = df[mask].copy()
    sub = sub.sample(min(k, len(sub)), random_state=rng)
    sub["expected_rel"] = rel; sub["bucket"] = name
    return sub

hp = df["honeypot_flag"].astype(bool)
core = df["current_title_class"] == "core_ml"
adj = df["current_title_class"] == "ml_adjacent"
swe = df["current_title_class"] == "swe_generic"
non = df["current_title_class"] == "non_eng"
prod = df["current_company_class"].isin(["product", "ai_product"])
svc = df["gate_services_only"].astype(bool)

# EXPECTED tiers from rubric tier definitions (NOT from S):
buckets = [
    sample(core & prod & (df.evid_strong_ir >= 4) & df.yoe.between(5, 9) & (df.avail_modifier > 0.9) & ~hp, 12, 5, "T5 ideal"),
    sample(core & prod & (df.evid_strong_ir >= 2) & (~df.yoe.between(5, 9)) & ~hp, 12, 4, "T4 strong/out-of-band"),
    sample(adj & prod & ~hp, 12, 3, "T3 adjacent/transition"),
    sample(core & (df.avail_modifier < 0.65) & ~hp, 10, 3, "T3 strong-but-unavailable"),
    sample(swe & (df.evid_weak_hype >= 1) & (df.evid_strong_ir == 0) & ~hp, 12, 2, "T2 swe+llm-hype"),
    sample(svc & (core | adj), 10, 1, "T1 services-only ml"),
    sample(df.domain_cv >= 2, 10, 1, "T1 cv-domain"),
    sample(non & (df.evid_weak_hype >= 1) & ~hp, 12, 0, "T0 keyword-stuffer"),
    sample(hp, 12, 0, "T0 honeypot"),
]
gold = pd.concat(buckets).drop_duplicates("candidate_id").reset_index(drop=True)
print(f"Silver simulation set: {len(gold)} candidates")
print(gold.groupby("bucket")["expected_rel"].agg(["count", "mean"]).to_string())

def run(use_semantic, use_avail, use_gates, label):
    sc = score_dataframe(gold, use_semantic=use_semantic, use_avail=use_avail, use_gates=use_gates)
    sc = sc.sort_values(["S", "candidate_id"], ascending=[False, True])
    ranked = sc["expected_rel"].tolist()
    allr = gold["expected_rel"].tolist()
    m = composite(ranked, allr)
    print(f"  {label:28s} NDCG@10 {m['NDCG_10']:.3f} | NDCG@50 {m['NDCG_50']:.3f} | "
          f"MAP {m['MAP']:.3f} | P@10 {m['P_10']:.3f} | COMPOSITE {m['composite']:.3f} | "
          f"MRR {mrr(ranked):.3f} | R@50 {recall_at_k(ranked, allr, 50):.3f}")
    return m, sc

print("\n================ PIPELINE vs ABLATIONS (composite on silver set) ================")
full, scfull = run(True, True, True, "FULL hybrid pipeline")
run(False, True, True, "  - no semantic_fit")
run(True, False, True, "  - no availability modifier")
run(True, True, False, "  - no gates/honeypot filter")

# top of the full ranking on the silver set (sanity)
print("\nTop-10 of full pipeline on silver set (expected_rel should be ~5):")
cols = ["candidate_id", "bucket", "expected_rel", "current_title", "current_company", "yoe", "S", "tier"]
print(scfull.sort_values("S", ascending=False)[cols].head(10).to_string(index=False))
print("\nBottom-8 (expected_rel should be ~0, incl. honeypots/stuffers):")
print(scfull.sort_values("S", ascending=False)[cols].tail(8).to_string(index=False))
