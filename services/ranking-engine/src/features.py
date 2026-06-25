"""
Phase 2 — per-candidate feature extraction implementing the approved rubric.
Pure-deterministic features (KW/DICT/DATE/NUM + honeypot + availability + gates).
`semantic_fit` is reserved (NaN) and filled by the embeddings sub-step.
"""
import numpy as np
from datetime import date
from . import taxonomies as tx

def _year(d):
    try: return int(str(d)[:4])
    except Exception: return None

def _months_between(start, end, ref_year, ref_month):
    sy, sm = _year(start), None
    try: sm = int(str(start)[5:7])
    except Exception: sm = 1
    if sy is None: return 0
    ey = _year(end) if end else ref_year
    try: em = int(str(end)[5:7]) if end else ref_month
    except Exception: em = ref_month
    return max(0, (ey - sy) * 12 + (em - sm))

def extract(r: dict, ref: date) -> dict:
    p = r.get("profile", {}) or {}
    ch = r.get("career_history", []) or []
    ed = r.get("education", []) or []
    sk = r.get("skills", []) or []
    ce = r.get("certifications", []) or []
    rs = r.get("redrob_signals", {}) or {}
    yoe = float(p.get("years_of_experience") or 0.0)
    f = {"candidate_id": r.get("candidate_id")}

    # ---- A. identity / experience
    f["yoe"] = yoe
    f["current_title"] = p.get("current_title", "")
    f["current_industry"] = p.get("current_industry", "")
    f["current_company"] = p.get("current_company", "")
    f["current_company_size"] = p.get("current_company_size", "")
    durs = [int(j.get("duration_months") or 0) for j in ch]
    f["n_jobs"] = len(ch)
    f["total_career_months"] = int(sum(durs))
    f["avg_tenure_months"] = float(np.mean(durs)) if durs else 0.0
    cur = [int(j.get("duration_months") or 0) for j in ch if j.get("is_current")]
    f["current_tenure_months"] = cur[0] if cur else 0
    f["n_short_stints"] = int(sum(1 for d in durs if 0 < d < 18))

    # ---- B. role-fit
    cls = tx.classify_title(p.get("current_title", ""))
    f["current_title_class"] = cls
    f["title_core_ml"] = cls == "core_ml"
    f["title_ml_adjacent"] = cls == "ml_adjacent"
    f["title_swe_generic"] = cls == "swe_generic"
    f["title_non_eng"] = cls == "non_eng"
    f["title_research"] = tx.title_is_research(p.get("current_title", ""))
    f["title_cv"] = tx.title_is_cv(p.get("current_title", ""))
    ml_months = 0
    hist_classes = []
    for j in ch:
        jc = tx.classify_title(j.get("title", ""))
        hist_classes.append(jc)
        if jc in ("core_ml", "ml_adjacent"):
            ml_months += int(j.get("duration_months") or 0)
    f["ml_role_months"] = ml_months
    f["applied_ml_years"] = round(ml_months / 12.0, 2)
    f["n_core_ml_jobs"] = int(sum(1 for c in hist_classes if c == "core_ml"))

    # ---- C. domain / IR evidence (summary + all descriptions)
    text = (p.get("summary", "") + " " + p.get("headline", "") + " " +
            " ".join(j.get("description", "") for j in ch))
    sc = tx.scan_text(text)
    f["evid_strong_ir"] = sc["strong_ir"]
    f["evid_med_ml"] = sc["med_ml"]
    f["evid_weak_hype"] = sc["weak_hype"]
    f["evid_eval"] = sc["eval"]
    f["evid_deploy"] = sc["deploy"]
    f["evid_scale"] = sc["scale"]
    f["domain_nlp_ir"] = sc["nlp_ir"]
    f["domain_cv"] = sc["cv"]
    f["has_retrieval_evidence"] = sc["strong_ir"] >= 1
    f["has_shipped_ranking"] = (sc["strong_ir"] >= 1) and (sc["deploy"] >= 1)
    f["has_eval_evidence"] = sc["eval"] >= 1
    f["has_production_evidence"] = sc["deploy"] >= 1
    f["domain_is_cv_primary"] = sc["cv"] >= 2 and sc["cv"] > sc["nlp_ir"]

    # ---- D. product vs services
    comp_classes = [tx.classify_company(j.get("company", ""), j.get("industry", "")) for j in ch]
    f["n_services_jobs"] = comp_classes.count("services")
    f["n_product_jobs"] = comp_classes.count("product")
    f["n_ai_product_jobs"] = comp_classes.count("ai_product")
    f["n_neutral_jobs"] = comp_classes.count("neutral")
    nz = len(comp_classes) or 1
    f["product_ratio"] = round((f["n_product_jobs"] + f["n_ai_product_jobs"]) / nz, 3)
    f["services_ratio"] = round(f["n_services_jobs"] / nz, 3)
    f["ever_product"] = (f["n_product_jobs"] + f["n_ai_product_jobs"]) >= 1
    f["all_jobs_services"] = (len(comp_classes) >= 1) and (f["n_services_jobs"] == len(comp_classes))
    f["ever_services_only"] = (f["n_services_jobs"] >= 1) and (f["n_product_jobs"] + f["n_ai_product_jobs"] == 0)
    cur_cls = tx.classify_company(p.get("current_company", ""), p.get("current_industry", ""))
    f["current_company_class"] = cur_cls
    f["current_is_services"] = cur_cls == "services"
    f["current_is_ai_product"] = cur_cls == "ai_product"

    # ---- E. pre-LLM depth
    ml_start_years = [_year(j.get("start_date")) for j, c in zip(ch, hist_classes)
                      if c in ("core_ml", "ml_adjacent") and _year(j.get("start_date"))]
    f["earliest_ml_year"] = min(ml_start_years) if ml_start_years else None
    f["has_pre_llm_ml"] = bool(ml_start_years) and min(ml_start_years) < 2021
    f["ai_evidence_recent_only"] = (sc["weak_hype"] >= 1) and (sc["strong_ir"] == 0) and (sc["med_ml"] <= 1)

    # ---- F. location / logistics
    tier_lbl, tier_score, is_india = tx.location_tier(p.get("location", ""), p.get("country", ""))
    f["location_city"] = tx.parse_city(p.get("location", ""))
    f["location_tier"] = tier_lbl
    f["location_score"] = tier_score
    f["is_india"] = is_india
    f["willing_to_relocate"] = bool(rs.get("willing_to_relocate"))
    notice = rs.get("notice_period_days")
    f["notice_period_days"] = int(notice) if notice is not None else None
    f["notice_score"] = round(float(np.clip(1 - max(0, (notice or 90) - 30) / 150.0, 0, 1)), 3)
    f["preferred_work_mode"] = rs.get("preferred_work_mode", "")
    sal = rs.get("expected_salary_range_inr_lpa") or {}
    f["expected_salary_min"] = sal.get("min")
    f["expected_salary_max"] = sal.get("max")

    # ---- G. availability
    la = rs.get("last_active_date")
    days_since = None
    if la:
        try:
            ly, lm, ld = int(la[:4]), int(la[5:7]), int(la[8:10])
            days_since = (ref - date(ly, lm, ld)).days
        except Exception:
            days_since = None
    f["last_active_date"] = la
    f["days_since_active"] = days_since
    recency = float(np.clip(1 - (days_since if days_since is not None else 240) / 240.0, 0, 1))
    f["activity_recency_score"] = round(recency, 3)
    rrr = float(rs.get("recruiter_response_rate") or 0.0)
    icr = float(rs.get("interview_completion_rate") or 0.0)
    otw = 1.0 if rs.get("open_to_work_flag") else 0.0
    f["recruiter_response_rate"] = rrr
    f["interview_completion_rate"] = icr
    f["open_to_work_flag"] = bool(rs.get("open_to_work_flag"))
    f["applications_30d"] = rs.get("applications_submitted_30d")
    f["avg_response_time_hours"] = rs.get("avg_response_time_hours")
    f["avail_modifier"] = round(float(np.clip(
        0.50 + 0.25 * recency + 0.20 * rrr + 0.10 * otw + 0.05 * icr, 0.50, 1.10)), 4)

    # ---- H. trust / validation
    f["profile_completeness_score"] = rs.get("profile_completeness_score")
    f["verified_email"] = bool(rs.get("verified_email"))
    f["verified_phone"] = bool(rs.get("verified_phone"))
    f["linkedin_connected"] = bool(rs.get("linkedin_connected"))
    gh = rs.get("github_activity_score")
    f["github_activity_score"] = float(gh) if (gh is not None and gh != -1) else np.nan
    f["has_github"] = (gh is not None and gh != -1)
    f["certification_count"] = len(ce)
    f["best_edu_tier"] = min((tx.TIER_RANK.get(e.get("tier"), 5) for e in ed), default=5)
    f["has_ml_degree"] = any((e.get("field_of_study", "").strip().lower() in tx.ML_FIELDS) for e in ed)

    # ---- I. honeypot consistency flags
    skill_durs = [int(s.get("duration_months") or 0) for s in sk]
    n_expert = sum(1 for s in sk if s.get("proficiency") in ("advanced", "expert"))
    hp = {}
    hp["hp_expert0"] = any(s.get("proficiency") in ("advanced", "expert") and (s.get("duration_months") or 0) == 0 for s in sk)
    hp["hp_skilldur_gt_career"] = any(d > yoe * 12 + 6 for d in skill_durs) if yoe > 0 else False
    hp["hp_tenure_gt_career"] = bool(durs) and max(durs) > yoe * 12 + 6
    hp["hp_sum_overlap"] = sum(durs) > yoe * 12 * 1.6 + 12 if yoe > 0 else False
    hp["hp_current_enddate"] = any(j.get("is_current") and j.get("end_date") for j in ch)
    edu_bad = False
    for e in ed:
        sy, ey = e.get("start_year"), e.get("end_year")
        if sy and ey and (sy > ey or ey > 2027):
            edu_bad = True
    hp["hp_edu_impossible"] = edu_bad
    hp["hp_end_before_start"] = any(
        j.get("end_date") and j.get("start_date") and j["end_date"] < j["start_date"] for j in ch)
    hp["hp_expert_overload"] = n_expert >= 12
    hp["hp_senior_no_history"] = (yoe >= 8) and (sum(durs) < 24)
    f.update(hp)
    # Hard set = genuine internal impossibilities only. hp_skilldur_gt_career and
    # hp_expert_overload are EXCLUDED: skill duration_months is drawn independently of
    # yoe in this synthetic data, so they fire on normal juniors (noise, not honeypots).
    hard = ["hp_expert0", "hp_tenure_gt_career", "hp_sum_overlap", "hp_current_enddate",
            "hp_edu_impossible", "hp_end_before_start", "hp_senior_no_history"]
    reasons = [k for k in hard if hp[k]]
    f["honeypot_flag"] = len(reasons) >= 1
    f["honeypot_reasons"] = ",".join(reasons)

    # ---- J. precomputed gate booleans (rubric §4)
    eng_ish = cls in ("core_ml", "ml_adjacent", "swe_generic")
    f["gate_services_only"] = f["all_jobs_services"]                       # entire career at services firms
    f["gate_research_only"] = f["title_research"] and (sc["deploy"] == 0)  # research title, no production
    f["gate_cv_primary"] = f["domain_is_cv_primary"] and sc["nlp_ir"] == 0
    f["gate_recent_llm_only"] = (eng_ish and sc["weak_hype"] >= 1 and sc["strong_ir"] == 0
                                 and sc["med_ml"] <= 1 and not f["has_pre_llm_ml"])
    f["gate_wrong_role_stuffer"] = (cls == "non_eng") and (sc["strong_ir"] + sc["med_ml"] == 0)

    # ---- reserved for embeddings sub-step
    f["semantic_fit"] = np.nan
    return f
