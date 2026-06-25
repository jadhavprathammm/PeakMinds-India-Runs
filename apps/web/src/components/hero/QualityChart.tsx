"use client";

import { motion } from "framer-motion";

interface QualityChartProps {
  animationDelay?: number;
}

// Weekly candidate-quality index. SVG only, no chart library.
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const VALUES = [38, 56, 47, 64, 55, 73, 92]; // 0–100, trending up to the weekend

// Geometry
const W = 300;
const H = 124;
const PAD_X = 8;
const TOP = 12;
const BOTTOM = 26;
const PLOT_W = W - PAD_X * 2;
const PLOT_H = H - TOP - BOTTOM;

const POINTS = VALUES.map((v, i) => ({
  x: PAD_X + (i / (VALUES.length - 1)) * PLOT_W,
  y: TOP + (1 - v / 100) * PLOT_H,
}));

const LINE_PATH = POINTS.map(
  (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
).join(" ");

const BASELINE = TOP + PLOT_H;
const AREA_PATH = `${LINE_PATH} L ${POINTS[POINTS.length - 1].x.toFixed(
  1
)} ${BASELINE} L ${POINTS[0].x.toFixed(1)} ${BASELINE} Z`;

export default function QualityChart({ animationDelay = 0 }: QualityChartProps) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto overflow-visible"
      role="img"
      aria-label="Candidate quality index across the week, trending upward toward the weekend"
    >
      <defs>
        <linearGradient id="qcArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="qcLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="#b06bff" />
        </linearGradient>
      </defs>

      {/* Horizontal gridlines */}
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1={PAD_X}
          x2={W - PAD_X}
          y1={TOP + g * PLOT_H}
          y2={TOP + g * PLOT_H}
          stroke="var(--color-border)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      ))}

      {/* Area fill — fades in after the line draws */}
      <motion.path
        d={AREA_PATH}
        fill="url(#qcArea)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: animationDelay + 0.7, duration: 0.6 }}
      />

      {/* Line — draws left to right */}
      <motion.path
        d={LINE_PATH}
        fill="none"
        stroke="url(#qcLine)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: animationDelay, duration: 1.1, ease: "easeInOut" }}
      />

      {/* Vertices — pop in sequentially; the final point is emphasised */}
      {POINTS.map((p, i) => {
        const isLast = i === POINTS.length - 1;
        return (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={isLast ? 3.5 : 2.5}
            fill={isLast ? "var(--color-accent)" : "var(--color-surface)"}
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: animationDelay + 0.5 + i * 0.07, duration: 0.3 }}
          />
        );
      })}

      {/* Day labels */}
      {DAYS.map((d, i) => (
        <motion.text
          key={d}
          x={POINTS[i].x}
          y={H - 8}
          textAnchor="middle"
          fill="var(--color-faint)"
          fontSize="8"
          fontFamily="var(--font-sans)"
          letterSpacing="0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animationDelay + 0.85 + i * 0.04, duration: 0.3 }}
        >
          {d}
        </motion.text>
      ))}
    </svg>
  );
}
