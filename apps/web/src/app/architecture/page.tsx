import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Architecture",
  description:
    "How PeakMinds turns 100,000 applications into a ranked, explainable Top 100 — end to end.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Section A.5 — Submission Intelligence stats
// ─────────────────────────────────────────────────────────────────────────────
const STATS: { value: string; label: string }[] = [
  { value: "100,000", label: "Candidate Profiles" },
  { value: "93", label: "Signals Per Candidate" },
  { value: "384-D", label: "Semantic Embeddings" },
  { value: "Top 100", label: "Final Selection" },
  { value: "< 5 min", label: "Ranking Runtime" },
  { value: "100%", label: "Offline Processing" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section A.6 — Pipeline overview strip
// ─────────────────────────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  "100,000 Candidate Profiles",
  "Feature Extraction",
  "Embedding Generation",
  "7-Pillar Ranking Engine",
  "Top 100 Candidates",
];

// ─────────────────────────────────────────────────────────────────────────────
// Section B — the layered system architecture
// ─────────────────────────────────────────────────────────────────────────────
type Color = "sky" | "amber" | "accent" | "violet" | "emerald";

const LAYER_COLOR: Record<Color, { text: string; bar: string; dot: string }> = {
  sky:     { text: "text-sky-300",      bar: "rgba(56,189,248,0.85)",   dot: "bg-sky-400" },
  amber:   { text: "text-amber-300",    bar: "rgba(251,191,36,0.85)",   dot: "bg-amber-400" },
  accent:  { text: "text-accent",       bar: "rgba(255,77,141,0.9)",    dot: "bg-accent" },
  violet:  { text: "text-[#c6a3ff]",   bar: "rgba(176,107,255,0.85)",  dot: "bg-[#b06bff]" },
  emerald: { text: "text-emerald-300",  bar: "rgba(52,211,153,0.85)",   dot: "bg-emerald-400" },
};

const LAYERS: {
  tag: string;
  color: Color;
  modules: { name: string; detail: string; items: string[] }[];
}[] = [
  {
    tag: "Input Layer",
    color: "sky",
    modules: [
      {
        name: "Candidate Dataset",
        detail: "100,000 applicant profiles",
        items: ["JSONL corpus", "Streaming ingest"],
      },
      {
        name: "Resume Signals",
        detail: "Raw career narrative",
        items: ["Headline + summary", "Job history", "Skills & certifications"],
      },
    ],
  },
  {
    tag: "Processing Layer",
    color: "amber",
    modules: [
      {
        name: "Data Validation",
        detail: "Make every field trustworthy",
        items: ["Schema checks", "Missing-value handling", "Normalization"],
      },
      {
        name: "Feature Extraction",
        detail: "92 deterministic signals",
        items: ["Role signals", "Skill signals", "Experience", "Company"],
      },
    ],
  },
  {
    tag: "ML Intelligence Layer",
    color: "accent",
    modules: [
      {
        name: "Embedding Engine",
        detail: "Meaning, not keywords",
        items: ["all-MiniLM-L6-v2", "384-dim vectors", "Candidate representation"],
      },
      {
        name: "Similarity Engine",
        detail: "Candidate ↔ role matching",
        items: ["Cosine similarity", "JD-intent exemplars", "Hybrid blend"],
      },
    ],
  },
  {
    tag: "Ranking Layer",
    color: "violet",
    modules: [
      {
        name: "7-Pillar Scoring",
        detail: "One interpretable fit score",
        items: ["Weighted pillars", "Availability modifier", "Hard gates + tiers"],
      },
      {
        name: "Reasoning Layer",
        detail: "Why this candidate",
        items: ["Evidence generation", "Strength identification", "Risk detection"],
      },
    ],
  },
  {
    tag: "Output Layer",
    color: "emerald",
    modules: [
      {
        name: "Top 100 Selection",
        detail: "Final ranked shortlist",
        items: ["Deterministic ordering", "Tie-broken", "Tier 0–5"],
      },
      {
        name: "Recruiter Deliverables",
        detail: "Ready to act on",
        items: ["Candidate Intelligence Results", "team_redrob.csv export"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section B.5 — the 7 scoring pillars (real weights from src/scoring.py)
// ─────────────────────────────────────────────────────────────────────────────
const PILLARS: { name: string; weight: number; note: string }[] = [
  { name: "Role Fit",                weight: 42, note: "Title + semantic relevance + hard evidence" },
  { name: "Experience",              weight: 18, note: "Applied-ML years, banded" },
  { name: "Production Depth",        weight: 12, note: "Systems actually shipped & deployed" },
  { name: "Pre-LLM ML Depth",        weight: 8,  note: "Fundamentals before the LLM era" },
  { name: "Location & Availability", weight: 8,  note: "Geography + notice period" },
  { name: "Tenure Stability",        weight: 7,  note: "Staying power vs. job-hopping" },
  { name: "Trust Signals",           weight: 5,  note: "Verifiable, non-inflated profile" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section C — stage-by-stage breakdown
// ─────────────────────────────────────────────────────────────────────────────
const PIPELINE: {
  n: number;
  name: string;
  purpose: string;
  input: string;
  output: string;
  methods: string[];
}[] = [
  {
    n: 1,
    name: "Data Ingestion",
    purpose: "Stream the full candidate corpus without loading it all into memory.",
    input: "candidates.jsonl — 100,000 records",
    output: "Parsed candidate records (profile, career, skills, certs)",
    methods: ["Streaming JSONL reader", "UTF-8 normalization"],
  },
  {
    n: 2,
    name: "Data Cleaning",
    purpose: "Guarantee every downstream field is present and well-typed.",
    input: "Raw candidate records",
    output: "Validated, schema-conformant records",
    methods: ["Schema validation", "Null/default coalescing", "Honeypot & twin detection"],
  },
  {
    n: 3,
    name: "Resume Parsing",
    purpose: "Turn free-text career history into structured, scannable text.",
    input: "Headline, summary, job descriptions",
    output: "Concatenated career text + role timeline",
    methods: ["Title classification", "Tenure computation", "Evidence text scan"],
  },
  {
    n: 4,
    name: "Feature Engineering",
    purpose: "Convert each candidate into measurable, deterministic signals.",
    input: "Structured candidate record",
    output: "92-feature vector per candidate",
    methods: ["Keyword/dictionary scans", "Date math", "Taxonomy lookups", "Availability scoring"],
  },
  {
    n: 5,
    name: "Embedding Generation",
    purpose: "Capture the meaning of experience, not just its keywords.",
    input: "Headline + summary + career text",
    output: "384-dim dense vector (.npy)",
    methods: ["all-MiniLM-L6-v2", "CPU batch encoding", "Vector caching"],
  },
  {
    n: 6,
    name: "Similarity Computation",
    purpose: "Measure how closely a candidate matches the job's intent.",
    input: "Candidate vector + JD-intent exemplars",
    output: "semantic_fit ∈ [0, 1]",
    methods: ["Cosine similarity", "Exemplar pooling", "Hybrid keyword + semantic blend"],
  },
  {
    n: 7,
    name: "Scoring Engine",
    purpose: "Combine every signal into one interpretable fit score.",
    input: "Feature vector + semantic_fit",
    output: "S_fit ∈ [0, 1] with per-pillar sub-scores",
    methods: ["7-pillar weighted sum", "Vectorized NumPy", "Sub-score audit trail"],
  },
  {
    n: 8,
    name: "Ranking Layer",
    purpose: "Apply availability reality and disqualifying gates, then order.",
    input: "S_fit + availability + gate flags",
    output: "Final score S, tier (0–5), sorted candidates",
    methods: ["Availability modifier", "Hard gates (penalty + tier cap)", "Tie-broken sort"],
  },
  {
    n: 9,
    name: "Explainability Layer",
    purpose: "Produce a human-readable reason for every ranked candidate.",
    input: "Top candidates + reasoning facts",
    output: "Strengths + one honest concern per candidate",
    methods: ["Fact templating", "Deterministic phrasing", "Zero free-form generation"],
  },
  {
    n: 10,
    name: "Export Layer",
    purpose: "Emit the recruiter-facing deliverable.",
    input: "Top 100 ranked candidates",
    output: "team_redrob.csv (rank, score, reasoning)",
    methods: ["Deterministic CSV writer", "Validator-compliant tie-breaks"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section D — ML deep dive (trimmed to 4 core cards)
// ─────────────────────────────────────────────────────────────────────────────
const DEEP_DIVE: { title: string; body: string; formula?: string }[] = [
  {
    title: "Feature Extraction",
    body:
      "Each profile is reduced to 92 deterministic features — role class, applied-ML years, production-deployment evidence, evaluation-framework signals, tenure stability, location & notice availability, and trust signals. No model involved; every feature is fully reproducible. A semantic relevance score is added next, for 93 signals total.",
  },
  {
    title: "Embeddings & Semantic Matching",
    body:
      "Career text is encoded with all-MiniLM-L6-v2 into a 384-dimensional dense vector. We take the cosine similarity between the candidate vector and pooled JD-intent exemplars, then percentile-rank it across all 100,000 candidates — a bounded, interpretable relevance score (semantic_fit) that survives keyword obfuscation.",
    formula:
      "cos_jd = 0.4·cos(E_profile, E_jd) + 0.6·cos(E_career, E_jd)\nsemantic_fit = percentile_rank(cos_jd) ∈ [0, 1]",
  },
  {
    title: "Weighted Ranking",
    body:
      "Seven pillars are combined with fixed, audited weights. Five hard gates (wrong-role stuffing, services-only, research-only, CV-primary, recent-LLM-only) apply a multiplicative penalty and cap the achievable tier; honeypot and structural-twin profiles are excluded outright. Tier 5 represents the elite top candidates.",
    formula:
      "S_fit = 0.42·role + 0.18·exp + 0.12·prod + 0.08·prellm + 0.08·loc + 0.07·tenure + 0.05·trust\nS = S_fit × availability × Π gate_penalties",
  },
  {
    title: "Candidate Explainability",
    body:
      "Every ranked candidate carries the exact signals that lifted it and the single most material concern — assembled deterministically from mined facts, never free-form generated. The ranking is fully auditable with zero hallucination.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section E — code architecture
// ─────────────────────────────────────────────────────────────────────────────
const FILES: {
  name: string;
  responsibility: string;
  inputs: string;
  outputs: string;
  role: string;
}[] = [
  {
    name: "build_features.py",
    responsibility: "Extracts the 92 deterministic features for every candidate.",
    inputs: "candidates.jsonl",
    outputs: "candidate_features.parquet",
    role: "Feature engineering entrypoint",
  },
  {
    name: "src/features.py",
    responsibility: "Per-candidate feature logic — roles, evidence, tenure, availability, gates.",
    inputs: "One candidate record",
    outputs: "Flat feature dictionary",
    role: "Core feature library",
  },
  {
    name: "build_embeddings.py",
    responsibility: "Encodes candidates & JD intent, computes semantic_fit and twin detection.",
    inputs: "candidates.jsonl + JD intent",
    outputs: "semantic_fit column + cached vectors (.npy)",
    role: "Semantic layer",
  },
  {
    name: "src/scoring.py",
    responsibility: "Vectorized 7-pillar scoring, availability modifier, hard gates, tier assignment.",
    inputs: "candidate_features.parquet",
    outputs: "Continuous score S + tier + gate audit",
    role: "Scoring & ranking core",
  },
  {
    name: "src/reasoning.py",
    responsibility: "Assembles strengths + one concern per candidate from mined facts.",
    inputs: "Scored candidate + reasoning facts",
    outputs: "Deterministic reasoning string",
    role: "Explainability layer",
  },
  {
    name: "rank.py",
    responsibility: "Orchestrates scoring → ordering → reasoning and writes the submission.",
    inputs: "Features + reasoning facts",
    outputs: "team_redrob.csv (Top 100)",
    role: "Pipeline orchestrator",
  },
];

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Section A — Hero ─────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute -top-1/3 left-1/2 -translate-x-1/2 w-[60vw] max-w-[700px] aspect-square rounded-full blur-[200px]"
          style={{ backgroundColor: "rgba(255,77,141,0.05)" }}
          aria-hidden="true"
        />
        <div className="relative container-page pt-32 pb-16 lg:pt-36 lg:pb-20">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[13px] font-medium text-muted hover:text-foreground transition-colors duration-150 mb-8"
          >
            <BackArrow />
            Back to PeakMinds
          </Link>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
            System Architecture
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-[64px] font-bold tracking-[-0.03em] leading-[1.05]">
            PeakMinds System Architecture
          </h1>
          <p className="mt-5 max-w-[620px] text-[18px] leading-[1.6] text-foreground/70">
            How thousands of applications become the Top 100 candidates.
          </p>
        </div>
      </header>

      {/* ── Section A.5 — Submission Intelligence ────────────────────────────── */}
      <section className="border-b border-border bg-surface/20" aria-label="Submission intelligence">
        <div className="container-page py-14 lg:py-20">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
              At a Glance
            </p>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-foreground">
              Submission Intelligence
            </h2>
            <p className="mt-3 text-xl leading-8 text-foreground/60">
              The scale and complexity behind the final Top 100 ranking.
            </p>
          </div>

          <div className="mx-auto max-w-5xl grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-card border border-border bg-surface/50 p-5 text-center"
              >
                <p className="text-[26px] sm:text-[28px] font-bold tracking-tight text-foreground leading-none">
                  {s.value}
                </p>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-muted leading-[1.4]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section A.6 — Pipeline Overview Strip ────────────────────────────── */}
      <section className="border-b border-border" aria-label="Pipeline overview">
        <div className="container-page py-10 lg:py-14">
          <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
            Pipeline Overview
          </p>

          {/* Desktop: horizontal */}
          <div className="hidden sm:flex items-center justify-center gap-0 flex-wrap">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="rounded-lg border border-border bg-surface/60 px-4 py-2.5 text-[13px] font-medium text-foreground/85 whitespace-nowrap">
                  {step}
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <span className="mx-2 text-border-strong" aria-hidden="true">
                    <RightArrow />
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="flex sm:hidden flex-col items-center gap-0">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center">
                <div className="rounded-lg border border-border bg-surface/60 px-5 py-2.5 text-[13px] font-medium text-foreground/85 text-center">
                  {step}
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="py-1.5" aria-hidden="true">
                    <DownArrow />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section B — System Architecture Diagram ──────────────────────────── */}
      <section className="container-page py-16 lg:py-24" aria-label="System architecture diagram">
        <SectionHeading
          eyebrow="End to End"
          title="System Architecture"
          subtitle="Five layers turn a raw corpus into a ranked, explainable deliverable — fully offline on CPU. Embeddings are precomputed once; the ranking step runs in under five minutes."
        />

        <div className="mx-auto mt-12 max-w-4xl">
          {LAYERS.map((layer, li) => {
            const c = LAYER_COLOR[layer.color];
            return (
              <div key={layer.tag}>
                <div className="relative overflow-hidden rounded-card border border-border bg-surface/30 p-5 lg:p-6">
                  <span
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: c.bar }}
                    aria-hidden="true"
                  />
                  <div className="mb-4 flex items-center gap-2.5 pl-2">
                    <span className={["h-2 w-2 rounded-full", c.dot].join(" ")} aria-hidden="true" />
                    <span className={["text-[12px] font-semibold uppercase tracking-[0.16em]", c.text].join(" ")}>
                      {layer.tag}
                    </span>
                    <span className="ml-auto text-[11px] font-bold tabular-nums text-faint">
                      0{li + 1}
                    </span>
                  </div>
                  <div className="grid gap-3 pl-2 md:grid-cols-2">
                    {layer.modules.map((m) => (
                      <div key={m.name} className="rounded-xl border border-border bg-surface/60 p-4 lg:p-5">
                        <p className="text-2xl font-semibold tracking-tight text-foreground">{m.name}</p>
                        <p className="mt-0.5 text-base leading-7 text-subtle">{m.detail}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {m.items.map((it) => (
                            <span key={it} className="rounded-full border border-border bg-surface-elevated px-2.5 py-0.5 text-[11px] text-muted">
                              {it}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {li < LAYERS.length - 1 && (
                  <div className="flex justify-center py-2.5" aria-hidden="true">
                    <DownArrow />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section B.5 — Inside the Ranking Engine ──────────────────────────── */}
      <section className="border-t border-border bg-surface/20" aria-label="Inside the ranking engine">
        <div className="container-page py-16 lg:py-24">
          <SectionHeading
            eyebrow="The Centerpiece"
            title="Inside the Ranking Engine"
            subtitle="The exact weighted formula used to evaluate all 100,000 candidates and generate the final Top 100 ranking."
          />

          {/* Final Ranking Formula card — above weight distribution */}
          <div className="mx-auto mt-12 max-w-3xl rounded-card border border-border bg-surface/50 p-7 lg:p-9">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Final Ranking Formula
              </h3>
              <span className="shrink-0 rounded-full border border-accent/25 bg-accent/[0.07] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
                Deterministic
              </span>
            </div>

            <div className="rounded-xl border border-border bg-background/60 px-6 py-5 font-mono text-[13.5px] leading-[2] text-foreground/90">
              <div>
                <span className="text-accent font-bold">S</span>
                {" = "}
                <span className="text-foreground/70">0.42</span>
                <span className="text-foreground/90">(Role Fit)</span>
              </div>
              {[
                ["0.18", "Experience"],
                ["0.12", "Production Depth"],
                ["0.08", "Pre-LLM ML Depth"],
                ["0.08", "Location & Availability"],
                ["0.07", "Tenure Stability"],
                ["0.05", "Trust Signals"],
              ].map(([w, label]) => (
                <div key={label} className="pl-4">
                  <span className="text-muted">+ </span>
                  <span className="text-foreground/70">{w}</span>
                  <span className="text-foreground/90">({label})</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-foreground/50">Final Score</span>
                {" = "}
                <span className="text-accent font-bold">S</span>
                <span className="text-foreground/70"> × Availability Modifier × Gate Penalties</span>
              </div>
            </div>

            <p className="mt-4 text-base leading-7 text-muted text-center">
              Every candidate is ranked using this deterministic scoring framework before final ordering.
            </p>
          </div>

          {/* Weight distribution chart */}
          <div className="mx-auto mt-5 max-w-3xl rounded-card border border-border bg-surface/50 p-6 lg:p-9">
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Final Fit Score — weight distribution
              </h3>
              <span className="text-[12px] font-medium text-faint">Σ = 1.00</span>
            </div>

            <div className="flex flex-col gap-3.5">
              {PILLARS.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="w-40 shrink-0 text-base font-medium text-foreground/90 sm:w-52">
                      {p.name}
                    </span>
                    <div className="relative h-6 flex-1 overflow-hidden rounded-md border border-border bg-background/60">
                      <div
                        className="absolute inset-y-0 left-0 rounded-md bg-[linear-gradient(90deg,#ff4d8d,#b06bff)]"
                        style={{ width: `${p.weight}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-[13px] font-bold tabular-nums text-accent">
                      {(p.weight / 100).toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1 pl-0 text-[12px] text-subtle sm:pl-[calc(13rem+1rem)]">
                    {p.note}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-base leading-7 text-foreground/70">
              <span className="font-semibold text-foreground">Why one candidate outranks another:</span>{" "}
              Role Fit dominates at <span className="font-semibold text-accent">42%</span>, but
              inside it semantic relevance and hard evidence each weigh more than the job
              title — so a proven practitioner beats a keyword-stuffed profile with the same
              headline. Availability and disqualifying gates then multiply the score, so a
              brilliant-but-unavailable candidate is honestly ranked below a strong, ready one.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section B.6 — Explainability & Auditability ──────────────────────── */}
      <section className="border-t border-border" aria-label="Explainability and auditability">
        <div className="container-page py-14 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-card border border-border bg-surface/50 p-7 lg:p-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent mb-3">
                    Transparency
                  </p>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                    100% Explainable Ranking
                  </h3>
                </div>
                <AuditIcon />
              </div>

              <p className="mt-4 text-lg leading-8 text-foreground/75">
                Every ranking decision can be traced back to deterministic features, semantic
                similarity scores, weighted signals, and availability modifiers.
              </p>
              <p className="mt-3 text-[15px] leading-[1.75] text-foreground/75">
                No ranking is produced from hidden AI reasoning.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {["Fully Auditable", "Reproducible", "Deterministic"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 text-[12px] font-semibold text-foreground/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section B.7 — Beyond Keyword Matching ────────────────────────────── */}
      <section className="border-t border-border bg-surface/20" aria-label="Beyond keyword matching">
        <div className="container-page py-14 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <h3 className="text-center text-4xl font-bold leading-tight text-foreground mb-8">
              Beyond Keyword Matching
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Traditional */}
              <div className="rounded-card border border-border bg-surface/40 p-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted mb-4">
                  Traditional Search
                </p>
                <ul className="flex flex-col gap-2.5">
                  {[
                    "Matches keywords only",
                    "Keyword stuffing influence",
                    "Limited semantic understanding",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 py-4 text-base text-foreground/65">
                      <XIcon />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* PeakMinds */}
              <div className="rounded-card border border-accent/20 bg-accent/[0.04] p-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent mb-4">
                  PeakMinds
                </p>
                <ul className="flex flex-col gap-2.5">
                  {[
                    "Semantic matching",
                    "Experience evaluation",
                    "Deployment evidence",
                    "Availability scoring",
                    "Trust signals",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 py-4 text-base text-foreground/85">
                      <CheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section C — Pipeline Breakdown ───────────────────────────────────── */}
      <section className="border-t border-border bg-surface/20" aria-label="Pipeline breakdown">
        <div className="container-page py-16 lg:py-24">
          <SectionHeading
            eyebrow="Stage by Stage"
            title="Technical Pipeline Breakdown"
            subtitle="Every stage with its purpose, contract, and the methods it uses."
          />
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            {PIPELINE.map((p) => (
              <div
                key={p.n}
                className="rounded-card border border-border bg-surface/50 p-6 transition-colors duration-[250ms] hover:border-border-strong"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-[14px] font-bold tabular-nums text-accent">
                    {p.n}
                  </span>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                    {p.name}
                  </h3>
                </div>
                <p className="mt-3 text-base leading-7 text-foreground/70">{p.purpose}</p>
                <dl className="mt-4 space-y-2 text-[13px]">
                  <Row label="Input" value={p.input} />
                  <Row label="Output" value={p.output} />
                </dl>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.methods.map((m) => (
                    <span key={m} className="rounded-full border border-border bg-surface-elevated px-2.5 py-0.5 text-[11px] text-muted">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section D — ML Deep Dive ─────────────────────────────────────────── */}
      <section className="border-t border-border" aria-label="Machine learning deep dive">
        <div className="container-page py-16 lg:py-24">
          <SectionHeading
            eyebrow="For ML Engineers"
            title="ML Deep Dive"
            subtitle="The exact signals, vectors, and weighted formulas behind every rank."
          />
          <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-5">
            {DEEP_DIVE.map((d) => (
              <div key={d.title} className="rounded-card border border-border bg-surface/50 p-6 lg:p-7">
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                  {d.title}
                </h3>
                <p className="mt-2.5 text-base leading-7 text-foreground/75">{d.body}</p>
                {d.formula && (
                  <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background/60 px-4 py-3.5 font-mono text-[13px] leading-[1.7] text-accent/90 whitespace-pre-wrap">
                    {d.formula}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section E — Code Architecture ────────────────────────────────────── */}
      <section className="border-t border-border bg-surface/20" aria-label="Code architecture">
        <div className="container-page py-16 lg:py-24">
          <SectionHeading
            eyebrow="The Codebase"
            title="Code Architecture"
            subtitle="The modules that make up the ranking engine and what each one owns."
          />
          <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {FILES.map((f) => (
              <div
                key={f.name}
                className="rounded-card border border-border bg-surface/50 p-6 transition-colors duration-[250ms] hover:border-border-strong"
              >
                <div className="flex items-center justify-between gap-3">
                  <code className="font-mono text-2xl font-semibold text-foreground">
                    {f.name}
                  </code>
                  <span className="shrink-0 rounded-full border border-accent/25 bg-accent/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-accent">
                    {f.role}
                  </span>
                </div>
                <p className="mt-3 text-base leading-7 text-foreground/75">
                  {f.responsibility}
                </p>
                <dl className="mt-4 space-y-2 text-[13px]">
                  <Row label="Inputs" value={f.inputs} />
                  <Row label="Outputs" value={f.outputs} />
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="container-page py-16 text-center lg:py-20">
          <h2 className="text-4xl font-bold leading-tight text-foreground">
            See the engine&apos;s output.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-xl leading-8 text-muted">
            Every formula on this page produced one ranked, explainable list.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/top-100" className="btn btn-md btn-primary px-7">
              View the Top 100
            </Link>
            <Link href="/why-peakminds" className="btn btn-md btn-secondary px-7">
              Why PeakMinds Wins
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared components
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-4xl font-bold leading-tight text-foreground">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-xl leading-8 text-foreground/65">
        {subtitle}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-faint">
        {label}
      </dt>
      <dd className="font-mono text-[12.5px] text-foreground/70">{value}</dd>
    </div>
  );
}

function DownArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="text-border-strong">
      <path d="M9 3v12M4.5 10.5L9 15l4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RightArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-border-strong">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="transition-transform duration-150 group-hover:-translate-x-0.5">
      <path d="M11 7H3M6.5 3.5L3 7l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-accent">
      <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-subtle">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true" className="shrink-0 text-accent/40">
      <rect x="7" y="5" width="22" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 13h12M12 18h12M12 23h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="27" cy="27" r="5" fill="var(--color-background)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M25 27l1.5 1.5L29 25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
