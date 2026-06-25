"""
Gold-set labeling instrument (Phase 4 methodology).
Stratified sample of candidates across the rubric's decision boundaries, exported as a
CSV for INDEPENDENT human tier-labeling (0-5). Strata are chosen so the hard cases
(stuffers, services-only, inactive-but-strong, honeypots, adjacent) are over-represented
relative to their population share -- that is where ranking quality is decided.

Process:
  1. Two raters independently fill `human_tier` (0-5) + `notes` reading each profile in
     sample_candidates / candidates.jsonl. `model_tier`/`S` are hidden during labeling.
  2. Reconcile disagreements > 1 tier; record adjudicated `gold_tier`.
  3. Run evaluate against gold_tier; tune weights by ablation; re-label any systematic misses.
"""
import os, numpy as np, pandas as pd
from pathlib import Path
_HERE = Path(__file__).resolve().parent
ART   = Path(os.environ.get("ARTIFACTS_DIR", str(_HERE.parent / "artifacts")))
df = pd.read_parquet(ART / "candidate_features.parquet")
rng = np.random.default_rng(42)

def pick(mask, k, name):
    sub = df[mask]
    take = sub.sample(min(k, len(sub)), random_state=7) if len(sub) else sub
    take = take.copy(); take["stratum"] = name
    return take

strata = []
core = df["current_title_class"] == "core_ml"
adj = df["current_title_class"] == "ml_adjacent"
swe = df["current_title_class"] == "swe_generic"
non = df["current_title_class"] == "non_eng"
prod = df["current_company_class"].isin(["product", "ai_product"])
hp = df["honeypot_flag"].astype(bool)

strata += [pick(core & prod & (df.evid_strong_ir >= 4) & df.yoe.between(5, 9) & (df.avail_modifier > 0.9) & ~hp, 25, "A_ideal_T5ish")]
strata += [pick(core & prod & (df.evid_strong_ir.between(1, 3)) & ~hp, 18, "B_core_some_evid")]
strata += [pick(core & (df.avail_modifier < 0.7) & ~hp, 12, "C_strong_but_inactive")]
strata += [pick(adj & ~hp, 20, "D_ml_adjacent_transition")]
strata += [pick(swe & (df.evid_weak_hype >= 1) & (df.evid_strong_ir == 0) & ~hp, 15, "E_swe_llm_hype")]
strata += [pick(non & (df.evid_weak_hype >= 1) & ~hp, 18, "F_nonneng_keyword_stuffer")]
strata += [pick(df.gate_services_only.astype(bool) & (core | adj), 10, "G_services_only_ml")]
strata += [pick(df.domain_cv >= 2, 10, "H_cv_domain")]
strata += [pick(hp, min(60, int(hp.sum())), "I_honeypot")]
strata += [pick(~hp, 20, "J_random")]

gold = pd.concat(strata).drop_duplicates("candidate_id").reset_index(drop=True)
cols = ["candidate_id", "stratum", "current_title", "current_company", "current_company_class",
        "yoe", "applied_ml_years", "evid_strong_ir", "evid_weak_hype", "semantic_fit",
        "avail_modifier", "location_tier", "honeypot_flag"]
sheet = gold[cols].copy()
sheet["human_tier"] = ""      # rater fills 0-5
sheet["notes"] = ""
out = os.path.join(ART, "gold_set_to_label.csv")
sheet.to_csv(out, index=False)
print(f"gold labeling sheet -> {out}  ({len(sheet)} candidates across {sheet['stratum'].nunique()} strata)")
print(sheet["stratum"].value_counts().to_string())
