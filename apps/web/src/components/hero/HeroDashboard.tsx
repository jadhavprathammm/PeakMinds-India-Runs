"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import QualityChart from "./QualityChart";
import ReasoningPanel, { type ReasoningFactor } from "./ReasoningPanel";
import { easeOutQuart } from "@/lib/motion";

// ── Data ─────────────────────────────────────────────────────────────────────

const SKILLS = ["Python", "System Design", "Leadership"];

const FACTORS: ReasoningFactor[] = [
  { label: "Semantic Similarity", value: 12 },
  { label: "Product Experience", value: 8 },
  { label: "Leadership", value: 6 },
  { label: "Availability", value: 5 },
];

// ── Score ring ───────────────────────────────────────────────────────────────

const R = 30;
const C = 2 * Math.PI * R;

function ScoreRing({ score, delay = 0 }: { score: number; delay?: number }) {
  const offset = C * (1 - score / 100);
  return (
    <svg
      width="84"
      height="84"
      viewBox="0 0 84 84"
      fill="none"
      role="img"
      aria-label={`Match score ${score} out of 100`}
    >
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="#b06bff" />
        </linearGradient>
      </defs>
      <circle cx="42" cy="42" r={R} stroke="var(--color-border)" strokeWidth="5" />
      <motion.circle
        cx="42"
        cy="42"
        r={R}
        stroke="url(#ringGrad)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={C}
        initial={{ strokeDashoffset: C }}
        animate={{ strokeDashoffset: offset }}
        transition={{ delay, duration: 1.3, ease: "easeOut" }}
        transform="rotate(-90 42 42)"
      />
      <text x="42" y="39" textAnchor="middle" dominantBaseline="middle" fill="var(--color-foreground)" fontSize="22" fontWeight="700" fontFamily="var(--font-sans)">
        {score}
      </text>
      <text x="42" y="55" textAnchor="middle" dominantBaseline="middle" fill="var(--color-subtle)" fontSize="9" fontFamily="var(--font-sans)">
        /100
      </text>
    </svg>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export default function HeroDashboard() {
  const [chartHovered, setChartHovered] = useState(false);

  return (
    <div className="relative w-full">
      {/* Soft halo behind the whole cluster */}
      <div
        className="absolute -inset-6 rounded-[40%] bg-accent/[0.06] blur-[80px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-4">
        {/* ── Spotlight: Best Match ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24, x: 12 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          whileHover={{
            y: -4,
            boxShadow: "0 28px 64px rgba(0,0,0,0.60)",
            transition: { type: "spring", stiffness: 280, damping: 28 },
          }}
          transition={{ delay: 0.3, duration: 0.85, ease: easeOutQuart }}
          className="relative overflow-hidden rounded-card border border-border bg-surface/90 backdrop-blur-sm shadow-elevated p-5 lg:p-6 cursor-default transition-[border-color] duration-200 hover:border-white/[0.14]"
        >
          {/* Top accent edge + interior corner warmth */}
          <div
            className="absolute top-0 inset-x-0 h-px pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,77,141,0.4) 50%, transparent)",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full bg-accent/[0.08] blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="type-eyebrow block mb-2.5">Best Match</span>
              <h3 className="text-xl lg:text-2xl font-semibold text-foreground leading-tight tracking-tight">
                Ananya Kapoor
              </h3>
              <p className="text-sm text-subtle mt-1">Senior Backend Engineer</p>
              <p className="text-sm font-medium text-accent mt-3">
                Excellent Semantic Alignment
              </p>

              <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full border border-accent/25 bg-accent/10 text-accent text-[11px] font-semibold">
                <StarBadge />
                Top 1%
              </span>
            </div>

            {/* Floating score ring — rotates + scales on hover */}
            <div className="shrink-0 flex flex-col items-center">
              <motion.div
                whileHover={{
                  rotate: 2.5,
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 350, damping: 25 },
                }}
                className="rounded-2xl border border-border bg-surface-elevated/80 shadow-card p-1.5 cursor-default"
              >
                <ScoreRing score={94} delay={0.6} />
              </motion.div>
              <span className="text-[9px] font-semibold text-subtle uppercase tracking-wider mt-2">
                Match Score
              </span>
            </div>
          </div>

          <div className="border-t border-border my-4" />

          <div className="flex flex-wrap gap-2">
            {SKILLS.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2.5 py-1 rounded-full border border-border text-[11px] font-medium text-subtle"
              >
                {skill}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ── Secondary row: reasoning + quality ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20, x: -10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 0.55, duration: 0.75, ease: easeOutQuart }}
            className="rounded-card border border-border bg-surface/90 backdrop-blur-sm shadow-card p-5"
          >
            <span className="text-[10px] font-semibold text-subtle uppercase tracking-widest block mb-3">
              Reasoning
            </span>
            <ReasoningPanel factors={FACTORS} startDelay={0.75} />
          </motion.div>

          {/* Quality chart — glow activates on hover */}
          <motion.div
            initial={{ opacity: 0, y: 20, x: 10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            onHoverStart={() => setChartHovered(true)}
            onHoverEnd={() => setChartHovered(false)}
            transition={{ delay: 0.68, duration: 0.75, ease: easeOutQuart }}
            className="rounded-card border border-border bg-surface/90 backdrop-blur-sm shadow-card p-5 flex flex-col cursor-default"
          >
            <span className="text-[10px] font-semibold text-subtle uppercase tracking-widest block mb-3">
              Quality Trend
            </span>
            <div className="flex-1 flex items-center">
              <QualityChart animationDelay={0.85} isGlowing={chartHovered} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StarBadge() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" aria-hidden="true">
      <path d="M4.5 0L5.5 3.3H9L6.25 5.35 7.24 8.65 4.5 6.6 1.76 8.65 2.75 5.35 0 3.3H3.5Z" />
    </svg>
  );
}
