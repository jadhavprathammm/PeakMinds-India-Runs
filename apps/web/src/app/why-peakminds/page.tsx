import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why PeakMinds Wins",
  description:
    "Traditional hiring drowns recruiters in keywords. PeakMinds ranks talent by meaning, evidence, and intent — explainably.",
};

const TRADITIONAL = [
  { t: "Keyword matching", d: "Ranks résumés by string overlap, not real capability." },
  { t: "Manual screening", d: "Hours per role spent skimming look-alike profiles." },
  { t: "Résumé overload", d: "Thousands of applications, no reliable way to prioritize." },
  { t: "Inconsistent evaluation", d: "Every reviewer applies a different, unwritten bar." },
  { t: "Hidden bias", d: "Gut-feel decisions with no auditable reasoning." },
];

const PEAKMINDS = [
  { t: "Semantic understanding", d: "Reads intent and experience — not just keywords." },
  { t: "Explainable scoring", d: "Every rank shows the exact signals behind it." },
  { t: "Candidate intelligence", d: "93 engineered signals per candidate, deterministically." },
  { t: "Evidence-backed recommendations", d: "Strengths and one honest concern, every time." },
  { t: "Top-100 ranking generation", d: "From 100,000 applicants to a ranked shortlist in minutes." },
];

const COMPARE: { dim: string; keyword: string; intel: string }[] = [
  { dim: "Matches on", keyword: "Exact keywords & strings", intel: "Meaning, intent & evidence" },
  { dim: "Coverage", keyword: "Whatever a recruiter can read", intel: "All 100,000 applicants, every time" },
  { dim: "Consistency", keyword: "Varies by reviewer & mood", intel: "One deterministic rubric" },
  { dim: "Explanation", keyword: "\"It looked like a fit\"", intel: "Per-signal score + stated concern" },
  { dim: "Speed", keyword: "Days to weeks", intel: "Under five minutes, on CPU" },
  { dim: "Auditability", keyword: "None", intel: "Fully reproducible, zero hallucination" },
];

const MATTERS = [
  {
    who: "For Recruiters",
    d: "Open a ranked shortlist with the reasoning already written — spend time on conversations, not keyword triage.",
  },
  {
    who: "For Hiring Agencies",
    d: "Defend every shortlist with evidence. Turn a high-volume pipeline into a consistent, repeatable process.",
  },
  {
    who: "For Enterprises",
    d: "Apply one auditable standard across teams and geographies — and prove how each decision was made.",
  },
  {
    who: "For High-Volume Hiring",
    d: "Scale from hundreds to hundreds of thousands of applicants without scaling the screening headcount.",
  },
];

export default function WhyPeakMindsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute -top-1/3 left-1/2 -translate-x-1/2 w-[60vw] max-w-[700px] aspect-square rounded-full blur-[200px]"
          style={{ backgroundColor: "rgba(255,77,141,0.05)" }}
          aria-hidden="true"
        />
        <div className="relative container-page pt-32 pb-16 lg:pt-36 lg:pb-20">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[15px] font-medium text-muted hover:text-foreground transition-colors duration-150 mb-8"
          >
            <BackArrow />
            Back to PeakMinds
          </Link>
          <p className="text-[15px] font-semibold uppercase tracking-[0.14em] text-accent">
            Why PeakMinds Wins
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-[64px] font-bold tracking-[-0.03em] leading-[1.05]">
            Hiring shouldn&apos;t be a
            <br />
            <span className="text-gradient-accent">keyword lottery.</span>
          </h1>
          <p className="mt-5 max-w-[680px] text-[21px] leading-[1.75] text-foreground/70">
            Traditional tools rank the loudest résumés. PeakMinds ranks the
            strongest candidates — and shows its work.
          </p>
        </div>
      </header>

      {/* ── Sections A & B — Traditional vs PeakMinds ────────────────────────── */}
      <section className="container-page py-14 lg:py-20" aria-label="Traditional hiring versus PeakMinds">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Traditional */}
          <div className="rounded-card border border-border bg-surface/30 p-8 lg:p-11">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">
              The Old Way
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground/80">
              Traditional Hiring
            </h2>
            <ul className="mt-8 space-y-6">
              {TRADITIONAL.map((x) => (
                <li key={x.t} className="flex gap-3.5">
                  <CrossIcon />
                  <div>
                    <p className="text-[19px] font-semibold leading-[1.45] text-foreground/85">{x.t}</p>
                    <p className="mt-1 text-[17px] leading-[1.7] text-muted">{x.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* PeakMinds */}
          <div className="relative overflow-hidden rounded-card border border-accent/25 bg-surface/50 p-8 lg:p-11">
            <div
              className="absolute top-0 inset-x-0 h-px pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,77,141,0.5) 50%, transparent)",
              }}
              aria-hidden="true"
            />
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
              The PeakMinds Way
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Talent Intelligence
            </h2>
            <ul className="mt-8 space-y-6">
              {PEAKMINDS.map((x) => (
                <li key={x.t} className="flex gap-3.5">
                  <CheckIcon />
                  <div>
                    <p className="text-[19px] font-semibold leading-[1.45] text-foreground">{x.t}</p>
                    <p className="mt-1 text-[17px] leading-[1.7] text-foreground/70">{x.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Section C — Side-by-side comparison ──────────────────────────────── */}
      <section className="border-t border-border bg-surface/20" aria-label="Side by side comparison">
        <div className="container-page py-14 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              Keyword Search vs Talent Intelligence
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-[21px] leading-[1.75] text-foreground/65">
              The same pile of applications, two very different outcomes.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-card border border-border">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-border bg-surface/60">
              <Cell className="text-faint font-semibold">Dimension</Cell>
              <Cell className="text-foreground/60 font-semibold">Keyword Search</Cell>
              <Cell className="text-accent font-semibold">Talent Intelligence</Cell>
            </div>
            {COMPARE.map((row, i) => (
              <div
                key={row.dim}
                className={[
                  "grid grid-cols-[1fr_1fr_1fr] border-b border-border/60 last:border-b-0",
                  i % 2 ? "bg-surface/20" : "",
                ].join(" ")}
              >
                <Cell className="font-medium text-foreground/80">{row.dim}</Cell>
                <Cell className="text-muted">{row.keyword}</Cell>
                <Cell className="text-foreground/90">{row.intel}</Cell>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section D — Why it matters ───────────────────────────────────────── */}
      <section className="border-t border-border" aria-label="Why it matters">
        <div className="container-page py-14 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              Why It Matters
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-[21px] leading-[1.75] text-foreground/65">
              The same engine, tuned to whoever is doing the hiring.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {MATTERS.map((m) => (
              <div
                key={m.who}
                className="rounded-card border border-border bg-surface/50 p-7 lg:p-9 transition-colors duration-[250ms] hover:border-border-strong"
              >
                <h3 className="text-[23px] font-semibold tracking-tight text-accent">{m.who}</h3>
                <p className="mt-3 text-[18px] leading-[1.75] text-foreground/75">{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="container-page py-16 text-center lg:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Proof beats promises.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[18px] leading-[1.7] text-muted">
            See the ranked Top 100 — or how the engine produced it.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/top-100" className="btn btn-md btn-primary px-7">
              View the Top 100
            </Link>
            <Link href="/architecture" className="btn btn-md btn-secondary px-7">
              See the Architecture
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Cell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={["px-5 py-4 text-[16px] leading-[1.6]", className ?? ""].join(" ")}>
      {children}
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="2 6.5 4.5 9 10 3" />
      </svg>
    </span>
  );
}

function CrossIcon() {
  return (
    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-elevated">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="var(--color-subtle)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M3 3l6 6M9 3l-6 6" />
      </svg>
    </span>
  );
}

function BackArrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="transition-transform duration-150 group-hover:-translate-x-0.5"
    >
      <path
        d="M11 7H3M6.5 3.5L3 7l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
