"use client";

import { motion } from "framer-motion";
import { easeOutQuart } from "@/lib/motion";

interface Props {
  text: string;
  startDelay?: number;
}

export default function RecruiterSummary({ text, startDelay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: startDelay, duration: 0.35, ease: easeOutQuart }}
      className="rounded-xl border border-border bg-surface-elevated/60 p-4"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <SparkleIcon />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          AI Recruiter Summary
        </span>
      </div>
      <p className="text-[14px] leading-[1.65] text-foreground/75">
        {text}
      </p>
    </motion.div>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="var(--color-accent)"
      aria-hidden="true"
    >
      <path d="M8 1l1.4 4.6L14 8l-4.6 1.4L8 15l-1.4-4.6L2 8l4.6-1.4L8 1z" />
    </svg>
  );
}
