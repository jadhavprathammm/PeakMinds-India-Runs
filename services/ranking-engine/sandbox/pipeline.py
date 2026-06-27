"""
End-to-end ranking on a SMALL candidate sample (<=100), for the public sandbox.

This is the same engine as the full pipeline (src/features, src/scoring,
src/reasoning, src/jd_intent), just run inline on an in-memory sample instead of
reading precomputed artifacts — so a judge can paste/upload candidates and watch
the real ranker produce a ranked CSV in seconds, on CPU, with no network at
score time (the embedding model is the only first-run download).

Importable + headless-testable:  rank_records(records) -> pandas.DataFrame
"""
from __future__ import annotations

import os
import sys
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd

_HERE = Path(__file__).resolve().parent
_ENGINE = _HERE.parent
sys.path.insert(0, str(_ENGINE))

from src.features import extract                       # noqa: E402
from src.scoring import score_dataframe, TIER_CUTS     # noqa: E402
from src.reasoning import reason, band_for_rank        # noqa: E402
from src.jd_intent import JD_INTENT, JD_EXEMPLARS      # noqa: E402

SAMPLE_PATH = _HERE / "sample_candidates.jsonl"
_EMB_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def _ref_date(records: list[dict]) -> date:
    """Anchor 'today' to the latest last_active_date in the sample (deterministic)."""
    latest = None
    for r in records:
        la = (r.get("redrob_signals") or {}).get("last_active_date")
        if la:
            try:
                d = date(int(la[:4]), int(la[5:7]), int(la[8:10]))
                latest = d if latest is None or d > latest else latest
            except Exception:
                pass
    return latest or date(2025, 1, 1)


def _add_semantic_fit(df: pd.DataFrame, records: list[dict], enable: bool) -> pd.DataFrame:
    """Compute semantic_fit exactly as build_embeddings does, scoped to the sample.

    If sentence-transformers / the model is unavailable, fall back to a neutral
    semantic_fit (0.5) so scoring still runs (score_dataframe handles NaN too).
    """
    if not enable:
        df["semantic_fit"] = np.nan
        return df
    try:
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer(_EMB_MODEL, device="cpu")
        jd_mat = model.encode([JD_INTENT] + JD_EXEMPLARS, normalize_embeddings=True, convert_to_numpy=True)
        jd_vec = jd_mat.mean(0)
        jd_vec /= np.linalg.norm(jd_vec)

        by_id = {r["candidate_id"]: r for r in records}
        prof_text, career_text = [], []
        for cid in df["candidate_id"]:
            r = by_id.get(cid, {})
            p = r.get("profile", {}) or {}
            ch = r.get("career_history", []) or []
            prof_text.append(((p.get("headline", "") or "") + ". " + (p.get("summary", "") or "")).strip())
            career_text.append(" ".join((j.get("description", "") or "") for j in ch))

        emb_prof = model.encode(prof_text, normalize_embeddings=True, convert_to_numpy=True)
        emb_car = model.encode(career_text, normalize_embeddings=True, convert_to_numpy=True)
        sem_cos = 0.4 * (emb_prof @ jd_vec) + 0.6 * (emb_car @ jd_vec)
        df["semantic_fit"] = pd.Series(sem_cos, index=df.index).rank(pct=True)
    except Exception as e:  # pragma: no cover - environment fallback
        print(f"[sandbox] semantic disabled ({e}); ranking on deterministic features only")
        df["semantic_fit"] = np.nan
    return df


def rank_records(records: list[dict], topk: int = 100, use_semantic: bool = True) -> pd.DataFrame:
    """Run the real engine on an in-memory candidate list. Returns a ranked frame."""
    if not records:
        raise ValueError("no candidate records provided")
    ref = _ref_date(records)
    feats = pd.DataFrame([extract(r, ref) for r in records])
    feats = _add_semantic_fit(feats, records, enable=use_semantic)

    scored = score_dataframe(feats, use_semantic=feats["semantic_fit"].notna().any())
    scored["score"] = scored["S"].round(6)
    scored = scored.sort_values(["score", "candidate_id"], ascending=[False, True]).reset_index(drop=True)
    top = scored.head(topk).copy()
    top["rank"] = np.arange(1, len(top) + 1)

    rows = []
    for _, r in top.iterrows():
        rows.append(
            {
                "candidate_id": r["candidate_id"],
                "rank": int(r["rank"]),
                "score": round(float(r["score"]), 6),
                "role": r.get("current_title", ""),
                "company": r.get("current_company", ""),
                "experience": int(round(float(r.get("yoe", 0) or 0))),
                "tier": int(r.get("tier", 0)),
                "reasoning": reason(r.to_dict(), {}, band=band_for_rank(int(r["rank"]))),
            }
        )
    return pd.DataFrame(rows)


def load_sample() -> list[dict]:
    import io
    import json

    out = []
    with io.open(SAMPLE_PATH, encoding="utf-8") as f:
        for line in f:
            if line.strip():
                out.append(json.loads(line))
    return out


if __name__ == "__main__":
    # Headless smoke test: rank the bundled sample and print the top 10.
    recs = load_sample()
    df = rank_records(recs)
    print(f"[sandbox] ranked {len(recs)} candidates -> top {len(df)}")
    print(df.head(10)[["rank", "candidate_id", "score", "tier", "role", "company"]].to_string(index=False))
    assert df["rank"].tolist() == list(range(1, len(df) + 1)), "ranks not contiguous"
    assert df["candidate_id"].is_unique, "duplicate ids"
    assert np.all(np.diff(df["score"].to_numpy()) <= 1e-9), "score not non-increasing"
    print("[sandbox] self-check OK")
