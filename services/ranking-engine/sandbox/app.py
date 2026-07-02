"""
PeakMinds — public sandbox (Streamlit).

Two modes:
  1. Full Competition Dataset (100,000 Candidates) — DEFAULT. Runs build_ranking()
     (from rank.py) against the committed competition artifacts. No upload, no
     live embeddings, no sampling: this is the exact code path that produced our
     officially submitted submissions/team_redrob.csv.
  2. Bring Your Own Candidates — upload your own candidates.jsonl (<=100 rows);
     features + semantic embeddings are computed live, on CPU, end to end.

Both modes end in a ranked Top-N with grounded reasoning and a downloadable CSV.

Run locally:   streamlit run sandbox/app.py
Deploy:        Streamlit Community Cloud / HuggingFace Space  (entrypoint = this file)
"""
import io
import json
import sys
from pathlib import Path

import pandas as pd
import streamlit as st

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pipeline import (  # noqa: E402
    rank_records, is_sorted_desc,
    rank_full_dataset, full_dataset_size,
)

MODE_BYO = "Bring Your Own Candidates"
MODE_FULL = "Full Competition Dataset (100,000 Candidates)"

st.set_page_config(page_title="PeakMinds — Ranking Sandbox", page_icon="▲", layout="wide")

st.title("PeakMinds — Talent Intelligence Sandbox")
st.caption(
    "Runs the real ranking engine end-to-end on CPU. No hosted LLM calls. "
    "The 7-pillar deterministic score + grounded reasoning are computed live."
)
st.success(
    "✅ **This is our officially submitted solution.** *Full Competition Dataset* mode "
    "below runs the exact code path that produced our submitted Top-100 "
    "(`services/ranking-engine/submissions/team_redrob.csv`)."
)

with st.sidebar:
    st.header("Input")
    mode = st.radio(
        "Mode", [MODE_BYO, MODE_FULL], index=1,
        help=(
            "Full Competition Dataset reproduces our official Top-100 submission "
            "ranking on all 100,000 candidates. Bring Your Own Candidates lets you "
            "upload a custom pool (<=100 rows) and watch the same engine score it live."
        ),
    )

    uploaded = None
    if mode == MODE_FULL:
        st.caption(
            "Runs the exact submission ranking path against the committed "
            "competition artifacts — no upload, no live embeddings, no sampling, "
            "no reimplementation. Reproduces `submissions/team_redrob.csv`."
        )
        topk = st.slider("Top-N to return", min_value=10, max_value=100, value=100, step=10)
        use_sem = True  # not applicable — semantic_fit is already baked into the committed artifact
    else:
        st.caption(
            "Upload a candidates.jsonl file (<=100 rows) to see the real engine "
            "extract features, embed, score, and explain a custom pool live."
        )
        uploaded = st.file_uploader("candidates.jsonl (<=100 rows recommended)", type=["jsonl", "json", "txt"])
        topk = st.slider("Top-N to return", min_value=10, max_value=100, value=100, step=10)
        use_sem = st.checkbox("Use semantic embeddings (all-MiniLM-L6-v2)", value=True,
                              help="First run downloads ~80 MB model. Uncheck for deterministic-only ranking.")

    run = st.button("Run ranking", type="primary")


def _read_uploaded(file) -> list[dict]:
    recs = []
    for line in io.StringIO(file.getvalue().decode("utf-8")):
        line = line.strip()
        if line:
            recs.append(json.loads(line))
    return recs


if run:
    try:
        if mode == MODE_FULL:
            dataset_size = full_dataset_size()
            scored_count = dataset_size
            with st.spinner(f"Ranking {dataset_size:,} candidates with the real submission engine…"):
                df = rank_full_dataset(topk=topk)
        else:
            if not uploaded:
                st.error("Upload a candidates.jsonl file first.")
                st.stop()
            records = _read_uploaded(uploaded)

            dataset_size = len(records)
            if dataset_size > 100:
                st.warning(
                    f"Loaded {dataset_size} candidates; this sandbox scores at most 100 at a "
                    "time (small-sample reproducibility check per the challenge spec — the full "
                    "100,000-candidate run is `services/ranking-engine/rank.py`, not this sandbox). "
                    "Scoring the first 100 as loaded; the rest are not included below."
                )
            records = records[:100]
            scored_count = len(records)

            with st.spinner(f"Scoring {scored_count} candidates with the real engine…"):
                df = rank_records(records, topk=topk, use_semantic=use_sem)

        scores = df["score"].tolist()
        sorted_desc = is_sorted_desc(scores)

        st.subheader("Official Submission Ranking" if mode == MODE_FULL else "Your Candidate Ranking")
        st.caption(
            f"All {scored_count} candidates were scored with the real model "
            f"(S = S_fit × availability), sorted highest → lowest, and only then "
            f"were the top {len(df)} selected for display below."
        )
        m1, m2, m3 = st.columns(3)
        m1.metric("Dataset size", f"{dataset_size:,} candidates")
        m2.metric("Candidates scored", f"{scored_count:,} candidates")
        m3.metric("Showing top", f"{len(df):,} ranked candidates")

        st.markdown("**Ranking verification**")
        v1, v2, v3, v4 = st.columns(4)
        v1.metric("Highest score", f"{scores[0]:.6f}")
        v2.metric("Lowest displayed score", f"{scores[-1]:.6f}")
        v3.metric("Sorted descending", "YES" if sorted_desc else "NO — BUG")
        v4.metric("Tier-5 in Top-10", int((df.head(10)["tier"] == 5).sum()))
        if not sorted_desc:
            st.error(
                "Ranking integrity check failed: displayed scores are not in descending "
                "order. This should never happen — please report it."
            )

        st.dataframe(
            df[["rank", "candidate_id", "score", "tier", "role", "company", "experience", "reasoning"]],
            use_container_width=True, hide_index=True,
        )

        csv = df[["candidate_id", "rank", "score", "reasoning"]].to_csv(index=False)
        st.download_button("Download submission CSV", csv, file_name="peakminds_ranking.csv", mime="text/csv")
    except Exception as e:
        st.exception(e)
else:
    if mode == MODE_FULL:
        st.info(
            "Press **Run ranking** to score the full committed competition dataset "
            "(100,000 candidates) using the exact submission ranking path — no "
            "uploads, no live embeddings, no sampling."
        )
    else:
        st.info(
            "Upload a candidates.jsonl file (<=100 rows) in the sidebar, then press **Run ranking**."
        )
