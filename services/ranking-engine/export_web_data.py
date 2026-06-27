"""
Export the website's Top-100 display data + engine findings DIRECTLY from the
real ranking outputs, so the site can never diverge from the submission.

Sources of truth (no hand-editing):
  - submissions/team_redrob.csv          (candidate_id, rank, score, reasoning)
  - artifacts/candidate_features.parquet (roles, companies, yoe, evidence flags)
  - artifacts/reasoning_facts.parquet    (top-3 endorsed skills per candidate)

Output:
  - apps/web/src/lib/top100data.ts       (TOP_100, SCORE_RANGE, FINDINGS)

Run:  python services/ranking-engine/export_web_data.py
"""
import json
import os
import sys
from pathlib import Path

import pandas as pd

_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE))
from src.scoring import score_dataframe  # noqa: E402

ART = _HERE / "artifacts"
SUB = _HERE / "submissions" / "team_redrob.csv"
WEB_LIB = _HERE.parent.parent / "apps" / "web" / "src" / "lib"
OUT = WEB_LIB / "top100data.ts"
OUT_WS = _HERE.parent.parent / "apps" / "web" / "src" / "components" / "workspace" / "candidates.generated.ts"

# real fit-score pillar weights (kept in sync with src/scoring.py W)
PILLARS_W = [
    ("Role fit", "sc_role", 0.42),
    ("Experience", "sc_exp", 0.18),
    ("Production depth", "sc_prod", 0.12),
    ("Pre-LLM ML depth", "sc_prellm", 0.08),
    ("Location & availability", "sc_loc", 0.08),
    ("Tenure stability", "sc_tenure", 0.07),
    ("Trust signals", "sc_trust", 0.05),
]


def _concern_from_reasoning(text: str) -> str:
    for marker in ("Concern:", "Watch:", "Caveat:"):
        if marker in text:
            return text.split(marker, 1)[1].strip().rstrip(".")
    return ""


def write_workspace(top: pd.DataFrame) -> None:
    """Emit the homepage workspace demo (Top 15) entirely from real engine output."""
    ws = top[top["rank"] <= 15].copy()
    cands = []
    for _, r in ws.iterrows():
        # real positive pillar contributions (points = weight x sub-score x 100)
        ledger = []
        for label, col, w in PILLARS_W:
            pts = round(float(r.get(col, 0.0) or 0.0) * w * 100)
            if pts > 0:
                ledger.append({"label": label, "weight": pts})
        ledger.sort(key=lambda x: -x["weight"])
        concern = _concern_from_reasoning(str(r.get("reasoning", "")))
        if concern:
            ledger.append({"label": concern, "weight": -1})  # caveat (not a scored penalty)

        evidence = []
        if r.get("has_shipped_ranking"):
            evidence.append("Shipped retrieval / ranking to production")
        elif r.get("has_production_evidence"):
            evidence.append("Production-deployment evidence")
        if r.get("has_eval_evidence"):
            evidence.append("NDCG / MRR / A·B evaluation signal")
        if r.get("has_pre_llm_ml"):
            evidence.append("Pre-LLM ML roots (started before 2021)")
        if r.get("current_company_class") == "ai_product":
            evidence.append(f"AI-product company: {r['current_company']}")
        amly = int(round(float(r.get("applied_ml_years", 0) or 0)))
        if amly >= 3:
            evidence.append(f"{amly} yrs applied ML")

        skills = [s.strip() for s in str(r.get("top_skills") or "").split(",") if s.strip()][:4]
        cands.append(
            {
                "id": r["candidate_id"],
                "rank": int(r["rank"]),
                "score": round(float(r["score"]), 4),
                "role": str(r["current_title"]),
                "company": str(r["current_company"]),
                "experience": int(round(float(r["yoe"]))),
                "appliedMl": amly,
                "tags": skills,
                "ledger": ledger,
                "evidence": evidence,
                "summary": str(r.get("reasoning", "")),
            }
        )

    # filter chips = most common real skills across the 15 (guaranteed to match tags)
    from collections import Counter
    counter = Counter(t for c in cands for t in c["tags"])
    chips = [t for t, _ in counter.most_common(7)]

    ts = [
        "// AUTO-GENERATED — DO NOT EDIT BY HAND.",
        "// Source of truth: team_redrob.csv + candidate_features.parquet + reasoning_facts.parquet",
        "// Regenerate: python services/ranking-engine/export_web_data.py",
        "import type { WorkspaceCandidate } from \"./types\";",
        "",
        f"export const FILTER_CHIPS = {json.dumps(chips, ensure_ascii=False)} as const;",
        "",
        f"export const CANDIDATES: WorkspaceCandidate[] = {json.dumps(cands, ensure_ascii=False, indent=2)};",
        "",
    ]
    OUT_WS.write_text("\n".join(ts), encoding="utf-8")
    print(f"[export] wrote {len(cands)} workspace candidates -> {OUT_WS}")


def pct(series_bool) -> int:
    return round(100 * series_bool.fillna(False).astype(bool).mean())


def main() -> None:
    sub = pd.read_csv(SUB)
    feat = pd.read_parquet(ART / "candidate_features.parquet")
    facts = pd.read_parquet(ART / "reasoning_facts.parquet")

    scored = score_dataframe(feat).rename(columns={"score": "_score_internal"})
    top = (
        sub.merge(scored, on="candidate_id", how="left")
        .merge(facts[["candidate_id", "top_skills"]], on="candidate_id", how="left")
        .sort_values("rank")
        .reset_index(drop=True)
    )

    # ---- per-candidate display rows (every value traceable to source) ----
    rows = []
    for _, r in top.iterrows():
        skills = [s.strip() for s in str(r.get("top_skills") or "").split(",") if s.strip()]
        rows.append(
            {
                "id": r["candidate_id"],
                "rank": int(r["rank"]),
                "score": round(float(r["score"]), 4),     # real model score from the CSV
                "role": str(r["current_title"]),
                "company": str(r["current_company"]),
                "experience": int(round(float(r["yoe"]))),  # matches reasoning's {yoe:.0f}
                "tier": int(r["tier"]),                     # rubric tier (all finalists = 5)
                "skills": skills,
            }
        )

    score_range = {"min": round(float(sub["score"].min()), 4), "max": round(float(sub["score"].max()), 4)}

    # ---- engine findings, computed from the real top-100 (no invented numbers) ----
    b = lambda c: top[c]  # noqa: E731
    findings = [
        {"stat": f"{pct(b('has_production_evidence'))}%",
         "label": "of finalists show production-deployment evidence in their history."},
        {"stat": f"{pct(b('has_shipped_ranking'))}%",
         "label": "have personally shipped a retrieval / ranking system to production."},
        {"stat": f"{pct(b('has_pre_llm_ml'))}%",
         "label": "have pre-LLM ML roots — applied ML before 2021, not just recent GenAI."},
        {"stat": f"{pct(top['yoe'] >= 5)}%",
         "label": f"have 5+ years of experience (mean {top['yoe'].mean():.1f} yrs)."},
        {"stat": f"{pct(b('has_eval_evidence'))}%",
         "label": "show explicit ranking-evaluation signal (NDCG / MRR / A·B testing)."},
        {"stat": f"{pct(top['current_company_class'].isin(['product', 'ai_product']))}%",
         "label": "are currently at product or AI-product companies, not services firms."},
    ]

    # ---- emit TypeScript ----
    ts = []
    ts.append("// AUTO-GENERATED — DO NOT EDIT BY HAND.")
    ts.append("// Source of truth: services/ranking-engine/submissions/team_redrob.csv")
    ts.append("//   + artifacts/candidate_features.parquet + reasoning_facts.parquet")
    ts.append("// Regenerate: python services/ranking-engine/export_web_data.py")
    ts.append("")
    ts.append("export type RankedEntry = {")
    ts.append("  id: string;")
    ts.append("  rank: number;")
    ts.append("  score: number; // real model score from team_redrob.csv (S = S_fit x availability)")
    ts.append("  role: string;")
    ts.append("  company: string;")
    ts.append("  experience: number; // years")
    ts.append("  tier: number; // rubric tier 0-5 (every finalist clears the Tier-5 bar, S >= 0.80)")
    ts.append("  skills: string[]; // top-3 endorsed skills from the candidate profile")
    ts.append("};")
    ts.append("")
    ts.append("export type Finding = { stat: string; label: string };")
    ts.append("")
    ts.append(f"export const SCORE_RANGE = {json.dumps(score_range)};")
    ts.append("")
    ts.append(f"export const FINDINGS: Finding[] = {json.dumps(findings, ensure_ascii=False, indent=2)};")
    ts.append("")
    ts.append(f"export const TOP_100: RankedEntry[] = {json.dumps(rows, ensure_ascii=False, indent=2)};")
    ts.append("")

    OUT.write_text("\n".join(ts), encoding="utf-8")
    print(f"[export] wrote {len(rows)} candidates -> {OUT}")

    write_workspace(top)
    print(f"[export] score range {score_range} | tiers {sorted(top['tier'].unique())}")
    print("[export] findings:")
    for f in findings:
        print(f"   {f['stat']:>5}  {f['label']}")


if __name__ == "__main__":
    main()
