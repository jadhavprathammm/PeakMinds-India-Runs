"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TOP_100, FINDINGS, SCORE_RANGE, type RankedEntry } from "@/lib/top100data";
import ComparePanel from "@/components/top100/ComparePanel";

const FILTERS = ["All", "NLP", "Recommendation", "Search", "Senior (7+yrs)"] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(c: RankedEntry, f: Filter): boolean {
  if (f === "All") return true;
  if (f === "NLP") return c.role.toLowerCase().includes("nlp");
  if (f === "Recommendation") return c.role.toLowerCase().includes("recommendation");
  if (f === "Search") return c.role.toLowerCase().includes("search");
  if (f === "Senior (7+yrs)") return c.experience >= 7;
  return true;
}

// Real model scores span SCORE_RANGE (≈0.86–1.01). Colour by position in that band.
function scoreBadge(score: number) {
  if (score >= 0.95) return "bg-accent/15 text-accent border border-accent/30";
  if (score >= 0.90) return "bg-purple-500/15 text-purple-300 border border-purple-500/30";
  return "bg-surface-elevated text-muted border border-border";
}

function downloadCSV() {
  // Mirrors the real submission: candidate_id, rank, score (model output).
  const header = "candidate_id,rank,score,role,company,experience_yrs,tier,skills\n";
  const rows = TOP_100.map((c) =>
    `"${c.id}",${c.rank},${c.score},"${c.role}","${c.company}",${c.experience},${c.tier},"${c.skills.join("; ")}"`
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
  { label: "Candidates Evaluated", value: "100,000" },
  { label: "Finalists Selected",   value: "100" },
  { label: "Signals Per Candidate", value: "93" },
  { label: "Embedding Dimensions",   value: "384" },
];

export default function Top100Page() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  }

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
            Generated from 100,000 candidate profiles using the PeakMinds Talent Intelligence Engine.{" "}
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

      {/* ── Compare FAB ──────────────────────────────────────────────────────── */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full border border-accent/40 bg-[#0c1015]/95 px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <span className="text-[13px] text-muted">
              {compareIds.length === 1 ? "Select 1 more to compare" : "Ready to compare"}
            </span>
            {compareIds.length === 2 && (
              <button
                onClick={() => setCompareOpen(true)}
                className="rounded-full bg-accent px-4 py-1.5 text-[13px] font-semibold text-white shadow-[0_0_16px_rgba(255,77,141,0.4)] transition-opacity hover:opacity-90"
              >
                Compare →
              </button>
            )}
            <button
              onClick={() => setCompareIds([])}
              className="text-[13px] text-subtle transition-colors hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {compareOpen && compareIds.length === 2 && (
        <ComparePanel
          ids={compareIds as [string, string]}
          allEntries={TOP_100}
          onClose={() => setCompareOpen(false)}
        />
      )}

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
                <Th className="w-12 text-center">
                  <span className="text-[10px] text-faint">CMP</span>
                </Th>
                <Th className="w-16 text-center">#</Th>
                <Th className="w-44">Candidate</Th>
                <Th>Role</Th>
                <Th className="w-36">Company</Th>
                <Th className="w-20 text-center">Exp.</Th>
                <Th className="w-28 text-center">Model Score</Th>
                <Th className="w-24 text-center">Tier</Th>
                <Th>Skills</Th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-[15px] text-muted">
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
                      {/* Compare checkbox */}
                      <td className="px-3 py-4 text-center">
                        <button
                          onClick={() => toggleCompare(c.id)}
                          aria-label={compareIds.includes(c.id) ? "Remove from comparison" : "Add to comparison"}
                          className={[
                            "flex h-5 w-5 items-center justify-center rounded border transition-all duration-150 mx-auto",
                            compareIds.includes(c.id)
                              ? "border-accent bg-accent text-white"
                              : compareIds.length >= 2
                              ? "border-border bg-transparent opacity-30 cursor-not-allowed"
                              : "border-border bg-transparent hover:border-accent/60",
                          ].join(" ")}
                          disabled={!compareIds.includes(c.id) && compareIds.length >= 2}
                        >
                          {compareIds.includes(c.id) && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1.5 5l2.5 2.5 4.5-4" />
                            </svg>
                          )}
                        </button>
                      </td>

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
                          {c.score.toFixed(3)}
                        </span>
                      </td>

                      {/* Tier (every finalist clears the Tier-5 bar, S ≥ 0.80) */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center rounded-full border border-accent/25 bg-accent/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
                          Tier {c.tier}
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
          Showing {results.length} of {TOP_100.length} candidates · Model scores range{" "}
          {SCORE_RANGE.min.toFixed(2)}–{SCORE_RANGE.max.toFixed(2)} · All 100 clear the Tier-5 bar
          (S&nbsp;≥&nbsp;0.80) · Identical to{" "}
          <span className="font-mono text-subtle">team_redrob.csv</span>
        </p>
      </div>

      {/* ── PeakMinds Findings ───────────────────────────────────────────────── */}
      <div className="border-t border-border bg-surface/20">
        <div className="container-page py-14 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint mb-2">
              Engine Insights
            </p>
            <h2 className="text-[26px] font-bold tracking-tight text-foreground mb-2">
              PeakMinds Findings
            </h2>
            <p className="text-[14px] text-muted mb-8">
              Computed directly from the 100 selected candidates — every figure is reproducible
              from the feature data.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FINDINGS.map((f, i) => (
                <div
                  key={i}
                  className="rounded-card border border-border bg-surface/50 p-5"
                >
                  <p className="text-[28px] font-bold tracking-tight text-gradient-accent leading-none">
                    {f.stat}
                  </p>
                  <p className="mt-2 text-[13.5px] leading-[1.55] text-foreground/75">{f.label}</p>
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
