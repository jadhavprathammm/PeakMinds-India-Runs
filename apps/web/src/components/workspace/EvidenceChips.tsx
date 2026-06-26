"use client";

import { motion } from "framer-motion";
import { easeOutQuart } from "@/lib/motion";

interface Props {
  items: string[];
  startDelay?: number;
}

export default function EvidenceChips({ items, startDelay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: startDelay, duration: 0.4, ease: easeOutQuart }}
      className="flex flex-wrap gap-2.5"
    >
      {items.slice(0, 10).map((item) => (
        <span
          key={item}
          className="inline-flex items-center whitespace-nowrap rounded-full border border-accent/30 bg-accent/[0.07] px-3 py-1.5 text-[13px] font-medium text-foreground/90 transition-all duration-[250ms] hover:-translate-y-0.5 hover:border-accent/45 cursor-default"
        >
          {item}
        </span>
      ))}
    </motion.div>
  );
}
