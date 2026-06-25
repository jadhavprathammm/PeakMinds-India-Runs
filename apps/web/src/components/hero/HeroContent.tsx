"use client";

import { motion } from "framer-motion";
import TrustBadges from "./TrustBadges";
import { easeOutQuart } from "@/lib/motion";

// Parent orchestrator — staggers each block upward in sequence.
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: easeOutQuart } },
};

// Headline carries the most motion — it anchors the whole scene.
const slideUp = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOutQuart },
  },
};

const fadeUpSlight = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutQuart } },
};

export default function HeroContent() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="max-w-xl"
    >
      <motion.span
        variants={fadeIn}
        className="type-eyebrow flex items-center gap-2 mb-5"
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-accent shrink-0"
          aria-hidden="true"
        />
        Talent Intelligence Platform
      </motion.span>

      <motion.h1 variants={slideUp} className="type-hero font-bold mb-6">
        Find Talent
        <br />
        <span className="text-gradient-accent">Beyond Keywords</span>
      </motion.h1>

      <motion.p variants={fadeIn} className="type-body max-w-md mb-9">
        PeakMinds combines semantic understanding, engineered candidate
        intelligence, and explainable ranking to help recruiters discover the
        most relevant candidates—not just the ones with matching keywords.
      </motion.p>

      <motion.div
        variants={fadeUpSlight}
        className="flex flex-col sm:flex-row gap-3 mb-10"
      >
        <a href="#demo" className="btn btn-md btn-primary w-full sm:w-auto group">
          Try Demo
          <Arrow />
        </a>
        <a
          href="#top-100"
          className="btn btn-md btn-secondary w-full sm:w-auto group"
        >
          View Top 100
          <Arrow />
        </a>
      </motion.div>

      <motion.div variants={fadeUpSlight}>
        <TrustBadges />
      </motion.div>
    </motion.div>
  );
}

function Arrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <path
        d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
