"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TOP_100, type RankedEntry, type Tier } from "@/lib/top100data";

const FILTERS = ["All", "NLP", "Recommendation", "Search", "Senior (7+yrs)", "Top Tier"] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(c: RankedEntry, f: Filter): boolean {
  if (f === "All") return true;
  if (f === "NLP") return c.role.toLowerCase().includes("nlp");
  if (f === "Recommendation") return c.role.toLowerCase().includes("recommendation");
  if (f === "Search") return c.role.toLowerCase().includes("search");
  if (f === "Senior (7+yrs)") return c.experience >= 7;
  if (f === "Top Tier") return c.tier === "Top";
  return true;
}

function scoreBadge(score: number) {
  if (score >= 90) return "bg-accent/15 text-accent border border-accent/30";
  if (score >= 80) return "bg-purple-500/15 text-purple-300 border border-purple-500/30";
  return "bg-surface-elevated text-muted border border-border";
}

function tierBadge(tier: Tier) {
  if (tier === "Top") return "bg-accent/12 text-accent border border-accent/25";
  if (tier === "Strong") return "bg-purple-500/12 text-purple-300 border border-purple-400/25";
  return "bg-surface-elevated text-faint border border-border";
}

function downloadCSV() {
  const header = "Rank,Candidate ID,Role,Company,Experience (yrs),Match Score,Skills\n";
  const rows = TOP_100.map((c) =>
    `${c.rank},"${c.id}","${c.role}","${c.company}",${c.experience},${c.score},"${c.skills.join("; ")}"`
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "peakminds_top100_india_runs.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const HERO_STATS = [
  { label: "Candidates Evaluated", value: "10,000+" },
  { label: "Finalists Selected",   value: "100" },
  { label: "Features Per Candidate", value: "96" },
  { label: "Embedding Dimensions",   value: "384" },
];

const FINDINGS = [
  "72% of Top 100 candidates showed production deployment evidence.",
  "Most selected candidates had 5+ years of applied ML experience.",
  "Semantic matching consistently outperformed keyword-only matching.",
  "Trust signals correlated strongly with top-tier rankings.",
  "Candidates with both role alignment and deployment history ranked highest.",
];

export default function Top100Page() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOP_100.filter((c) => {
      if (!matchesFilter(c, filter)) return false;
      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [query, filter]);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute -top-1/4 left-1/2 -translate-x-1/2 w-[60vw] max-w-[700px] aspect-square rounded-full blur-[200px]"
          style={{ backgroundColor: "rgba(255,77,141,0.06)" }}
          aria-hidden="true"
        />
        <div className="relative container-page pt-32 pb-16 lg:pt-36 lg:pb-20">
          {/* Back link */}
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[13px] font-medium text-muted hover:text-foreground transition-colors duration-150 mb-8"
          >
            <BackArrow />
            Back to PeakMinds
          </Link>

          {/* Engine attribution */}
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent mb-3">
            Talent Intelligence Output
          </p>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-[68px] font-bold tracking-[-0.03em] leading-[1.05] text-foreground">
            Top 100 Candidates
          </h1>
          <p className="mt-5 max-w-[620px] text-[18px] leading-[1.7] text-foreground/70">
            Generated from 10,000 candidate profiles using the PeakMinds Talent Intelligence Engine.{" "}
            <span className="text-foreground/40">India Runs AI Hiring Challenge 2026</span>
          </p>

          {/* Stats cards */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl">
            {HERO_STATS.map((s) => (
              <div key={s.label} className="rounded-card border border-border bg-surface/50 p-4">
                <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">
                  {s.value}
                </p>
                <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted leading-[1.4]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Download */}
          <div className="mt-8">
            <button
              onClick={downloadCSV}
              className="btn btn-md btn-secondary group inline-flex items-center gap-2.5 px-6"
            >
              <DownloadIcon />
              Download Submission CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="container-page py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by role, company, or skill…"
              className="w-full rounded-xl border border-border bg-surface/60 py-3 pl-11 pr-4 text-[15px] text-foreground placeholder:text-subtle outline-none transition-colors duration-[250ms] focus:border-accent/50 focus:bg-surface"
            />
          </div>
          {/* Filter chips */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter candidates">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={[
                  "rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-[250ms]",
                  filter === f
                    ? "border-accent/60 bg-accent/15 text-accent shadow-[0_0_0_1px_rgba(255,77,141,0.15)]"
                    : "border-border bg-surface/40 text-muted hover:border-border-strong hover:text-foreground",
                ].join(" ")}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="container-page py-8 lg:py-12">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface/60">
                <Th className="w-16 text-center">#</Th>
                <Th className="w-44">Candidate</Th>
                <Th>Role</Th>
                <Th className="w-36">Company</Th>
                <Th className="w-20 text-center">Exp.</Th>
                <Th className="w-24 text-center">Score</Th>
                <Th className="w-24 text-center">Tier</Th>
                <Th>Skills</Th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-[15px] text-muted">
                    No candidates match your search.
                  </td>
                </tr>
              ) : (
                results.map((c, i) => {
                  const isElite = c.rank <= 10;
                  return (
                    <tr
                      key={c.id}
                      className={[
                        "border-b border-border/60 transition-colors duration-150 hover:bg-surface/60",
                        isElite ? "bg-accent/[0.025]" : i % 2 === 0 ? "bg-transparent" : "bg-surface/20",
                      ].join(" ")}
                    >
                      {/* Rank */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span
                            className={[
                              "text-[16px] font-bold tabular-nums leading-none",
                              c.rank <= 3
                                ? "text-gradient-accent"
                                : c.rank <= 10
                                ? "text-foreground"
                                : "text-muted",
                            ].join(" ")}
                          >
                            {c.rank}
                          </span>
                          {isElite && (
                            <span className="rounded-full border border-accent/25 bg-accent/[0.08] px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-accent/80">
                              Elite
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Candidate ID */}
                      <td className="px-4 py-4">
                        <span className="font-mono text-[13.5px] font-semibold tracking-tight text-foreground">
                          {c.id}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-4">
                        <span className="text-[15px] text-foreground/90">{c.role}</span>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-4">
                        <span className="text-[14px] text-subtle">{c.company}</span>
                      </td>

                      {/* Experience */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-[13px] tabular-nums text-muted">{c.experience} yrs</span>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-4 text-center">
                        <span
                          className={[
                            "inline-flex items-center justify-center rounded-full px-3 py-1 text-[14px] font-bold tabular-nums",
                            scoreBadge(c.score),
                          ].join(" ")}
                        >
                          {c.score}
                        </span>
                      </td>

                      {/* Tier */}
                      <td className="px-4 py-4 text-center">
                        <span
                          className={[
                            "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                            tierBadge(c.tier),
                          ].join(" ")}
                        >
                          {c.tier}
                        </span>
                      </td>

                      {/* Skills */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {c.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-2.5 py-0.5 text-[12px] text-muted"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <p className="mt-5 text-center text-[13px] text-faint">
          Showing {results.length} of {TOP_100.length} candidates ·{" "}
          Ranked by PeakMinds Talent Intelligence Engine
        </p>
      </div>

      {/* ── PeakMinds Findings ───────────────────────────────────────────────── */}
      <div className="border-t border-border bg-surface/20">
        <div className="container-page py-14 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint mb-2">
              Engine Insights
            </p>
            <h2 className="text-[26px] font-bold tracking-tight text-foreground mb-8">
              PeakMinds Findings
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FINDINGS.map((f, i) => (
                <div
                  key={i}
                  className="rounded-card border border-border bg-surface/50 p-5 flex gap-3 items-start"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold tabular-nums text-accent">
                    {i + 1}
                  </span>
                  <p className="text-[14px] leading-[1.65] text-foreground/80">{f}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared small components
// ─────────────────────────────────────────────────────────────────────────────

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={[
        "px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function BackArrow() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
      className="transition-transform duration-150 group-hover:-translate-x-0.5"
    >
      <path d="M11 7H3M6.5 3.5L3 7l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 18 18" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"
    >
      <circle cx="8" cy="8" r="5.5" />
      <path d="M12 12l3.5 3.5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M8 2v8M5 7l3 3 3-3" />
      <path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
    </svg>
  );
}
