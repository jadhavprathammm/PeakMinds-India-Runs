"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { easeOutQuart } from "@/lib/motion";

const BADGES: { label: string; icon: FC }[] = [
  { label: "Deep Semantic Understanding", icon: SemanticIcon },
  { label: "Explainable AI Rankings", icon: ExplainIcon },
  { label: "Continuous Learning", icon: LearnIcon },
  { label: "Bias Resistant Search", icon: ShieldIcon },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOutQuart } },
};

export default function TrustBadges() {
  return (
    <motion.ul
      variants={container}
      className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-4"
      aria-label="Key capabilities"
    >
      {BADGES.map(({ label, icon: Icon }) => (
        <motion.li key={label} variants={item} className="flex flex-col gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted">
            <Icon />
          </span>
          <span className="text-xs leading-snug text-subtle max-w-[7.5rem]">
            {label}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

// ── Icons (16×16 line set) ───────────────────────────────────────────────────

function SemanticIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="4" cy="4.5" r="1.6" />
      <circle cx="12" cy="5.5" r="1.6" />
      <circle cx="7" cy="12" r="1.6" />
      <path d="M5.5 4.8 10.4 5.3M5.2 5.8 6.4 10.5M10.6 6.9 8 10.7" />
    </svg>
  );
}

function ExplainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 2.5h5l3 3v8H4z" />
      <path d="M9 2.5v3h3" />
      <path d="M6 9.5l1.3 1.3L10 8" />
    </svg>
  );
}

function LearnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 8a5 5 0 1 1-1.6-3.7" />
      <path d="M13 3.2v2.4h-2.4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2l5 2v3.6c0 3-2.2 5.1-5 6.1-2.8-1-5-3.1-5-6.1V4z" />
      <path d="M5.8 8l1.6 1.6L10.4 6.6" />
    </svg>
  );
}
