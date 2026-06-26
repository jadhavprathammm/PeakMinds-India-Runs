"use client";

import type { KeyboardEvent } from "react";
import type { WorkspaceCandidate } from "./data";
import CandidateRow from "./CandidateRow";

interface Props {
  candidates: WorkspaceCandidate[];
  selectedId: string;
  onSelect: (id: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
}

export default function CandidateList({
  candidates,
  selectedId,
  onSelect,
  onKeyDown,
}: Props) {
  return (
    <div className="overflow-hidden rounded-card border border-border-strong bg-surface/50 backdrop-blur-sm shadow-[0_2px_16px_rgba(0,0,0,0.25)]">
      <div
        role="listbox"
        aria-label="Ranked candidates"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={[
          "flex gap-3 overflow-x-auto p-3 outline-none",
          "focus-visible:ring-1 focus-visible:ring-accent/40",
          "lg:flex-col lg:gap-1.5 lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[800px]",
          // Custom thin scrollbar
          "[&::-webkit-scrollbar]:w-[5px]",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:bg-accent/25",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb:hover]:bg-accent/50",
        ].join(" ")}
      >
        {candidates.length === 0 ? (
          <p className="w-full py-16 text-center text-[15px] text-subtle">
            No candidates matched your search.
          </p>
        ) : (
          candidates.map((candidate) => (
            <CandidateRow
              key={candidate.id}
              candidate={candidate}
              selected={candidate.id === selectedId}
              onSelect={() => onSelect(candidate.id)}
            />
          ))
        )}
      </div>

      <div className="border-t border-border px-5 py-3 text-[13px] text-subtle">
        Showing Top 15 Ranked Candidates
      </div>
    </div>
  );
}
