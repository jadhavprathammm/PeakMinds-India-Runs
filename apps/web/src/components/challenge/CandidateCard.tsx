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

function ScoreRing({ score, delay }: { score: number; delay: number }) {
  const offset = C * (1 - score / 100);
  return (
    <svg
      width="69"
      height="69"
      viewBox="0 0 84 84"
      fill="none"
      role="img"
      aria-label={`Match score ${score} out of 100`}
      className="shrink-0"
    >
      <defs>
        <linearGradient id={`ccRing${score}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="#b06bff" />
        </linearGradient>
      </defs>
      <circle cx="42" cy="42" r={R} stroke="var(--color-border)" strokeWidth="4" />
      <motion.circle
        cx="42"
        cy="42"
        r={R}
        stroke={`url(#ccRing${score})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={C}
        initial={{ strokeDashoffset: C }}
        whileInView={{ strokeDashoffset: offset }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ delay, duration: 1.2, ease: "easeOut" }}
        transform="rotate(-90 42 42)"
      />
      <text x="42" y="40" textAnchor="middle" dominantBaseline="middle" fill="var(--color-foreground)" fontSize="21" fontWeight="700" fontFamily="var(--font-sans)">
        {score}
      </text>
      <text x="42" y="56" textAnchor="middle" dominantBaseline="middle" fill="var(--color-subtle)" fontSize="9" fontFamily="var(--font-sans)">
        / 100
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
        y: -4,
        boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        transition: { type: "spring", stiffness: 260, damping: 26 },
      }}
      className={[
        "group relative overflow-hidden rounded-card border bg-surface/70 backdrop-blur-sm",
        "px-6 py-7 sm:px-9 sm:py-8 cursor-default transition-colors duration-300",
        isTop
          ? "border-accent/30 hover:border-accent/60"
          : "border-border hover:border-white/20",
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
          <div className="transition-[filter] duration-300 [filter:drop-shadow(0_0_0_rgba(255,77,141,0))] group-hover:[filter:drop-shadow(0_0_10px_rgba(255,77,141,0.45))]">
            <ScoreRing score={candidate.score} delay={0.2 + index * 0.12} />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
            Match
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
