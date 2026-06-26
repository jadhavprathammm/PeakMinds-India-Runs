"use client";

import { motion } from "framer-motion";
import Link from "next/link";
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
      className="max-w-4xl text-center"
    >
      <motion.h1
        variants={slideUp}
        className="text-5xl sm:text-6xl lg:text-[78px] font-bold tracking-[-0.03em] leading-[1.05] text-balance mb-8"
      >
        Surface the Best Talent.
        <br />
        <span className="text-gradient-accent">Not the Loudest Keywords.</span>
      </motion.h1>

      <motion.p
        variants={fadeIn}
        className="mx-auto max-w-[660px] text-[20px] leading-[1.7] text-foreground/80 mb-12"
      >
        PeakMinds evaluates experience, skills, semantic relevance, and intent to
        identify the strongest candidates from thousands of applications.
      </motion.p>

      <motion.div
        variants={fadeUpSlight}
        className="flex flex-col gap-4 sm:flex-row sm:justify-center"
      >
        <Link
          href="/top-100"
          className="btn btn-md btn-primary group w-full px-8 transition-all duration-[250ms] hover:-translate-y-0.5 sm:w-auto"
        >
          View Top 100
          <Arrow />
        </Link>
        <Link
          href="/architecture"
          className="btn btn-md btn-secondary group w-full px-8 transition-all duration-[250ms] hover:-translate-y-0.5 sm:w-auto"
        >
          View Architecture
          <Arrow />
        </Link>
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
      className="transition-transform duration-150 group-hover:translate-x-0.5"
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

