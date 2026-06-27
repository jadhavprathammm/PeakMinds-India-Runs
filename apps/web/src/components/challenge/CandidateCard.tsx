"use client";

import { motion } from "framer-motion";
import { type RankedCandidate } from "./data";
import { easeOutQuart } from "@/lib/motion";

interface Props {
  candidate: RankedCandidate;
  index: number;
}

// ── Score ring (~18% smaller than before: 84 → 69px) ─────────────────────────

const R = 32;
const C = 2 * Math.PI * R;
// Real model score band: Tier-5 floor (0.80) → availability-boosted max (1.10).
// Ring fill = the candidate's position within that band; centre shows the real score.
const S_FLOOR = 0.8;
const S_CEIL = 1.1;

function ScoreRing({ score, delay }: { score: number; delay: number }) {
  const fill = Math.min(Math.max((score - S_FLOOR) / (S_CEIL - S_FLOOR), 0), 1);
  const offset = C * (1 - fill);
  const gid = `ccRing${Math.round(score * 1000)}`;
  return (
    <svg
      width="69"
      height="69"
      viewBox="0 0 84 84"
      fill="none"
      role="img"
      aria-label={`Model score ${score.toFixed(2)}`}
      className="shrink-0"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="#b06bff" />
        </linearGradient>
      </defs>
      <circle cx="42" cy="42" r={R} stroke="var(--color-border)" strokeWidth="4" />
      <motion.circle
        cx="42"
        cy="42"
        r={R}
        stroke={`url(#${gid})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={C}
        initial={{ strokeDashoffset: C }}
        whileInView={{ strokeDashoffset: offset }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ delay, duration: 1.2, ease: "easeOut" }}
        transform="rotate(-90 42 42)"
      />
      <text x="42" y="40" textAnchor="middle" dominantBaseline="middle" fill="var(--color-foreground)" fontSize="19" fontWeight="700" fontFamily="var(--font-sans)">
        {score.toFixed(2)}
      </text>
      <text x="42" y="56" textAnchor="middle" dominantBaseline="middle" fill="var(--color-subtle)" fontSize="8.5" fontFamily="var(--font-sans)">
        score
      </text>
    </svg>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

export default function CandidateCard({ candidate, index }: Props) {
  const isTop = candidate.rank === 1;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.12, duration: 0.6, ease: easeOutQuart }}
      whileHover={{
        y: -2,
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        transition: { duration: 0.25, ease: easeOutQuart },
      }}
      className={[
        "group relative overflow-hidden rounded-card border bg-surface/70 backdrop-blur-sm",
        "px-6 py-7 sm:px-9 sm:py-8 cursor-default transition-all duration-[250ms]",
        isTop
          ? "border-accent/30 hover:border-accent/50"
          : "border-border hover:border-border-strong",
      ].join(" ")}
    >
      {isTop && (
        <div
          className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,77,141,0.55) 50%, transparent)",
          }}
          aria-hidden="true"
        />
      )}

      <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-9">
        {/* Rank — leads the eye */}
        <span
          className={[
            "text-5xl sm:text-6xl font-bold tabular-nums leading-none tracking-tight shrink-0",
            isTop ? "text-gradient-accent" : "text-faint",
          ].join(" ")}
        >
          #{candidate.rank}
        </span>

        {/* Candidate identity → role → company */}
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-normal tracking-wide text-faint/60">
            Candidate ID
          </span>
          <p className="mt-1.5 font-mono text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {candidate.id}
          </p>
          <h3 className="mt-3 text-base sm:text-lg font-semibold text-foreground leading-snug tracking-tight">
            {candidate.role}
          </h3>
          <p className="mt-1 text-sm text-subtle">
            {candidate.company} • {candidate.experience} yrs experience
          </p>

          {/* Evidence chips */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            {candidate.chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-[13px] font-medium text-muted"
              >
                <CheckIcon />
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Score — read last */}
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          <div className="transition-[filter] duration-[250ms] [filter:drop-shadow(0_0_0_rgba(255,77,141,0))] group-hover:[filter:drop-shadow(0_0_10px_rgba(255,77,141,0.45))]">
            <ScoreRing score={candidate.score} delay={0.2 + index * 0.12} />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
            Model Score
          </span>
        </div>
      </div>
    </motion.article>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="var(--color-accent)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <polyline points="2 6.5 4.5 9 10 3" />
    </svg>
  );
}
