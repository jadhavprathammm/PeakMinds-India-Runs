"use client";

import { motion } from "framer-motion";
import { easeOutQuart } from "@/lib/motion";

export default function ChallengeCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: easeOutQuart }}
      className="flex flex-col items-center gap-3.5 sm:flex-row sm:justify-center"
    >
      <a
        href="#top-100"
        className="btn btn-lg btn-primary group h-14 px-9 text-[15px] font-semibold w-full sm:w-auto sm:min-w-[340px] bg-[linear-gradient(110deg,#ff4d8d_0%,#ff5c97_55%,#ff70a8_100%)] shadow-[0_8px_24px_rgba(255,77,141,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(255,77,141,0.4)]"
      >
        Explore Top 100 Candidates
        <Arrow />
      </a>
      <a
        href="#engineering"
        className="btn btn-lg btn-secondary group h-14 px-9 text-[15px] font-semibold w-full sm:w-auto sm:min-w-[240px] transition-all duration-300 hover:-translate-y-0.5"
      >
        Read Engineering Story
        <Arrow />
      </a>
    </motion.div>
  );
}

function Arrow() {
  return (
    <svg
      width="15"
      height="15"
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
