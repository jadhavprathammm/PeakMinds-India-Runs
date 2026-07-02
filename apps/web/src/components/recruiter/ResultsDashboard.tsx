"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RankedCandidate } from "@/lib/matching";
import { capTerm } from "@/lib/matching";
import type { TeamAnalysisResult, CandidateTeamFit, TeamDNA, TeamSignal, CompatibilityAxis } from "@/engines/team-intelligence";
import {
  teamFitBadge,
  generateInsight,
  whyRecommended,
  teamDnaSummary,
  teamDnaNarrative,
  compatibilityReasons,
  contributionReasons,
  signalAxes,
} from "@/lib/team-insights";
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
  teamAnalysis = null,
  teamWarning = "",
}: {
  ranked: RankedCandidate[];
  summary: Summary;
  onReset: () => void;
  teamAnalysis?: TeamAnalysisResult | null;
  teamWarning?: string;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<RankedCandidate | null>(null);

  // Team Intelligence: index fits by candidate id (== candidate name from the adapter).
  const fitByName = useMemo(() => {
    const m = new Map<string, CandidateTeamFit>();
    for (const f of teamAnalysis?.candidates ?? []) m.set(f.candidate_id, f);
    return m;
  }, [teamAnalysis]);
  const hasTeam = !!teamAnalysis && fitByName.size > 0;

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

      {/* ── Team Intelligence (optional, additive) ─────────────────────────── */}
      {teamWarning && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-5 py-3.5">
          <p className="text-[13px] leading-[1.6] text-amber-200/80">{teamWarning}</p>
        </div>
      )}
      {hasTeam && <TeamIntelligencePanel analysis={teamAnalysis!} ranked={ranked} />}

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
                {hasTeam && <th className="px-5 py-4">Team Fit</th>}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c) => {
                const fit = hasTeam ? fitByName.get(c.name) : undefined;
                return (
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
                  {hasTeam && (
                    <td className="px-5 py-4">
                      {fit ? <TeamFitPill score={fit.team_fit_score} /> : <span className="text-[13px] text-faint">—</span>}
                    </td>
                  )}
                </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr><td colSpan={hasTeam ? 6 : 5} className="px-5 py-10 text-center text-[14px] text-muted">No candidates match your search.</td></tr>
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
        {selected && (
          <CandidateDrawer
            candidate={selected}
            onClose={() => setSelected(null)}
            fit={hasTeam ? fitByName.get(selected.name) ?? null : null}
            teamDna={teamAnalysis?.team_dna ?? null}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Team Intelligence panel (renders only when team docs were analysed) ──────────

function TeamFitPill({ score }: { score: number }) {
  const badge = teamFitBadge(score);
  return (
    <span className={["inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold", badge.className].join(" ")}>
      <span className="tabular-nums">{score}</span>
      <span className="opacity-70">·</span>
      {badge.label}
    </span>
  );
}

function TeamIntelligencePanel({ analysis, ranked }: { analysis: TeamAnalysisResult; ranked: RankedCandidate[] }) {
  const dna = analysis.team_dna;
  const gaps = dna.gaps.slice(0, 6);
  const jobMatchByName = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of ranked) m.set(r.name, r.score);
    return m;
  }, [ranked]);

  // Candidates ranked by team fit (the PeakMinds view — may differ from ATS job-match order).
  const byFit = useMemo(
    () => [...analysis.candidates].sort((a, b) => b.team_fit_score - a.team_fit_score),
    [analysis.candidates],
  );
  const top = byFit[0];

  return (
    <section aria-label="Team Intelligence" className="flex flex-col gap-6 rounded-card border border-accent/20 bg-accent/[0.03] p-6 lg:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-accent">Team Intelligence</p>
          <h3 className="mt-1.5 text-2xl font-semibold text-foreground">Candidate ↔ Team Fit</h3>
        </div>
        <p className="text-[12px] text-muted">
          {dna.skills.length} team skills · {gaps.length} gaps
          {analysis.degraded ? " · reduced signal" : ""}
        </p>
      </div>

      {/* Team DNA summary + narrative */}
      <TeamDnaCard dna={dna} />

      {/* Top recommendation */}
      {top && (
        <div className="grid grid-cols-1 gap-5 rounded-xl border border-accent/25 bg-accent/[0.05] p-5 lg:grid-cols-[minmax(0,1fr)_1.4fr] lg:p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Top Team Recommendation</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{top.candidate_name ?? top.candidate_id}</p>
            <div className="mt-3"><TeamFitPill score={top.team_fit_score} /></div>
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent/80">PeakMinds Insight</p>
              <p className="mt-1 text-[13.5px] leading-[1.65] text-foreground/75">{generateInsight(top, dna)}</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted">Why recommended</p>
            <ul className="flex flex-col gap-2">
              {whyRecommended(top, dna).map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13.5px] leading-[1.5] text-foreground/80">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Comparison table — why PeakMinds may rank differently from a traditional ATS */}
      <div>
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-muted">
          Candidate comparison · Job Match vs Team Fit
        </p>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface/40">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-border text-[12px] font-semibold uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3 text-center">Job Match</th>
                <th className="px-4 py-3 text-center">Compatibility</th>
                <th className="px-4 py-3 text-center">Contribution</th>
                <th className="px-4 py-3">Team Fit</th>
              </tr>
            </thead>
            <tbody>
              {byFit.map((f) => (
                <tr key={f.candidate_id} className="border-b border-border/60">
                  <td className="px-4 py-3 text-[14px] font-medium text-foreground">{f.candidate_name ?? f.candidate_id}</td>
                  <td className="px-4 py-3 text-center text-[13.5px] tabular-nums text-foreground/70">{jobMatchByName.get(f.candidate_id) ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-[13.5px] tabular-nums text-foreground/70">{f.compatibility.overall}</td>
                  <td className="px-4 py-3 text-center text-[13.5px] tabular-nums text-foreground/70">{f.contribution.overall}</td>
                  <td className="px-4 py-3"><TeamFitPill score={f.team_fit_score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2.5 text-[12px] leading-[1.55] text-muted">
          A traditional ATS ranks on Job Match alone. PeakMinds weighs how a candidate fits the
          existing team and what capabilities they add — surfacing high-impact hires an ATS would miss.
        </p>
      </div>
    </section>
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

function MetricRow({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  const color = accent ? "var(--color-accent)" : value >= 75 ? "var(--color-accent)" : value >= 60 ? "#f59e0b" : "var(--color-subtle)";
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-[13px] text-foreground/70">{label}</span>
      <span className="w-9 text-right text-[14px] font-bold tabular-nums" style={{ color }}>{value}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function CandidateDrawer({
  candidate,
  onClose,
  fit = null,
  teamDna = null,
}: {
  candidate: RankedCandidate;
  onClose: () => void;
  fit?: CandidateTeamFit | null;
  teamDna?: TeamDNA | null;
}) {
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

        {fit && teamDna && (
          <Section title="Team Fit">
            <div className="mb-4"><TeamFitPill score={fit.team_fit_score} /></div>
            <div className="flex flex-col gap-2.5">
              <MetricRow label="Job Match" value={candidate.score} />
              <MetricRow label="Team Compatibility" value={fit.compatibility.overall} />
              <MetricRow label="Team Contribution" value={fit.contribution.overall} />
              <MetricRow label="Overall Team Fit" value={fit.team_fit_score} accent />
            </div>

            <AxisBreakdown fit={fit} />

            <div className="mt-5 flex flex-col gap-4">
              <ReasonList title="Why compatible" reasons={compatibilityReasons(fit)} />
              <ReasonList title="What they add" reasons={contributionReasons(fit)} />
            </div>

            <div className="mt-5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-accent/80">PeakMinds Insight</p>
              <p className="text-[13.5px] leading-[1.65] text-foreground/75">{generateInsight(fit, teamDna)}</p>
            </div>
            {fit.contribution.fills_gaps.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Fills team gaps</p>
                <ul className="flex flex-wrap gap-2">
                  {fit.contribution.fills_gaps.map((g) => (
                    <li key={g} className="rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-1 text-[12.5px] text-emerald-300/90">{capTerm(g)}</li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        )}

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

// ── Team DNA card: narrative + strengths/gaps (with evidence drill-down) + traits ──

const AXIS_UI_LABEL: Record<CompatibilityAxis, string> = {
  skill_alignment: "Skill overlap",
  domain_alignment: "Domain",
  seniority_alignment: "Seniority",
  leadership_alignment: "Leadership",
  work_style_alignment: "Work style",
  semantic_alignment: "Profile alignment",
};

/** A strength/gap chip that expands to show its source document + verbatim excerpt. */
function EvidenceItem({ signal, tone }: { signal: TeamSignal; tone: "strength" | "gap" }) {
  const [open, setOpen] = useState(false);
  const excerpt = signal.evidence?.[0];
  const sources = signal.sources ?? [];
  const hasEvidence = !!excerpt || sources.length > 0;
  const chip = tone === "gap"
    ? "border-accent/25 bg-accent/[0.06] text-foreground/80"
    : "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300/90";
  return (
    <li className="w-full">
      <button
        type="button"
        onClick={() => hasEvidence && setOpen((o) => !o)}
        className={["inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] transition", chip, hasEvidence ? "cursor-pointer hover:brightness-110" : "cursor-default"].join(" ")}
        aria-expanded={hasEvidence ? open : undefined}
      >
        {capTerm(signal.label)}
        {hasEvidence && <span className="text-[9px] opacity-70" aria-hidden="true">{open ? "▲" : "▼"}</span>}
      </button>
      {open && hasEvidence && (
        <div className="mt-1.5 w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-[12px] leading-[1.55] text-foreground/70">
          {excerpt && <p className="italic">“{excerpt}”</p>}
          <p className={excerpt ? "mt-1.5 text-muted" : "text-muted"}>
            Found in: {sources.length > 0 ? sources.join(", ") : "extracted from team documents"}
          </p>
        </div>
      )}
    </li>
  );
}

function TeamDnaCard({ dna }: { dna: TeamDNA }) {
  const summary = teamDnaSummary(dna);
  const narrative = teamDnaNarrative(dna);
  const strengthSignals = (dna.strengths.length ? dna.strengths : dna.skills).slice(0, 5);
  const gapSignals = dna.gaps.slice(0, 5);
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-5 lg:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Team DNA</p>
      <p className="mt-2 text-[14.5px] leading-[1.6] text-foreground/85">{narrative}</p>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Team strengths</p>
          {strengthSignals.length > 0 ? (
            <ul className="flex flex-col items-start gap-1.5">
              {strengthSignals.map((s) => <EvidenceItem key={s.label} signal={s} tone="strength" />)}
            </ul>
          ) : <p className="text-[13px] text-faint">—</p>}
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Capability gaps</p>
          {gapSignals.length > 0 ? (
            <ul className="flex flex-col items-start gap-1.5">
              {gapSignals.map((g) => <EvidenceItem key={g.label} signal={g} tone="gap" />)}
            </ul>
          ) : <p className="text-[13px] text-faint">None detected</p>}
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Characteristics</p>
          {summary.characteristics.length > 0 ? (
            <ul className="flex flex-col gap-1.5 text-[13px] text-foreground/75">
              {summary.characteristics.map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
          ) : <p className="text-[13px] text-faint">—</p>}
        </div>
      </div>
    </div>
  );
}

/** Per-axis compatibility bars — only signal-bearing axes (weak/neutral suppressed). */
function AxisBreakdown({ fit }: { fit: CandidateTeamFit }) {
  const axes = signalAxes(fit);
  if (axes.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Compatibility breakdown</p>
      <div className="flex flex-col gap-2">
        {axes.map((a) => <MetricRow key={a.axis} label={AXIS_UI_LABEL[a.axis]} value={a.score} />)}
      </div>
    </div>
  );
}

/** A "✓ reason" list for explainability. Renders nothing when empty. */
function ReasonList({ title, reasons }: { title: string; reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</p>
      <ul className="flex flex-col gap-1.5">
        {reasons.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px] leading-[1.5] text-foreground/80">
            <span className="mt-[1px] text-emerald-400" aria-hidden="true">✓</span>
            {r}
          </li>
        ))}
      </ul>
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
