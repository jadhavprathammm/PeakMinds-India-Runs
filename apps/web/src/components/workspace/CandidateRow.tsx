"use client";

import { useEffect, useRef } from "react";
import type { WorkspaceCandidate } from "./data";

interface Props {
  candidate: WorkspaceCandidate;
  selected: boolean;
  onSelect: () => void;
}

export default function CandidateRow({ candidate, selected, onSelect }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  // null = never set (initial mount). Only scroll when selected transitions false→true.
  // useRef(true) breaks under React Strict Mode: the double-invoke sets it to false
  // before the second invocation runs, causing scrollIntoView to fire on every mount.
  const prevSelected = useRef<boolean | null>(null);

  useEffect(() => {
    const prev = prevSelected.current;
    prevSelected.current = selected;
    if (selected && prev === false) {
      ref.current?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      });
    }
  }, [selected]);

  return (
    <button
      ref={ref}
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={[
        "group relative flex items-center gap-4 rounded-xl px-5 text-left transition-all duration-[250ms]",
        "min-h-[96px] min-w-[240px] shrink-0 lg:min-w-0 lg:w-full",
        selected
          ? "bg-surface-hover border border-accent/40 shadow-[0_0_0_1px_rgba(255,77,141,0.18),0_8px_24px_rgba(0,0,0,0.4)] -translate-y-0"
          : "border border-transparent hover:bg-surface/80 hover:border-border-strong hover:-translate-y-0.5",
      ].join(" ")}
    >
      {/* Pink accent rail — scale animates via CSS transition */}
      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-[3px] rounded-full bg-accent origin-center transition-transform duration-[250ms] ease-out"
        style={{ transform: `translateY(-50%) scaleY(${selected ? 1 : 0})` }}
        aria-hidden="true"
      />

      {/* Rank */}
      <span
        className={[
          "w-7 shrink-0 text-center text-lg font-bold tabular-nums transition-colors duration-[250ms]",
          selected ? "text-accent" : "text-faint group-hover:text-subtle",
        ].join(" ")}
      >
        {candidate.rank}
      </span>

      {/* Identity */}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[15px] font-semibold tracking-tight text-foreground">
          {candidate.id}
        </span>
        <span className="mt-1 block truncate text-[14px] text-subtle">
          {candidate.role}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-faint">
          {candidate.company} · {candidate.experience} yrs
        </span>
      </span>

      {/* Score */}
      <span className="shrink-0 text-right">
        <span
          className={[
            "block text-[18px] font-bold tabular-nums transition-colors duration-[250ms]",
            selected ? "text-accent" : "text-foreground",
          ].join(" ")}
        >
          {candidate.score}
        </span>
        <span className="block text-[10px] uppercase tracking-wider text-faint">
          match
        </span>
      </span>
    </button>
  );
}
