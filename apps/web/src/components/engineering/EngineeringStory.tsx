"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion, MotionConfig } from "framer-motion";
import { easeOutQuart } from "@/lib/motion";

const VIEW = { once: true, margin: "-80px" } as const;

// ── Count-up hook (reduced-motion safe) ──────────────────────────────────────
function useCountUp(target: number, durationMs = 1500) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, VIEW);
  const prefersReduced = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReduced) {
      setVal(target);
      return;
    }
    let raf: number;
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
  }, [inView, target, durationMs, prefersReduced]);

  return { ref, val };
}

// ── Scene chrome ─────────────────────────────────────────────────────────────
function Scene({
  step,
  caption,
  children,
}: {
  step: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEW}
      transition={{ duration: 0.6, ease: easeOutQuart }}
      className="flex flex-col items-center text-center"
    >
      <span className="type-eyebrow text-[22px] mb-8 block">{step}</span>
      <div className="w-full">{children}</div>
      <p className="mt-8 max-w-3xl text-[22px] leading-[1.7] text-foreground/80">
        {caption}
      </p>
    </motion.div>
  );
}

// ── Connecting beam (draws on scroll; single pulse travels once) ──────────────
function Beam() {
  const prefersReduced = useReducedMotion();
  return (
    <div
      className="relative mx-auto my-6 h-24 w-0.5 overflow-hidden sm:h-28"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-white/[0.12]" />
      <motion.div
        className="absolute inset-x-0 top-0 h-full origin-top bg-[linear-gradient(180deg,rgba(255,77,141,0.95),rgba(176,107,255,0.75))]"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.65, ease: easeOutQuart }}
      />
      {!prefersReduced && (
        <motion.span
          className="absolute left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_14px_rgba(255,77,141,0.9)]"
          initial={{ top: "-14px", opacity: 0 }}
          whileInView={{ top: ["-14px", "100%"], opacity: [0, 1, 0] }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.55, duration: 0.95, ease: easeOutQuart }}
        />
      )}
    </div>
  );
}

// ── Scene 1: Résumé ──────────────────────────────────────────────────────────
const RESUME_LINES = ["85%", "70%", "92%", "60%", "78%"];

function ResumeCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={VIEW}
      transition={{ duration: 0.55, ease: easeOutQuart }}
      whileHover={{
        y: -2,
        transition: { duration: 0.25, ease: easeOutQuart },
      }}
      className="relative mx-auto w-full max-w-[264px] cursor-default overflow-hidden rounded-card border border-border bg-surface/80 p-5 text-left shadow-card backdrop-blur-sm"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[linear-gradient(180deg,rgba(255,77,141,0.16),transparent)]"
        initial={{ y: -56 }}
        whileInView={{ y: 230 }}
        viewport={VIEW}
        transition={{ delay: 0.45, duration: 1.21, ease: easeOutQuart }}
      />
      <p className="font-mono text-base font-bold tracking-tight text-foreground">
        CAND_0046525
      </p>
      <p className="mt-1 text-[13px] text-muted">Résumé · raw text</p>
      <div className="mt-4 flex flex-col gap-2" aria-hidden="true">
        {RESUME_LINES.map((w, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full bg-border"
            style={{ width: w }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Scene 2: Semantic tokens ─────────────────────────────────────────────────
const TOKENS = [
  "Production ML",
  "Ranking Systems",
  "NDCG",
  "MRR",
  "A/B Testing",
  "Embeddings",
  "Python",
  "NLP",
];

function TokenCloud() {
  return (
    <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3.5">
      {TOKENS.map((token, i) => (
        <motion.span
          key={token}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={VIEW}
          transition={{ delay: i * 0.07, duration: 0.4, ease: easeOutQuart }}
          className="rounded-full border border-accent/25 bg-accent/[0.06] px-4 py-2 text-[15px] font-medium text-foreground"
        >
          {token}
        </motion.span>
      ))}
    </div>
  );
}

// ── Scene 3: Engineered signals ──────────────────────────────────────────────
const SIGNALS = [
  { label: "Production Experience", level: 0.95 },
  { label: "Semantic Depth", level: 0.9 },
  { label: "ML Foundations", level: 0.88 },
  { label: "Evaluation Rigor", level: 0.82 },
  { label: "Consistency", level: 0.78 },
  { label: "Leadership", level: 0.7 },
];

function SignalBars() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      {SIGNALS.map((signal, i) => (
        <motion.div
          key={signal.label}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={VIEW}
          transition={{ delay: i * 0.08, duration: 0.4, ease: easeOutQuart }}
          className="group flex items-center gap-5"
        >
          {/* Presentation scale: 16px → 22px (+37%); column widened to fit */}
          <span className="w-72 shrink-0 text-left text-[20px] text-foreground/80">
            {signal.label}
          </span>
          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-border">
            <motion.div
              className="absolute inset-y-0 left-0 origin-left rounded-full bg-[linear-gradient(90deg,#ff4d8d,#b06bff)] transition-shadow duration-[250ms] group-hover:shadow-[0_0_12px_rgba(255,77,141,0.5)]"
              style={{ width: `${signal.level * 100}%` }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={VIEW}
              transition={{
                delay: 0.15 + i * 0.08,
                duration: 0.7,
                ease: easeOutQuart,
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Scene 4: Weighted scoring ledger (real pillar weights ×100 from src/scoring.py) ──
const LEDGER = [
  { label: "Role Fit", weight: "+42", positive: true },
  { label: "Experience", weight: "+18", positive: true },
  { label: "Production Depth", weight: "+12", positive: true },
  { label: "Pre-LLM ML Depth", weight: "+8", positive: true },
  { label: "Location & Availability", weight: "+8", positive: true },
];

function ScoringLedger() {
  return (
    /* Container widens to accommodate 24px weight + 23px label side by side */
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      {LEDGER.map((row, i) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={VIEW}
          transition={{ delay: i * 0.12, duration: 0.4, ease: easeOutQuart }}
          className="-mx-3 flex items-center gap-5 rounded-xl border-b border-border px-3 py-4 transition-colors duration-[250ms] last:border-b-0 hover:bg-surface/60"
        >
          {/* Positive: 18px → 24px; Negative: 15px → 20px */}
          <span
            className={[
              "w-16 shrink-0 text-left tabular-nums",
              row.positive
                ? "text-[24px] font-bold text-accent"
                : "text-[20px] font-semibold text-subtle",
            ].join(" ")}
          >
            {row.weight}
          </span>
          {/* Presentation scale: 17px → 23px (+35%) */}
          <span className="text-left text-[23px] text-foreground/80">
            {row.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Scene 5: Final score (the real #1 candidate's model score, S = S_fit × avail) ──
const SCORE = 1.01; // CAND_0046525, rank 1 in team_redrob.csv (1.0106)
const S_FLOOR = 0.8; // Tier-5 floor
const S_CEIL = 1.1; // availability-boosted ceiling
const RING_R = 58;
const RING_C = 2 * Math.PI * RING_R;

function ScoreReveal() {
  const { ref, val } = useCountUp(Math.round(SCORE * 100)); // animate to 101, render /100
  const prefersReduced = useReducedMotion();
  const offset = RING_C * (1 - Math.min(Math.max((SCORE - S_FLOOR) / (S_CEIL - S_FLOOR), 0), 1));

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative"
        role="img"
        aria-label={`Top candidate model score ${SCORE.toFixed(2)}`}
      >
        {/* Subtle periodic halo pulse */}
        {!prefersReduced && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-accent/20 blur-xl"
            animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0, 0.45] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              repeatDelay: 1.6,
              ease: "easeInOut",
            }}
          />
        )}
        <svg
          width="132"
          height="132"
          viewBox="0 0 132 132"
          fill="none"
          className="relative [filter:drop-shadow(0_0_16px_rgba(255,77,141,0.4))]"
        >
          <defs>
            <linearGradient id="storyRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="#b06bff" />
            </linearGradient>
          </defs>
          <circle
            cx="66"
            cy="66"
            r={RING_R}
            stroke="var(--color-border)"
            strokeWidth="6"
          />
          <motion.circle
            cx="66"
            cy="66"
            r={RING_R}
            stroke="url(#storyRing)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            initial={{ strokeDashoffset: RING_C }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={VIEW}
            transition={{ duration: 1.5, ease: "easeOut" }}
            transform="rotate(-90 66 66)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            ref={ref}
            className="text-5xl font-bold tracking-tight text-gradient-accent tabular-nums"
          >
            {(val / 100).toFixed(2)}
          </span>
          <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
            model score
          </span>
        </div>
      </div>
      <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-[12px] font-semibold text-accent">
        <StarIcon />
        Top Candidate
      </span>
    </div>
  );
}

function StarIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 1.5l1.8 3.9 4.2.5-3.1 2.9.8 4.2L8 11.4 4.3 13.4l.8-4.2L2 6.3l4.2-.5z" />
    </svg>
  );
}

// ── Story ────────────────────────────────────────────────────────────────────
export default function EngineeringStory() {
  return (
    <MotionConfig reducedMotion="user">
      <div aria-label="How PeakMinds ranks a candidate, step by step">
        <Scene
          step="01 · Input"
          caption="A single candidate enters the engine — nothing but raw résumé text."
        >
          <ResumeCard />
        </Scene>

        <Beam />

        <Scene
          step="02 · Understanding"
          caption="The text becomes meaning. PeakMinds reads intent and capability — not keywords."
        >
          <TokenCloud />
        </Scene>

        <Beam />

        <Scene
          step="03 · Signals"
          caption="Meaning is engineered into measurable signals — 93 of them, per candidate."
        >
          <SignalBars />
        </Scene>

        <Beam />

        <Scene
          step="04 · Scoring"
          caption="Every signal is weighed transparently — strengths and one honest concern."
        >
          <ScoringLedger />
        </Scene>

        <Beam />

        <Scene
          step="05 · Result"
          caption="The strongest match, surfaced — and ready to be explained."
        >
          <ScoreReveal />
        </Scene>
      </div>
    </MotionConfig>
  );
}
