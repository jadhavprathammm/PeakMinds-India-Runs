"use client";

import type { GapItem } from "@/lib/analysis-types";

// ── Shared score / badge helpers ───────────────────────────────────────────────

export function scoreColor(n: number): string {
  if (n >= 75) return "var(--color-accent)";
  if (n >= 55) return "#f59e0b";
  return "var(--color-subtle)";
}

export function verdictBadgeClass(verdict: string): string {
  if (verdict === "Strong Match") return "bg-accent/15 text-accent border border-accent/30";
  if (verdict === "Interview Recommended") return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
  if (verdict === "Borderline") return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
  return "bg-surface-elevated text-muted border border-border";
}

export function severityClass(s: GapItem["severity"]): string {
  if (s === "High") return "bg-red-500/12 text-red-400 border border-red-500/20";
  if (s === "Medium") return "bg-amber-500/12 text-amber-400 border border-amber-500/20";
  return "bg-surface-elevated text-muted border border-border";
}

// ── Score ring ──────────────────────────────────────────────────────────────

export function ScoreRing({ score, size = 172 }: { score: number; size?: number }) {
  const stroke = 8;
  const R = size / 2 - stroke - 6;
  const C = 2 * Math.PI * R;
  const fill = score / 100;
  const offset = C * (1 - fill);
  const color = scoreColor(score);
  const c = size / 2;
  const numberSize = Math.round(size * 0.3);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-label={`Match score ${score} out of 100`}>
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="#b06bff" />
            </linearGradient>
          </defs>
          <circle cx={c} cy={c} r={R} stroke="var(--color-border)" strokeWidth={stroke} />
          <circle
            cx={c} cy={c} r={R}
            stroke={score >= 75 ? "url(#ringGrad)" : color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${c} ${c})`}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold leading-none tabular-nums"
            style={{ color, fontSize: numberSize }}
          >
            {score}
          </span>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-muted mt-1">
            / 100
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Shared icons ──────────────────────────────────────────────────────────────

export function SpinnerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="animate-spin shrink-0 text-accent">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
