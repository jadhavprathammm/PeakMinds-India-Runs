"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { easeOutQuart } from "@/lib/motion";

interface Stage {
  label: string;
  detail: string;
  icon: FC;
  highlight?: boolean;
}

const STAGES: Stage[] = [
  { label: "Job Description", detail: "Understand hiring requirements", icon: DocIcon },
  { label: "Intent Extraction", detail: "Identify recruiter intent", icon: TargetIcon },
  { label: "Feature Engineering", detail: "Build candidate signals", icon: WrenchIcon },
  { label: "Semantic Embeddings", detail: "Capture meaning beyond keywords", icon: WaveIcon },
  { label: "Hybrid Retrieval", detail: "Find the strongest matches", icon: LayersIcon },
  { label: "Explainable Ranking", detail: "Explain every recommendation", icon: RankIcon },
  { label: "Top 100 Submission", detail: "Generate final ranked candidates", icon: TrophyIcon, highlight: true },
];

const BASE = 0.15;
const STEP = 0.22;

export default function PipelineTimeline() {
  return (
    <div>
      <div className="mb-[4.5rem] lg:mb-24 text-center">
        <span className="type-eyebrow block mb-4">The Intelligence Pipeline</span>
        <h3 className="type-section font-bold">How PeakMinds Thinks</h3>
      </div>

      {/* ── Desktop: horizontal timeline ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex items-start"
        aria-label="Ranking pipeline stages"
      >
        {STAGES.map((stage, i) => {
          const nodeDelay = BASE + i * STEP;
          const connectorDelay = nodeDelay + 0.14;
          const isLast = i === STAGES.length - 1;
          const Icon = stage.icon;

          return (
            <div key={i} className="group/stage relative flex flex-1 flex-col items-center text-center">
              {/* Connector to next node — sits behind the icon at its center */}
              {!isLast && (
                <div
                  className="absolute left-1/2 top-[42px] z-0 h-0.5 w-full overflow-hidden rounded-full bg-border transition-colors duration-300 group-hover/stage:bg-accent/25"
                  aria-hidden="true"
                >
                  <motion.div
                    className="absolute inset-0 origin-left rounded-full bg-accent transition-shadow duration-300 group-hover/stage:shadow-[0_0_8px_rgba(255,77,141,0.5)]"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ delay: connectorDelay, duration: 0.3, ease: easeOutQuart }}
                  />
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: nodeDelay, duration: 0.42, ease: easeOutQuart }}
                className="relative z-10 flex flex-col items-center px-4"
              >
                <div
                  className={[
                    "flex h-[84px] w-[84px] items-center justify-center rounded-2xl border transition-all duration-300",
                    stage.highlight
                      ? "bg-accent border-accent text-accent-foreground shadow-accent"
                      : "bg-surface border-border text-accent group-hover/stage:border-accent/45 group-hover/stage:bg-surface-hover group-hover/stage:shadow-[0_0_24px_rgba(255,77,141,0.14)]",
                  ].join(" ")}
                >
                  <Icon />
                </div>
                <p className="mt-5 text-[15px] font-semibold text-foreground leading-tight">
                  {stage.label}
                </p>
                <p className="mt-2 text-[13px] text-muted leading-snug max-w-[132px]">
                  {stage.detail}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* ── Mobile / tablet: vertical timeline with left rail ─────────────────── */}
      <div className="lg:hidden relative" aria-label="Ranking pipeline stages">
        {/* Continuous rail behind the icon column */}
        <div
          className="absolute left-8 top-8 bottom-8 w-0.5 rounded-full bg-border"
          aria-hidden="true"
        />
        <motion.div
          className="absolute left-8 top-8 w-0.5 origin-top rounded-full bg-accent"
          style={{ bottom: "2rem" }}
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: BASE, duration: 1.4, ease: easeOutQuart }}
          aria-hidden="true"
        />

        <div className="flex flex-col gap-7">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: BASE + i * 0.14, duration: 0.45, ease: easeOutQuart }}
                className="relative flex items-center gap-5"
              >
                <span
                  className={[
                    "relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border",
                    stage.highlight
                      ? "bg-accent border-accent text-accent-foreground shadow-accent"
                      : "bg-surface border-border text-accent",
                  ].join(" ")}
                >
                  <Icon />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-foreground leading-tight">
                    {stage.label}
                  </p>
                  <p className="mt-1 text-[13px] text-muted leading-snug">
                    {stage.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Icons (24×24 rendered, 16×16 viewBox — ~40% larger than the footer set) ───

function DocIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 2.5h5l3 3v8H4z" />
      <path d="M9 2.5v3h3" />
      <path d="M6 8.5h4M6 11h4" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="2.4" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 2.5a4 4 0 0 1 .6 5.4L4 14H2v-2l6.1-6.1a4 4 0 0 1 1.4-3.4z" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 8c1-2 2-2 3 0s2 2 3 0 2-2 3 0 1 2 3 0" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2.5l5.5 3L8 8.5 2.5 5.5z" />
      <path d="M2.5 9L8 12l5.5-3" />
    </svg>
  );
}

function RankIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4h9M3 8h6M3 12h3" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 10c-2.5 0-4.5-2-4.5-4.5V3.5h9v2C12.5 8 10.5 10 8 10z" />
      <path d="M3.5 3.5c-1 0-1.5.5-1.5 1.5 0 1.5 1 2.5 2 3" />
      <path d="M12.5 3.5c1 0 1.5.5 1.5 1.5 0 1.5-1 2.5-2 3" />
      <path d="M8 10v2.5M5.5 12.5h5" />
    </svg>
  );
}
