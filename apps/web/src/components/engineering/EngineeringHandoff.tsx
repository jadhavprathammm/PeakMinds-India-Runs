"use client";

import { motion } from "framer-motion";
import { easeOutQuart } from "@/lib/motion";

export default function EngineeringHandoff() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: easeOutQuart }}
      className="flex flex-col items-center text-center"
    >
      <p className="max-w-md text-[19px] leading-[1.75] text-foreground/80">
        You&apos;ve seen how it thinks. Now meet who it found.
      </p>
      <a
        href="#top-100"
        className="btn btn-lg btn-secondary group mt-8 h-14 px-9 text-[15px] font-semibold w-full sm:w-auto sm:min-w-[280px] transition-all duration-[250ms] hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(0,0,0,0.4)]"
      >
        Meet the Top 100
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
