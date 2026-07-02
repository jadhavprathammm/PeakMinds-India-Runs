"""
PeakMinds — public sandbox (Streamlit).

A judge can: load the bundled 100-candidate sample OR upload their own
candidates.jsonl (<=100 rows), run the real ranking engine end-to-end on CPU,
inspect the ranked Top-N with grounded reasoning, and download the submission CSV.

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
from pipeline import rank_records, load_sample, is_sorted_desc, SAMPLE_PATH  # noqa: E402

st.set_page_config(page_title="PeakMinds — Ranking Sandbox", page_icon="▲", layout="wide")

st.title("PeakMinds — Talent Intelligence Sandbox")
st.caption(
    "Runs the real ranking engine end-to-end on CPU. No hosted LLM calls. "
    "The 7-pillar deterministic score + grounded reasoning are computed live."
)

with st.sidebar:
    st.header("Input")
    src = st.radio("Candidate source", ["Bundled 100-candidate sample", "Upload candidates.jsonl"])
    uploaded = None
    if src == "Upload candidates.jsonl":
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
        if src.startswith("Bundled"):
            records = load_sample()
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

        st.subheader("Ranking result")
        st.caption(
            f"All {scored_count} candidates were scored with the real model "
            f"(S = S_fit × availability), sorted highest → lowest, and only then "
            f"were the top {len(df)} selected for display below."
        )
        m1, m2, m3 = st.columns(3)
        m1.metric("Dataset size", f"{dataset_size} candidates")
        m2.metric("Candidates scored", f"{scored_count} candidates")
        m3.metric("Showing top", f"{len(df)} ranked candidates")

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
    st.info(
        f"Pick a source in the sidebar and press **Run ranking**. "
        f"The bundled sample lives at `{SAMPLE_PATH.name}` (100 representative, anonymized profiles)."
    )
