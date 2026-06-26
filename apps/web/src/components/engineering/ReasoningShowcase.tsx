"use client";

import { motion } from "framer-motion";
import { easeOutQuart } from "@/lib/motion";

const EVIDENCE = [
  "Has shipped ranking systems to production",
  "NDCG / MRR / A/B evaluation experience confirmed",
  "6 years applied ML — pre-LLM depth",
] as const;

const CONCERN = "Notice period may exceed 30 days";

export default function ReasoningShowcase() {
  return (
    <div role="region" aria-label="Candidate reasoning example">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, ease: easeOutQuart }}
        className="relative overflow-hidden rounded-card border border-accent/20 bg-surface/70 backdrop-blur-sm shadow-elevated px-8 py-10 sm:px-12 sm:py-12 transition-colors duration-[250ms] hover:border-accent/40"
      >
        {/* Top accent shimmer */}
        <div
          className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,77,141,0.35) 50%, transparent)",
          }}
          aria-hidden="true"
        />

        {/* Header row — presentation scale +25%: xl→2xl, 2xl→3xl */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight leading-tight">
              Why Rank #1?
            </h3>
            <p className="mt-1.5 text-[20px] text-muted">
              The exact reasoning the system produced.
            </p>
          </div>
          <span className="type-eyebrow shrink-0 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5">
            Tier 5 — Top Pick
          </span>
        </div>

        {/* Candidate metadata — +25%: xl→25px */}
        <div className="mt-7">
          <p className="font-mono text-[25px] font-bold tracking-tight text-foreground">
            CAND_0046525
          </p>
          <p className="mt-1.5 text-[20px] text-muted">
            Senior Machine Learning Engineer · Genpact AI · 6 yrs
          </p>
        </div>

        <div className="my-7 border-t border-border" />

        {/* Evidence + concern — +25%: 16px→20px */}
        <div className="flex flex-col gap-5">
          {EVIDENCE.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: easeOutQuart }}
              className="flex items-center gap-3"
            >
              <CheckIcon />
              <span className="text-[20px] text-foreground leading-snug">{item}</span>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              delay: 0.3 + EVIDENCE.length * 0.08,
              duration: 0.4,
              ease: easeOutQuart,
            }}
            className="flex items-center gap-3 mt-1"
          >
            <WarnIcon />
            <span className="text-[20px] text-muted leading-snug italic">{CONCERN}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Closing line — +25%: 16px→20px */}
      <p className="mt-7 text-center text-[20px] text-foreground/70 italic">
        Every candidate in the top 100 is ranked with reasoning like this — no hallucination,
        no black box.
      </p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
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

function WarnIcon() {
  return (
    <svg
      width="20"
      height="20"
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
      <line x1="8" y1="6" x2="8" y2="9.5" />
      <line x1="8" y1="11.5" x2="8" y2="12" />
    </svg>
  );
}
