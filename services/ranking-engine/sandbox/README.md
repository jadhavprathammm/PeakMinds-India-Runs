# PeakMinds Sandbox

A runnable demo of the **real** ranking engine. A reviewer can load the bundled
100-candidate sample (or upload their own `candidates.jsonl`, ≤100 rows), run the
full pipeline on CPU, and download a ranked submission CSV — satisfying the
challenge's sandbox/demo requirement (spec §10.5).

What it actually runs (no shortcuts, no hosted LLMs):

```
records → src.features.extract        (deterministic 93-signal feature vector)
        → all-MiniLM-L6-v2 embeddings (semantic_fit, percentile-ranked in-sample)
        → src.scoring.score_dataframe (7-pillar S_fit × availability, gates, tiers)
        → src.reasoning.reason        (grounded, rule-based reasoning per candidate)
        → ranked CSV
```

## Run locally

```bash
cd services/ranking-engine
pip install -r sandbox/requirements.txt
streamlit run sandbox/app.py
```

Headless check (no browser, validates the engine end-to-end on the sample):

```bash
python sandbox/pipeline.py
```

## Deploy as the hosted sandbox link

**Streamlit Community Cloud** (free): point it at this repo, set the app file to
`services/ranking-engine/sandbox/app.py` and the requirements to
`services/ranking-engine/sandbox/requirements.txt`.

**HuggingFace Space** (Streamlit SDK): copy the `sandbox/` folder + `src/` into the
Space, set `app_file: sandbox/app.py`.

First run downloads the ~80 MB MiniLM model; subsequent runs are offline. For a
≤100-candidate sample the full pipeline completes in seconds on CPU.

## Notes

- `sample_candidates.jsonl` is 100 representative, **anonymized** profiles
  (every 1000th row of the full dataset; profiles carry `anonymized_name` only).
- Uncheck "Use semantic embeddings" to rank on the deterministic features alone
  (no model download) — useful for the fastest possible cold start.
