"use client";

import { motion } from "framer-motion";
import { easeOutQuart } from "@/lib/motion";
import type { Bar } from "./data";

interface Props {
  bars: Bar[];
  startDelay?: number;
}

export default function ScoreBreakdown({ bars, startDelay = 0 }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {bars.map((bar, i) => (
        <div key={bar.label} className="flex items-center gap-4">
          <span className="w-40 shrink-0 text-[19px] sm:text-[20px] text-foreground/80">
            {bar.label}
          </span>
          <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-border">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#ff4d8d,#b06bff)]"
              initial={{ width: 0 }}
              animate={{ width: `${bar.value}%` }}
              transition={{
                delay: startDelay + i * 0.06,
                duration: 0.65,
                ease: easeOutQuart,
              }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-[14px] tabular-nums text-subtle">
            {bar.value}
          </span>
        </div>
      ))}
    </div>
  );
}
