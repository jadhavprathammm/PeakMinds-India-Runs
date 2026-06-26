"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { easeOutQuart } from "@/lib/motion";
import type { WorkspaceCandidate } from "./data";
import EvidenceChips from "./EvidenceChips";
import RecruiterSummary from "./RecruiterSummary";

const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;

function useCountUp(target: number, durationMs = 700) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVal(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / durationMs, 1);
      const eased = 1 - Math.pow(2, -10 * p);
      setVal(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return val;
}

// Shared enter animation — each block slides up and fades in at its own delay.
const sectionVariants = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.25, ease: easeOutQuart },
});

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </h4>
  );
}

interface Props {
  candidate: WorkspaceCandidate;
}

export default function CandidateDetails({ candidate }: Props) {
  const score = useCountUp(candidate.score);
  const offset = RING_C * (1 - candidate.score / 100);

  const positives = candidate.ledger.filter((r) => r.weight >= 0);
  const risks = candidate.ledger.filter((r) => r.weight < 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: easeOutQuart }}
      role="region"
      aria-label={`Details for candidate ${candidate.id}`}
      aria-live="polite"
    >
      {/* ── 1. Identity + Score Ring (compact header) ──────────────────────── */}
      <motion.div
        {...sectionVariants(0)}
        className="flex items-start justify-between gap-5"
      >
        <div className="min-w-0">
          <span className="block text-[11px] uppercase tracking-wider text-faint">
            Candidate
          </span>
          <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-foreground">
            {candidate.id}
          </p>
          <h3 className="mt-2 text-[17px] font-semibold tracking-tight text-foreground">
            {candidate.role}
          </h3>
          <p className="mt-0.5 text-[14px] text-subtle">
            {candidate.company} · {candidate.experience} yrs experience
          </p>
        </div>

        {/* Score Ring */}
        <div className="flex shrink-0 flex-col items-center">
          <div className="relative">
            <div
              className="absolute inset-[-12px] rounded-full blur-2xl pointer-events-none"
              style={{ backgroundColor: "rgba(255,77,141,0.08)" }}
              aria-hidden="true"
            />
            <svg
              width="104"
              height="104"
              viewBox="0 0 104 104"
              fill="none"
              role="img"
              aria-label={`Overall match ${candidate.score} out of 100`}
              className="relative [filter:drop-shadow(0_0_12px_rgba(255,77,141,0.32))]"
            >
              <defs>
                <linearGradient id="wsRing" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" />
                  <stop offset="100%" stopColor="#b06bff" />
                </linearGradient>
              </defs>
              <circle
                cx="52"
                cy="52"
                r={RING_R}
                stroke="var(--color-border)"
                strokeWidth="6"
              />
              <motion.circle
                cx="52"
                cy="52"
                r={RING_R}
                stroke="url(#wsRing)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                initial={{ strokeDashoffset: RING_C }}
                animate={{ strokeDashoffset: offset }}
                transition={{ delay: 0.1, duration: 0.8, ease: "easeOut" }}
                transform="rotate(-90 52 52)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold tracking-tight text-gradient-accent tabular-nums">
                {score}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-subtle">
                Match
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="my-5 border-t border-border" />

      {/* ── 2. Score Impact (positive contributions) ───────────────────────── */}
      <motion.div {...sectionVariants(0.16)}>
        <SectionLabel>Score Impact</SectionLabel>
        <div className="flex flex-col gap-2">
          {positives.map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-10 shrink-0 text-[15px] font-bold tabular-nums text-accent">
                +{row.weight}
              </span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#ff4d8d,#b06bff)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(row.weight / 14, 1) * 100}%` }}
                  transition={{ delay: 0.2, duration: 0.6, ease: easeOutQuart }}
                />
              </div>
              <span className="w-[150px] shrink-0 text-right text-[14px] text-foreground/80">
                {row.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="my-5 border-t border-border" />

      {/* ── 3. Evidence ────────────────────────────────────────────────────── */}
      <motion.div {...sectionVariants(0.26)}>
        <SectionLabel>Evidence</SectionLabel>
        <EvidenceChips items={candidate.evidence} startDelay={0} />
      </motion.div>

      <div className="my-5 border-t border-border" />

      {/* ── 4. Recruiter Summary ───────────────────────────────────────────── */}
      <motion.div {...sectionVariants(0.34)}>
        <RecruiterSummary text={candidate.summary} startDelay={0} />
      </motion.div>

      <div className="my-5 border-t border-border" />

      {/* ── 5. Key Skills ──────────────────────────────────────────────────── */}
      <motion.div {...sectionVariants(0.42)}>
        <SectionLabel>Key Skills</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {candidate.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-3 py-1 text-[13px] font-medium text-foreground/85"
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      {risks.length > 0 && (
        <>
          <div className="my-5 border-t border-border" />

          {/* ── 6. Risk Factors ────────────────────────────────────────────── */}
          <motion.div {...sectionVariants(0.5)}>
            <SectionLabel>Risk Factors</SectionLabel>
            <div className="flex flex-col gap-2">
              {risks.map((row) => (
                <div key={row.label} className="flex items-center gap-2.5">
                  <WarnIcon />
                  <span className="text-[14px] text-foreground/75">
                    {row.label}
                  </span>
                  <span className="ml-auto text-[13px] font-semibold tabular-nums text-subtle">
                    −{Math.abs(row.weight)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

function WarnIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="var(--color-subtle)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M8 2L14 13H2L8 2z" />
      <line x1="8" y1="6.5" x2="8" y2="9.5" />
      <line x1="8" y1="11.5" x2="8" y2="11.6" />
    </svg>
  );
}
