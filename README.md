# PeakMinds Talent Intelligence Platform

Monorepo for the PeakMinds platform.

## Structure

| Path | Description |
|---|---|
| `apps/web/` | Next.js site — homepage, `/architecture`, `/top-100`, `/why-peakminds` (active) |
| `apps/api/` | REST / gRPC API service (planned) |
| `services/ranking-engine/` | Candidate ranking engine + sandbox demo (active) |
| `data/` | Raw input data (git-ignored; place `candidates.jsonl` here for a rebuild) |
| `docs/` | Product, design, and engineering documentation |
| `scripts/` | Repository-level utility scripts |
| `infra/` | Deployment configuration (Railway, Render) |
| `submission_metadata.yaml` | Challenge portal metadata (spec §10.3) |

## Quick start — reproduce the submission (single command)

```bash
cd services/ranking-engine
python rank.py
# Reads the committed artifacts/candidate_features.parquet + reasoning_facts.parquet
# Writes submissions/team_redrob.csv  (runs in seconds on CPU; no data download needed)
```

## Runnable sandbox / demo

```bash
cd services/ranking-engine
pip install -r sandbox/requirements.txt
streamlit run sandbox/app.py     # load the bundled 100-candidate sample or upload your own
```

The website's Top-100 and workspace data are generated from the real ranking
output — never hand-edited — via `python services/ranking-engine/export_web_data.py`.

See [services/ranking-engine/README.md](services/ranking-engine/README.md) for the full pipeline.

## Data setup

Place `candidates.jsonl` at `data/candidates.jsonl` before running build scripts,
or set the `CANDIDATES_PATH` environment variable to its location.

## Documentation

- [Product Specification](docs/product/product-spec.md)
- [Design System](docs/design/design-system.md)
- [Ranking Architecture](docs/ranking-engine/ranking_architecture.md)
- [Relevance Rubric](docs/ranking-engine/relevance_rubric.md)
- [Engineering Assessments](docs/engineering/)
