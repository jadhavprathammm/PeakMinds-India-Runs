# PeakMinds Talent Intelligence Platform

Monorepo for the PeakMinds platform.

## Structure

| Path | Description |
|---|---|
| `apps/web/` | Web frontend (planned) |
| `apps/api/` | REST / gRPC API service (planned) |
| `services/ranking-engine/` | Candidate ranking engine (active) |
| `data/` | Raw input data (git-ignored; place `candidates.jsonl` here) |
| `docs/` | Product, design, and engineering documentation |
| `scripts/` | Repository-level utility scripts |
| `infra/` | Deployment configuration (Railway, Render) |

## Quick start — ranking engine

```bash
cd services/ranking-engine
python rank.py
# Reads artifacts/candidate_features.parquet + artifacts/reasoning_facts.parquet
# Writes submissions/team_redrob.csv
```

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
