"use client";

import { type FC, type ReactNode } from "react";
import { motion } from "framer-motion";
import { easeOutQuart } from "@/lib/motion";

// PeakMinds' actual ranking pipeline. Each node reveals in sequence and its
// connector illuminates progressively, so the flow reads as a live process:
// a job description entering the system and a ranked candidate coming out.

interface PipelineNode {
  label: ReactNode;
  icon: FC;
  result?: boolean;
}

const NODES: PipelineNode[] = [
  { label: "Job Description", icon: DocIcon },
  { label: "Intent Extraction", icon: TargetIcon },
  { label: "Semantic Understanding", icon: SparkIcon },
  {
    label: (
      <>
        <span className="font-semibold text-accent">98</span> Engineered Signals
      </>
    ),
    icon: SignalIcon,
  },
  { label: "Hybrid Retrieval", icon: LayersIcon },
  { label: "Explainable Ranking", icon: RankIcon },
  { label: "Top Candidate", icon: StarIcon, result: true },
];

const BASE = 0.35; // first node delay
const STEP = 0.34; // cadence between nodes

export default function PipelineFlow() {
  return (
    <div
      className="flex w-full max-w-[260px] flex-col items-stretch"
      aria-label="PeakMinds ranking pipeline"
    >
      {NODES.map((node, i) => {
        const delay = BASE + i * STEP;
        const Icon = node.icon;
        const isLast = i === NODES.length - 1;

        return (
          <div key={i} className="flex flex-col items-center">
            {/* Node */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.5, ease: easeOutQuart }}
              className={[
                "relative flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 backdrop-blur-sm",
                node.result
                  ? "border-accent/40 bg-accent/[0.08] shadow-accent"
                  : "border-border bg-surface/60",
              ].join(" ")}
            >
              {/* Icon box — lights up to accent as the node activates */}
              {node.result ? (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon />
                </span>
              ) : (
                <motion.span
                  initial={{ borderColor: "rgba(255,255,255,0.08)", color: "#71717a" }}
                  animate={{ borderColor: "rgba(255,77,141,0.32)", color: "#ff4d8d" }}
                  transition={{ delay: delay + 0.12, duration: 0.45 }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border"
                >
                  <Icon />
                </motion.span>
              )}

              <span
                className={[
                  "text-sm leading-tight",
                  node.result ? "font-semibold text-foreground" : "text-muted",
                ].join(" ")}
              >
                {node.label}
              </span>

              {/* Result node: a slow living pulse + a faint bridge toward the
                  dashboard on the widest layout. */}
              {node.result && (
                <>
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-accent/40"
                    animate={{ opacity: [0.5, 0.12, 0.5] }}
                    transition={{
                      duration: 2.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: delay + 0.6,
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className="absolute left-full top-1/2 ml-2 hidden h-px w-7 -translate-y-1/2 border-t border-dashed border-accent/30 xl:block"
                    aria-hidden="true"
                  />
                </>
              )}
            </motion.div>

            {/* Connector — fills with accent as the flow progresses */}
            {!isLast && (
              <div
                className="relative my-1 h-8 w-px overflow-hidden bg-border"
                aria-hidden="true"
              >
                <motion.div
                  className="absolute inset-x-0 top-0 h-full w-px origin-top bg-accent"
                  initial={{ scaleY: 0, opacity: 0.15 }}
                  animate={{ scaleY: 1, opacity: 0.55 }}
                  transition={{
                    delay: delay + 0.28,
                    duration: 0.3,
                    ease: easeOutQuart,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Icons (16×16) ────────────────────────────────────────────────────────────

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 2.5h5l3 3v8H4z" />
      <path d="M9 2.5v3h3" />
      <path d="M6 8.5h4M6 11h4" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="2.4" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2l1.4 4.6L14 8l-4.6 1.4L8 14l-1.4-4.6L2 8l4.6-1.4z" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 13V9.5M7 13V6M11 13V2.5" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2.5l5.5 3L8 8.5 2.5 5.5z" />
      <path d="M2.5 9L8 12l5.5-3" />
    </svg>
  );
}

function RankIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4h9M3 8h6M3 12h3" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1l1.9 4.6 4.9.4-3.7 3.2 1.1 4.8L8 11.5 3.7 14l1.1-4.8L1.1 6l4.9-.4z" />
    </svg>
  );
}
