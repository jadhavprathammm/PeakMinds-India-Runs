"use client";

import { motion } from "framer-motion";
import { easeOutQuart } from "@/lib/motion";

export interface ReasoningFactor {
  label: string;
  value: number;
}

interface ReasoningPanelProps {
  factors: ReasoningFactor[];
  startDelay?: number;
}

// Renders the explainable-ranking factor rows. The card that hosts this panel
// owns the section header — this component is just the rows so it can be
// reused in other surfaces later.
export default function ReasoningPanel({
  factors,
  startDelay = 0,
}: ReasoningPanelProps) {
  return (
    <div className="flex flex-col">
      {factors.map((factor, i) => (
        <motion.div
          key={factor.label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: startDelay + i * 0.1,
            duration: 0.4,
            ease: easeOutQuart,
          }}
          className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
        >
          <span className="w-8 shrink-0 text-sm font-semibold text-accent tabular-nums">
            +{factor.value}
          </span>
          <span className="text-sm text-muted leading-snug">{factor.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
