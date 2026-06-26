"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { easeOutQuart } from "@/lib/motion";
import { CANDIDATES, FILTER_CHIPS } from "./data";
import WorkspaceHeader from "./WorkspaceHeader";
import SearchBar from "./SearchBar";
import FilterChips from "./FilterChips";
import CandidateList from "./CandidateList";
import CandidateDetails from "./CandidateDetails";

export default function WorkspaceSection() {
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(CANDIDATES[0].id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CANDIDATES.filter((c) => {
      if (activeChip && !c.tags.includes(activeChip)) return false;
      if (!q) return true;
      const haystack = [c.id, c.role, c.company, ...c.tags, ...c.evidence]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, activeChip]);

  useEffect(() => {
    if (filtered.length && !filtered.some((c) => c.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected =
    CANDIDATES.find((c) => c.id === selectedId) ?? filtered[0] ?? CANDIDATES[0];

  const onListKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    if (!filtered.length) return;
    e.preventDefault();
    const idx = filtered.findIndex((c) => c.id === selected.id);
    const base = idx === -1 ? 0 : idx;
    const next =
      e.key === "ArrowDown"
        ? Math.min(base + 1, filtered.length - 1)
        : Math.max(base - 1, 0);
    setSelectedId(filtered[next].id);
  };

  return (
    <section
      id="top-100"
      className="relative overflow-hidden pt-44 pb-24 lg:pt-56 lg:pb-36"
      aria-label="Talent Intelligence Workspace"
    >
      {/* ── Atmosphere: black glass "SaaS product" ────────────────────────────── */}
      {/* Base glass tint — fades to the page black at both seams (no hard line) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 0, #0a0d11 200px, #0c1015 50%, #0a0d11 calc(100% - 200px), transparent 100%)",
        }}
        aria-hidden="true"
      />
      {/* Pink spotlight — reduced ~40% from original */}
      <div
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] max-w-[900px] aspect-square rounded-full blur-[280px] pointer-events-none"
        style={{ backgroundColor: "rgba(255,77,141,0.042)" }}
        aria-hidden="true"
      />
      {/* Cool glass accent — reduced ~40% */}
      <div
        className="absolute top-0 right-[-5%] w-[35vw] max-w-[480px] aspect-square rounded-full blur-[200px] pointer-events-none"
        style={{ backgroundColor: "rgba(120,140,235,0.033)" }}
        aria-hidden="true"
      />

      {/* Faint grid — reduced opacity ~40% */}
      <div
        className="absolute top-0 inset-x-0 h-[50%] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      {/* Diagonal sheen — reduced ~40% */}
      <div
        className="absolute inset-x-0 top-0 h-[55%] pointer-events-none"
        style={{
          background:
            "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.011) 50%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      {/* Vignette — reduced ~40% */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 50% 42%, transparent 55%, rgba(0,0,0,0.27) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative container-page">
        {/* Header — own entrance animation */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: easeOutQuart }}
        >
          <WorkspaceHeader />
        </motion.div>

        <MotionConfig reducedMotion="user">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.1, duration: 0.6, ease: easeOutQuart }}
            className="mt-20 lg:mt-24"
          >
            {/* Search + filters */}
            <div className="mx-auto max-w-3xl">
              <SearchBar value={query} onChange={setQuery} />
              <div className="mt-5">
                <FilterChips
                  chips={[...FILTER_CHIPS]}
                  active={activeChip}
                  onToggle={(chip) =>
                    setActiveChip((prev) => (prev === chip ? null : chip))
                  }
                />
              </div>
            </div>

            {/* Two-column workspace */}
            <div className="mt-10 flex flex-col gap-6 sm:grid sm:grid-cols-[40fr_60fr] sm:gap-6 lg:grid-cols-[38fr_62fr] lg:gap-10">
              <CandidateList
                candidates={filtered}
                selectedId={selected.id}
                onSelect={setSelectedId}
                onKeyDown={onListKeyDown}
              />

              <div className="rounded-card border border-border-strong bg-surface/70 p-6 backdrop-blur-md shadow-[0_16px_48px_rgba(0,0,0,0.5)] sm:p-8 lg:p-9">
                <AnimatePresence mode="wait">
                  <CandidateDetails key={selected.id} candidate={selected} />
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </MotionConfig>
      </div>
    </section>
  );
}
