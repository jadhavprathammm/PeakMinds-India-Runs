# PeakMinds — Talent Intelligence Platform

**Official submission — Redrob / India Runs AI Hiring Challenge.**

PeakMinds ranks 100,000 candidate profiles for a Senior AI Engineer (retrieval/ranking)
role and produces an explainable, reproducible Top-100 shortlist — entirely offline,
CPU-only, with no hosted LLM calls at ranking time.

## Quick Links

| | |
|---|---|
| 🚀 **Live Demo** | [peakminds-ai.streamlit.app](https://peakminds-ai.streamlit.app) |
| 🎥 **Demo Video** | [youtu.be/_xaAdhEKpi8](https://youtu.be/_xaAdhEKpi8) |
| 🏗️ **Architecture** | [Jump to section](#architecture) |
| 📋 **Submission Details** | [submission_metadata.yaml](submission_metadata.yaml) · [team_redrob.csv](services/ranking-engine/submissions/team_redrob.csv) |

## Live Demo

| | Link |
|---|---|
| 🌐 Website | [peak-minds-india-runs.vercel.app](https://peak-minds-india-runs.vercel.app/) |
| 🧪 Interactive sandbox | [peakminds-ai.streamlit.app](https://peakminds-ai.streamlit.app) — runs the real ranking engine live, in your browser |
| 📄 Official submission | [`services/ranking-engine/submissions/team_redrob.csv`](services/ranking-engine/submissions/team_redrob.csv) |

## The problem

Traditional resume screeners ask one question: *"how closely does this candidate
match the job description?"* That's necessary but incomplete — it says nothing
about whether a candidate's profile is internally consistent, how confident the
system should be in its own judgment, or whether the ranking would survive
scrutiny of *why* a candidate landed where they did.

## The solution

PeakMinds reduces every candidate to **94 deterministic, auditable signals**
(role class, applied-ML years, retrieval/eval/production evidence, product-vs-services
history, pre-LLM depth, location, availability, trust) plus a **384-dimensional
semantic relevance score** from `all-MiniLM-L6-v2`, measured against a JD-intent
query. These combine into a transparent 7-pillar weighted fit score, refined by
hard gates and honeypot detection, so every rank comes with a grounded,
fact-checked explanation — never a black box.

## Key Features

- **Candidate ranking** — a 7-pillar weighted score (role, experience, production
  evidence, pre-LLM depth, location, tenure, trust) combined with a real semantic
  embedding, scored and sorted across the full 100,000-candidate pool.
- **Explainable scoring** — every Top-100 entry carries a rule-based, non-LLM
  reasoning string built directly from that candidate's own feature values —
  concrete facts and one honest concern, never generic praise, never a fabricated claim.
- **Team Intelligence** *(apps/web)* — a separate module that scores a candidate
  not just against the job description but against an existing team's extracted
  "Team DNA": skill/domain/seniority/leadership/work-style compatibility, plus a
  net-new "contribution" score for what a candidate uniquely adds. See
  [Team Intelligence](#team-intelligence) below.
- **Interactive sandbox** — a public Streamlit app that runs the *actual* ranking
  engine live, in two modes, with no setup required. See [Sandbox Modes](#sandbox-modes).

## Architecture

```
data/candidates.jsonl (100,000 profiles)
        │
        ▼
build_features.py ──► candidate_features.parquet   (94 deterministic signals)
        │
        ▼
build_embeddings.py ──► all-MiniLM-L6-v2 (384-d) ──► semantic_fit merged into parquet
        │                 (one-time offline precompute; NOT part of the timed ranking step)
        ▼
build_reasoning_facts.py ──► reasoning_facts.parquet  (top skills, current-role snippet)
        │
        ▼
rank.py :: build_ranking()  ──►  score → sort desc → select Top-100 → generate reasoning
        │
        ▼
submissions/team_redrob.csv   (candidate_id, rank, score, reasoning)
        │
        ├──► sandbox/app.py — Streamlit sandbox, imports build_ranking() directly
        └──► export_web_data.py — regenerates the website's data from the real output
```

`rank.py::build_ranking()` is the single implementation of the ranking pipeline —
the CLI and the sandbox's Full Competition Dataset mode both call this exact
function, so there is no risk of the demo diverging from the submission.

## Ranking Engine

**Location:** [`services/ranking-engine/`](services/ranking-engine/) —
see its [README](services/ranking-engine/README.md) for the full breakdown.

```
S_fit = 0.42·role + 0.18·experience + 0.12·production + 0.08·pre-LLM
        + 0.08·location + 0.07·tenure + 0.05·trust

S = S_fit × availability_modifier      (availability ∈ [0.50, 1.10])
```

- **5 hard gates** penalize and tier-cap off-profile candidates (wrong-role
  stuffing, services-only history, research-only, CV-primary, recent-LLM-only).
- **7 enforced honeypot rules** (of 9 computed) catch internally-impossible
  profiles — impossible tenure, overlapping timelines, expert skills claimed
  with zero months of use, impossible education dates — and exclude them.
- **Fully offline at ranking time** — no network calls, no GPU, deterministic,
  reproducible from the committed feature artifacts via a single command.

## Team Intelligence

**Location:** [`apps/web/src/engines/team-intelligence/`](apps/web/src/engines/team-intelligence/)

Traditional ranking asks "does this candidate match the job?" Team Intelligence
adds two more questions: **"how well will they fit the existing team?"** and
**"what new capability will they add that the team doesn't already have?"** It
extracts a team's "DNA" (skills, domains, seniority, leadership style, work
style, and gaps) from uploaded team documents, then scores each candidate's
**Compatibility** (fit with what the team already has) and **Contribution**
(net-new value beyond what the team already has) separately — because the
candidate with the highest job-match score is not always the best hire for a
specific team's actual gaps. Every insight is evidence-cited back to the source
document it was extracted from, and the underlying extraction is deterministic
(no LLM), so it's reproducible and never hallucinates a claim about a team.

## Sandbox Modes

The [live sandbox](https://peakminds-ai.streamlit.app) ([`services/ranking-engine/sandbox/`](services/ranking-engine/sandbox/))
offers two modes:

- **Full Competition Dataset (100,000 Candidates)** *(default)* — runs
  `build_ranking()` against the committed competition artifacts. No upload, no
  live embeddings, no sampling: this reproduces our official
  `submissions/team_redrob.csv` exactly, verified byte-for-byte identical.
- **Bring Your Own Candidates** — upload your own `candidates.jsonl` (≤100 rows)
  and watch the same engine extract features, embed, score, and explain your
  custom pool live, on CPU, end to end.

Run it locally:

```bash
cd services/ranking-engine
pip install -r sandbox/requirements.txt
streamlit run sandbox/app.py
```

## Results

Measured directly from this repository — not projected, not simulated:

| Metric | Value | Notes |
|---|---|---|
| Candidates ranked | **100,000** | full `data/candidates.jsonl` pool |
| Deterministic signals per candidate | **94** | `feature_schema.csv` |
| Semantic embedding | **384-d**, `all-MiniLM-L6-v2` | measured against a JD-intent query |
| Ranking step runtime | **~0.5–1.5 s** measured | budget: 300 s (≤5 min) |
| Peak memory (ranking step) | **~550–600 MB** measured | budget: 16 GB |
| Honeypots in Top-100 | **0** measured | budget: <10% (Stage-3 disqualification threshold) |
| Reproducibility | **byte-identical** across independent runs | verified via diff |
| Self-eval composite (silver set)* | **0.944** (NDCG@10 0.956, NDCG@50 0.957, MAP 0.861, P@10 1.000) | *our own synthetic validation set — **not** the hidden competition ground truth, which is scored only after submissions close |

## Reproducibility

Reproduce the official submission with a single command:

```bash
cd services/ranking-engine
python rank.py
# Reads the committed artifacts/candidate_features.parquet + reasoning_facts.parquet
# Writes submissions/team_redrob.csv  (runs in ~1 second on CPU; no data download needed)
```

Place `candidates.jsonl` at `data/candidates.jsonl` (or set `CANDIDATES_PATH`)
only if you need to rebuild the artifacts from scratch — reproducing the
submission CSV itself needs no raw data at all, since the committed parquet
artifacts are self-sufficient.

## Repository Structure

| Path | Description |
|---|---|
| `apps/web/` | Next.js site — homepage, `/architecture`, `/top-100`, `/why-peakminds`, recruiter workspace + Team Intelligence |
| `services/ranking-engine/` | The submission's ranking engine + Streamlit sandbox |
| `data/` | Raw input data (git-ignored; place `candidates.jsonl` here for a rebuild) |
| `docs/` | Product, design, and engineering documentation |
| `submission_metadata.yaml` | Challenge portal metadata (spec §10.3) |

## Documentation

- [Ranking Engine README](services/ranking-engine/README.md) — full pipeline, formulas, run order, artifact provenance
- [Sandbox README](services/ranking-engine/sandbox/README.md)
- [Ranking Architecture](docs/ranking-engine/ranking_architecture.md)
- [Relevance Rubric](docs/ranking-engine/relevance_rubric.md)
- [Engineering Assessments](docs/engineering/)
