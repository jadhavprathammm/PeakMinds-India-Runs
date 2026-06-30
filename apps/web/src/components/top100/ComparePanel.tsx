"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { RankedEntry } from "@/lib/top100data";
import { CANDIDATES } from "@/components/workspace/data";

interface Props {
  ids: [string, string];
  allEntries: RankedEntry[];
  onClose: () => void;
}

function win(a: number, b: number) {
  if (a > b) return [true, false];
  if (b > a) return [false, true];
  return [false, false];
}

function getSeniority(exp: number): { label: string; color: string } {
  if (exp >= 12) return { label: "Principal", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
  if (exp >= 9) return { label: "Staff", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
  if (exp >= 6) return { label: "Senior", color: "bg-accent/20 text-accent border-accent/30" };
  if (exp >= 3) return { label: "Mid", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
  return { label: "Junior", color: "bg-surface-elevated text-muted border-border" };
}

function getRiskLevel(concerns: string[]): { label: string; color: string } {
  if (concerns.length === 0) return { label: "Low", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
  if (concerns.length <= 1) return { label: "Medium", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
  return { label: "High", color: "bg-red-500/20 text-red-300 border-red-500/30" };
}

function WinCell({ children, isWinner }: { children: React.ReactNode; isWinner: boolean }) {
  return (
    <div
      className={[
        "rounded-lg px-3 py-2 text-[14px] leading-[1.5]",
        isWinner
          ? "bg-accent/12 border border-accent/30 text-foreground"
          : "bg-surface/40 border border-border text-foreground/70",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

export default function ComparePanel({ ids, allEntries, onClose }: Props) {
  const entries = ids.map((id) => allEntries.find((c) => c.id === id)!);
  const rich = ids.map((id) => CANDIDATES.find((c) => c.id === id));

  const [aWinsScore, bWinsScore] = win(entries[0].score, entries[1].score);
  const [aWinsExp, bWinsExp] = win(entries[0].experience, entries[1].experience);
  const [aWinsRank, bWinsRank] = win(entries[1].rank, entries[0].rank); // lower rank = better

  const concerns = rich.map((r) =>
    r ? r.ledger.filter((l) => l.weight < 0).map((l) => l.label) : []
  );
  const [aWinsConcern, bWinsConcern] = win(concerns[1].length, concerns[0].length); // fewer concerns = better

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          className="relative z-10 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-border bg-[#0c1015] shadow-[0_-24px_80px_rgba(0,0,0,0.7)]"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 340, damping: 36 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-[#0c1015]/95 px-6 py-4 backdrop-blur-md">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                PeakMinds Intelligence
              </p>
              <h2 className="mt-0.5 text-[18px] font-bold text-foreground">Candidate Comparison</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-subtle transition-colors hover:border-border-strong hover:text-foreground"
              aria-label="Close comparison"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-6">
            {/* Candidate headers */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              {entries.map((c, i) => {
                const seniority = getSeniority(c.experience);
                const risk = getRiskLevel(concerns[i]);
                return (
                  <div key={c.id} className="rounded-xl border border-border bg-surface/50 p-4">
                    <p className="font-mono text-[13px] font-semibold text-accent">{c.id}</p>
                    <p className="mt-1 text-[15px] font-semibold text-foreground">{c.role}</p>
                    <p className="mt-0.5 text-[13px] text-subtle">{c.company} · {c.experience} yrs</p>
                    {rich[i] && (
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                        Rank #{c.rank}
                      </p>
                    )}
                    {/* TWO BADGES - HONEST, HIGH IMPACT */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${seniority.color}`}>{seniority.label}</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${risk.color}`}>{risk.label} Risk</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-5">
              {/* Score */}
              <Row label="Model Score">
                {entries.map((c, i) => (
                  <WinCell key={i} isWinner={i === 0 ? aWinsScore : bWinsScore}>
                    <span className="text-[20px] font-bold tabular-nums text-gradient-accent">
                      {c.score.toFixed(3)}
                    </span>
                  </WinCell>
                ))}
              </Row>

              {/* Rank */}
              <Row label="Rank">
                {entries.map((c, i) => (
                  <WinCell key={i} isWinner={i === 0 ? aWinsRank : bWinsRank}>
                    #{c.rank} of 100
                  </WinCell>
                ))}
              </Row>

              {/* Experience */}
              <Row label="Experience">
                {entries.map((c, i) => (
                  <WinCell key={i} isWinner={i === 0 ? aWinsExp : bWinsExp}>
                    {c.experience} years
                  </WinCell>
                ))}
              </Row>

              {/* Top Skills */}
              <Row label="Top Skills">
                {entries.map((c, i) => (
                  <div key={i} className="rounded-lg border border-border bg-surface/40 px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {c.skills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex rounded-full border border-border bg-surface-elevated px-2 py-0.5 text-[12px] text-muted"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </Row>

              {/* Rich data — only if available */}
              {(rich[0] || rich[1]) && (
                <>
                  {/* Score Drivers */}
                  <Row label="Top Score Drivers">
                    {rich.map((r, i) => (
                      <div key={i} className="rounded-lg border border-border bg-surface/40 px-3 py-2">
                        {r ? (
                          <div className="flex flex-col gap-1">
                            {r.ledger
                              .filter((l) => l.weight > 0)
                              .slice(0, 3)
                              .map((l) => (
                                <div key={l.label} className="flex items-center gap-2">
                                  <span className="text-[13px] font-bold tabular-nums text-accent w-8 shrink-0">
                                    +{l.weight}
                                  </span>
                                  <span className="text-[13px] text-foreground/75">{l.label}</span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <span className="text-[13px] text-subtle">No detailed data</span>
                        )}
                      </div>
                    ))}
                  </Row>

                  {/* Evidence */}
                  <Row label="Key Evidence">
                    {rich.map((r, i) => (
                      <div key={i} className="rounded-lg border border-border bg-surface/40 px-3 py-2">
                        {r ? (
                          <ul className="flex flex-col gap-1">
                            {r.evidence.slice(0, 3).map((e) => (
                              <li key={e} className="flex items-start gap-1.5 text-[13px] text-foreground/75">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                                {e}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-[13px] text-subtle">No detailed data</span>
                        )}
                      </div>
                    ))}
                  </Row>

                  {/* Concerns */}
                  <Row label={`Concerns ${concerns.some(c => c.length) ? "(fewer = better ✓)" : ""}`}>
                    {rich.map((r, i) => (
                      <WinCell key={i} isWinner={i === 0 ? aWinsConcern : bWinsConcern}>
                        {concerns[i].length === 0 ? (
                          <span className="text-[13px] text-accent">No concerns flagged</span>
                        ) : (
                          <span className="text-[13px] text-foreground/70">{concerns[i].join("; ")}</span>
                        )}
                      </WinCell>
                    ))}
                  </Row>

                  {/* AI Summary */}
                  <Row label="AI Recruiter Summary">
                    {rich.map((r, i) => (
                      <div key={i} className="rounded-lg border border-border bg-surface/40 px-3 py-2 text-[13px] leading-[1.6] text-foreground/75">
                        {r ? r.summary : <span className="text-subtle">Not available</span>}
                      </div>
                    ))}
                  </Row>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
