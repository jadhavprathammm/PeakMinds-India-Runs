"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RankedCandidate } from "@/lib/matching";
import { capTerm } from "@/lib/matching";
import { ScoreRing, verdictBadgeClass, DownloadIcon } from "@/components/shared/score-display";
import SearchBar from "@/components/workspace/SearchBar";

interface Summary {
  total: number;
  qualified: number;
  avgScore: number;
  topCandidate: string;
}

type SortKey = "rank" | "name" | "score" | "experience";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

export default function ResultsDashboard({
  ranked,
  summary,
  onReset,
}: {
  ranked: RankedCandidate[];
  summary: Summary;
  onReset: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<RankedCandidate | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = ranked;
    if (q) {
      rows = ranked.filter((c) =>
        [c.name, c.experience, c.verdict, ...c.matched].join(" ").toLowerCase().includes(q)
      );
    }
    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "experience") cmp = a.experience.localeCompare(b.experience, undefined, { numeric: true });
      else cmp = a[sortKey] - b[sortKey];
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [ranked, query, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "name" || key === "experience" ? "asc" : "desc"); }
    setPage(0);
  }

  const stats = [
    { label: "Total Candidates", value: String(summary.total) },
    { label: "Qualified (≥60)", value: String(summary.qualified) },
    { label: "Average Score", value: String(summary.avgScore) },
    { label: "Top Candidate", value: summary.topCandidate },
  ];

  return (
    <div className="flex flex-col gap-12">
      {/* ── Executive summary ──────────────────────────────────────────────── */}
      <section aria-label="Executive summary">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-accent">Results</p>
            <h2 className="mt-2 text-4xl font-bold leading-tight text-foreground">Ranked Candidates</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportCSV(ranked)} className="btn btn-sm btn-secondary flex items-center gap-2">
              <DownloadIcon /> Export CSV
            </button>
            <button onClick={() => { void exportPDF(ranked, summary); }} className="btn btn-sm btn-secondary flex items-center gap-2">
              <DownloadIcon /> Export PDF
            </button>
            <button onClick={onReset} className="btn btn-sm btn-secondary">New Run</button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-card border border-border bg-surface/50 p-6">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted">{s.label}</p>
              <p className="mt-2 truncate text-3xl font-bold tracking-tight text-foreground" title={s.value}>{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ranked table ───────────────────────────────────────────────────── */}
      <section aria-label="Ranked candidate table">
        <div className="mb-6">
          <SearchBar value={query} onChange={(v) => { setQuery(v); setPage(0); }} />
        </div>

        <div className="overflow-x-auto rounded-card border border-border bg-surface/40">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border text-[12px] font-semibold uppercase tracking-wider text-muted">
                <Th label="Rank" active={sortKey === "rank"} dir={sortDir} onClick={() => toggleSort("rank")} />
                <Th label="Candidate" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                <Th label="Match Score" active={sortKey === "score"} dir={sortDir} onClick={() => toggleSort("score")} />
                <Th label="Experience" active={sortKey === "experience"} dir={sortDir} onClick={() => toggleSort("experience")} />
                <th className="px-5 py-4">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c) => (
                <tr
                  key={`${c.rank}-${c.name}`}
                  onClick={() => setSelected(c)}
                  className="cursor-pointer border-b border-border/60 transition-colors hover:bg-surface/70"
                >
                  <td className="px-5 py-4 text-[14px] font-bold tabular-nums text-muted">{c.rank}</td>
                  <td className="px-5 py-4 text-[15px] font-medium text-foreground">{c.name}</td>
                  <td className="px-5 py-4">
                    <ScoreCell score={c.score} />
                  </td>
                  <td className="px-5 py-4 text-[14px] text-foreground/70">{c.experience || "—"}</td>
                  <td className="px-5 py-4">
                    <span className={["rounded-full px-3 py-1 text-[12px] font-semibold", verdictBadgeClass(c.verdict)].join(" ")}>
                      {c.verdict}
                    </span>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-[14px] text-muted">No candidates match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <p className="text-[13px] text-muted">
              Page {safePage + 1} of {pageCount} · {filtered.length} candidates
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="btn btn-sm btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={safePage >= pageCount - 1}
                className="btn btn-sm btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Candidate drawer ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && <CandidateDrawer candidate={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function Th({ label, active, dir, onClick }: { label: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <th className="px-5 py-4">
      <button onClick={onClick} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors" aria-label={`Sort by ${label}`}>
        {label}
        <span className={["text-[10px]", active ? "text-accent" : "text-faint"].join(" ")} aria-hidden="true">
          {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

function ScoreCell({ score }: { score: number }) {
  const color = score >= 75 ? "var(--color-accent)" : score >= 60 ? "#f59e0b" : "var(--color-subtle)";
  return (
    <div className="flex items-center gap-3">
      <span className="text-[15px] font-bold tabular-nums" style={{ color }}>{score}</span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function CandidateDrawer({ candidate, onClose }: { candidate: RankedCandidate; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.aside
        role="dialog"
        aria-label={`Details for ${candidate.name}`}
        className="relative h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface p-7 lg:p-8"
        initial={{ x: 40 }}
        animate={{ x: 0 }}
        exit={{ x: 40 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-accent">Rank #{candidate.rank}</p>
            <h3 className="mt-1.5 text-2xl font-semibold text-foreground">{candidate.name}</h3>
            {candidate.experience && <p className="mt-1 text-[14px] text-foreground/60">{candidate.experience}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 text-muted hover:text-foreground transition-colors" aria-label="Close">✕</button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <ScoreRing score={candidate.score} size={140} />
          <span className={["rounded-full px-4 py-1.5 text-[13px] font-semibold", verdictBadgeClass(candidate.verdict)].join(" ")}>
            {candidate.verdict}
          </span>
        </div>

        <Section title="Recruiter Note">
          <p className="text-[14px] leading-7 text-foreground/75">{candidate.note}</p>
        </Section>

        <Section title="Strengths">
          {candidate.matched.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {candidate.matched.map((t) => (
                <li key={t} className="rounded-full border border-accent/25 bg-accent/[0.06] px-3 py-1 text-[12.5px] text-foreground/80">{capTerm(t)}</li>
              ))}
            </ul>
          ) : <p className="text-[14px] text-muted">No matched requirements.</p>}
        </Section>

        {candidate.semanticEvidence && candidate.semanticEvidence.length > 0 && (
          <Section title="Relevant Experience">
            <ul className="flex flex-col gap-2.5">
              {candidate.semanticEvidence.map((ev) => (
                <li
                  key={ev}
                  className="border-l-2 border-accent/30 pl-3 text-[13px] leading-[1.6] text-foreground/70"
                >
                  {ev}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Gaps">
          {candidate.missing.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {candidate.missing.map((t) => (
                <li key={t} className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-[12.5px] text-muted">{capTerm(t)}</li>
              ))}
            </ul>
          ) : <p className="text-[14px] text-muted">No notable gaps.</p>}
        </Section>
      </motion.aside>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 border-t border-border pt-6">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-accent">{title}</p>
      {children}
    </div>
  );
}

// ── Exports ─────────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function exportCSV(ranked: RankedCandidate[]) {
  const header = ["Rank", "Candidate", "Match Score", "Experience", "Recommendation", "Note"];
  const lines = [header.join(",")];
  for (const c of ranked) {
    lines.push([
      String(c.rank), csvCell(c.name), String(c.score),
      csvCell(c.experience), csvCell(c.verdict), csvCell(c.note),
    ].join(","));
  }
  triggerDownload(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }), "peakminds-ranked-candidates.csv");
}

async function exportPDF(ranked: RankedCandidate[], summary: Summary) {
  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const PAGE_H = doc.internal.pageSize.getHeight();
    const MARGIN = 40;
    let y = MARGIN;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(20, 20, 20);
    doc.text("PeakMinds — Ranked Candidates", MARGIN, y);
    y += 22;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Total: ${summary.total}   Qualified: ${summary.qualified}   Avg score: ${summary.avgScore}   Top: ${summary.topCandidate}`,
      MARGIN, y
    );
    y += 24;

    const cols = [
      { label: "Rank", x: MARGIN, w: 40 },
      { label: "Candidate", x: MARGIN + 40, w: 170 },
      { label: "Score", x: MARGIN + 210, w: 50 },
      { label: "Experience", x: MARGIN + 260, w: 110 },
      { label: "Recommendation", x: MARGIN + 370, w: 150 },
    ];

    const header = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 77, 141);
      cols.forEach((c) => doc.text(c.label, c.x, y));
      y += 6;
      doc.setDrawColor(220, 220, 220);
      doc.line(MARGIN, y, MARGIN + 520, y);
      y += 12;
    };
    header();

    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    for (const c of ranked) {
      if (y > PAGE_H - MARGIN) { doc.addPage(); y = MARGIN; header(); doc.setFont("helvetica", "normal"); doc.setTextColor(40, 40, 40); }
      doc.setFontSize(9);
      const name = doc.splitTextToSize(c.name, cols[1].w - 6)[0] as string;
      const exp = doc.splitTextToSize(c.experience || "—", cols[3].w - 6)[0] as string;
      const rec = doc.splitTextToSize(c.verdict, cols[4].w - 6)[0] as string;
      doc.text(String(c.rank), cols[0].x, y);
      doc.text(name, cols[1].x, y);
      doc.text(String(c.score), cols[2].x, y);
      doc.text(exp, cols[3].x, y);
      doc.text(rec, cols[4].x, y);
      y += 16;
    }

    doc.save("peakminds-ranked-candidates.pdf");
  } catch {
    exportCSV(ranked);
  }
}
