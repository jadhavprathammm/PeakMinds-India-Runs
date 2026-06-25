"""
Phase 3 — ranking score.
Vectorized implementation of relevance_rubric.md §8:
  additive fit score (S_fit) x availability modifier, then hard gates cap the tier
  and depress S for ordering. Outputs continuous S, tier (0-5), and gate audit.
"""
import numpy as np
import pandas as pd

# fit-score pillar weights (sum = 1.0)
W = dict(role=0.42, exp=0.18, prod=0.12, prellm=0.08, loc=0.08, tenure=0.07, trust=0.05)

TITLE_FIT = {"core_ml": 1.0, "ml_adjacent": 0.6, "swe_generic": 0.25, "non_eng": 0.0}

# tier cutoffs on penalized S (calibrated against the 100k S distribution; T5 = elite ~0.25%)
TIER_CUTS = [(5, 0.80), (4, 0.62), (3, 0.45), (2, 0.30), (1, 0.15)]  # else 0

# gate -> (multiplicative S penalty, tier cap)
GATES = {
    "gate_wrong_role_stuffer": (0.10, 1),
    "gate_services_only":      (0.50, 1),
    "gate_research_only":      (0.60, 1),
    "gate_cv_primary":         (0.60, 2),
    "gate_recent_llm_only":    (0.60, 2),
}

def _col(df, name, default=0.0):
    return df[name] if name in df.columns else pd.Series(default, index=df.index)

def score_dataframe(df: pd.DataFrame, use_semantic=True, use_avail=True, use_gates=True) -> pd.DataFrame:
    d = df.copy()
    n = len(d)

    # ---------- sub-scores (each in [0,1]) ----------
    title_fit = d["current_title_class"].map(TITLE_FIT).fillna(0.0).to_numpy()
    evid = np.clip((d["evid_strong_ir"]*1.0 + d["evid_med_ml"]*0.3
                    + d["evid_eval"]*0.6 + d["evid_deploy"]*0.2).to_numpy()/6.0, 0, 1)
    if use_semantic:
        sem = d["semantic_fit"].fillna(d["semantic_fit"].median()).to_numpy()
        role = 0.30*title_fit + 0.40*sem + 0.30*evid
    else:
        role = 0.50*title_fit + 0.50*evid   # ablation: no semantic signal

    yoe = d["yoe"].fillna(0).to_numpy()
    years_band = np.exp(-((yoe - 7.0)/3.0)**2)
    amly = np.clip(d["applied_ml_years"].fillna(0).to_numpy()/4.0, 0, 1)
    scale = np.clip(d["evid_scale"].fillna(0).to_numpy()/2.0, 0, 1)
    exp = 0.45*years_band + 0.40*amly + 0.15*scale

    gh = d["github_activity_score"].to_numpy()
    has_gh = d["has_github"].fillna(False).astype(bool).to_numpy()
    gh_val = np.where(has_gh, np.nan_to_num(gh)/100.0, 0.0)
    certs = np.clip(d["certification_count"].fillna(0).to_numpy()/2.0, 0, 1)
    ext_val = np.clip(0.7*gh_val + 0.3*certs, 0, 1)
    prod = np.clip(0.6*d["product_ratio"].fillna(0).to_numpy()
                   + 0.2*d["current_is_ai_product"].fillna(False).astype(bool).to_numpy()
                   + 0.2*ext_val, 0, 1)

    pre = d["has_pre_llm_ml"].fillna(False).astype(bool).to_numpy()
    amly_yrs = d["applied_ml_years"].fillna(0).to_numpy()
    medml = d["evid_med_ml"].fillna(0).to_numpy()
    prellm = np.where(pre, 1.0, np.where(amly_yrs >= 2, 0.5, np.where(medml >= 1, 0.3, 0.0)))
    prellm = np.where(d["gate_recent_llm_only"].fillna(False).astype(bool).to_numpy(), 0.0, prellm)

    loc = d["location_score"].fillna(0.25).to_numpy().copy()
    relo = d["willing_to_relocate"].fillna(False).astype(bool).to_numpy()
    tierC = (d["location_tier"] == "C").to_numpy()
    loc = np.where(tierC & relo, np.maximum(loc, 0.80), loc)
    notice = d["notice_score"].fillna(0.4).to_numpy()
    location = 0.6*loc + 0.4*notice

    tenure_s = np.clip(d["avg_tenure_months"].fillna(0).to_numpy()/30.0, 0, 1)
    hop_pen = np.clip(d["n_short_stints"].fillna(0).to_numpy()*0.2, 0, 0.6)
    tenure = np.clip(tenure_s - hop_pen, 0, 1)

    trust = np.clip(0.4*d["profile_completeness_score"].fillna(0).to_numpy()/100.0
                    + 0.2*d["verified_email"].fillna(False).astype(bool).to_numpy()
                    + 0.2*d["verified_phone"].fillna(False).astype(bool).to_numpy()
                    + 0.2*d["linkedin_connected"].fillna(False).astype(bool).to_numpy(), 0, 1)

    d["sc_role"], d["sc_exp"], d["sc_prod"] = role, exp, prod
    d["sc_prellm"], d["sc_loc"], d["sc_tenure"], d["sc_trust"] = prellm, location, tenure, trust

    S_fit = (W["role"]*role + W["exp"]*exp + W["prod"]*prod + W["prellm"]*prellm
             + W["loc"]*location + W["tenure"]*tenure + W["trust"]*trust)
    d["S_fit"] = S_fit
    avail = d["avail_modifier"].fillna(0.79).to_numpy()
    S = S_fit * avail if use_avail else S_fit.copy()

    # ---------- hard gates: penalize S + cap tier ----------
    tier_cap = np.full(n, 5)
    gate_audit = np.array([""]*n, dtype=object)
    if use_gates:
        for g, (pen, cap) in GATES.items():
            hit = d[g].fillna(False).astype(bool).to_numpy()
            S = np.where(hit, S*pen, S)
            tier_cap = np.where(hit, np.minimum(tier_cap, cap), tier_cap)
            gate_audit = np.where(hit, np.char.add(gate_audit.astype(str), (g.replace("gate_","")+";")), gate_audit)
        drop = (d["honeypot_flag"].fillna(False).astype(bool).to_numpy()
                | d.get("twin_flag", pd.Series(False, index=d.index)).fillna(False).astype(bool).to_numpy())
    else:
        drop = np.zeros(n, dtype=bool)
    S = np.where(drop, -1.0, S)
    d["S"] = S

    # ---------- tier assignment ----------
    tier = np.zeros(n, dtype=int)
    for t, cut in TIER_CUTS:
        tier = np.where((S >= cut) & (tier == 0), t, tier)
    tier = np.minimum(tier, tier_cap)
    tier = np.where(drop, 0, tier)
    d["tier"] = tier
    d["gate_audit"] = np.where(drop, "honeypot/twin;", gate_audit)
    return d
