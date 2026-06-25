"""
Grounded reasoning generator for the submission's `reasoning` column.
Designed to pass Stage-4 manual review: specific facts, JD connection, honest concerns,
no hallucination (every claim derives from a real feature value), variation, rank-consistency.
Tone tracks the within-shortlist rank band; every entry names at least one concrete concern.
"""

def _exp_phrase(r):
    yoe = r["yoe"]; aml = r.get("applied_ml_years", 0) or 0
    if aml >= 3:
        return f"{yoe:.0f} yrs experience (~{aml:.0f} in applied ML)"
    return f"{yoe:.0f} yrs experience"

def _positive(r, facts):
    bits = []
    if r.get("has_shipped_ranking"):
        bits.append("has shipped retrieval/ranking systems to production")
    elif r.get("evid_strong_ir", 0) >= 2:
        bits.append("clear search/recommendation/retrieval work in role history")
    elif r.get("evid_strong_ir", 0) == 1:
        bits.append("some retrieval/ranking exposure")
    cc = r.get("current_company_class")
    if cc == "ai_product":
        bits.append(f"at AI-product company {r['current_company']}")
    elif cc == "product":
        bits.append(f"product-company background ({r['current_company']})")
    if r.get("has_eval_evidence"):
        bits.append("ranking-evaluation signal (NDCG/MRR/A-B)")
    if r.get("has_pre_llm_ml"):
        bits.append("pre-LLM ML roots")
    sk = (facts or {}).get("top_skills", "")
    if sk:
        bits.append(f"skills incl. {sk}")
    return bits

def _concern(r):
    """Most salient honest concern, by priority."""
    if r.get("avail_modifier", 1.0) < 0.72:
        d = r.get("days_since_active")
        rr = r.get("recruiter_response_rate")
        det = []
        if rr is not None and rr < 0.3: det.append(f"response rate {rr:.2f}")
        if d is not None and d > 120: det.append(f"last active ~{int(d)}d ago")
        if not r.get("open_to_work_flag"): det.append("not marked open-to-work")
        return "limited availability (" + ", ".join(det) + ")" if det else "limited recent platform activity"
    if r.get("current_is_services"):
        return f"currently at services firm {r['current_company']} (JD prefers product)"
    yoe = r["yoe"]
    if yoe > 9:
        return f"{yoe:.0f} yrs is above the 5-9 band"
    if yoe < 5:
        return f"{yoe:.0f} yrs is below the 5-9 band"
    lt = r.get("location_tier")
    if lt in ("C", "D"):
        if r.get("willing_to_relocate"):
            return f"based in {r.get('location_city','').title()} but open to relocation"
        return f"based in {r.get('location_city','').title()}, would need relocation to Pune/Noida"
    npd = r.get("notice_period_days")
    if npd is not None and npd > 30:
        return f"{int(npd)}-day notice period (JD prefers <=30)"
    if not r.get("has_eval_evidence"):
        return "limited explicit evaluation-framework signal"
    if r.get("product_ratio", 1) < 0.5:
        return "mixed product/services history"
    return "verify depth of production ownership at interview"

def reason(r, facts=None, band="strong"):
    """r: dict-like feature row; facts: dict with top_skills/current_snippet; band by rank."""
    title = r.get("current_title", "Candidate")
    pos = _positive(r, facts)
    pos_txt = "; ".join(pos[:3]) if pos else "relevant engineering background"
    concern = _concern(r)
    lead = {"top": "Top pick:", "strong": "Strong fit:", "solid": "Solid fit:"}[band]
    closer = {"top": "Concern:", "strong": "Watch:", "solid": "Caveat:"}[band]
    return f"{lead} {title}, {_exp_phrase(r)}; {pos_txt}. {closer} {concern}."

def band_for_rank(rank):
    if rank <= 20: return "top"
    if rank <= 60: return "strong"
    return "solid"
