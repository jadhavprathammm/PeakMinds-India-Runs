"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { extractFromFile, ExtractionError } from "@/lib/extraction";
import { parseDataset, DatasetError, type DatasetCandidate } from "@/lib/dataset";
import type { RankedCandidate } from "@/lib/matching";
import UploadCard, { type UploadState } from "@/components/shared/UploadCard";
import { SpinnerIcon } from "@/components/shared/score-display";
import ResultsDashboard from "./ResultsDashboard";
import TeamUploadCard from "./TeamUploadCard";
import { toCandidatesForTeam } from "@/lib/team-candidate-adapter";
import {
  runTeamIntelligenceFromFiles,
  DEFAULT_ORCHESTRATOR_CONFIG,
  type TeamAnalysisResult,
} from "@/engines/team-intelligence";
import { httpSemanticBackend } from "@/lib/team-semantic-backend";

interface Summary {
  total: number;
  qualified: number;
  avgScore: number;
  topCandidate: string;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 280));
}

export default function RecruiterUploadClient() {
  // JD state
  const [jdState, setJdState] = useState<UploadState>("idle");
  const [jdText, setJdText] = useState("");
  const [jdFilename, setJdFilename] = useState("");
  const [jdError, setJdError] = useState("");
  const [jdPaste, setJdPaste] = useState("");

  // Dataset state
  const [dsState, setDsState] = useState<UploadState>("idle");
  const [dsFilename, setDsFilename] = useState("");
  const [dsError, setDsError] = useState("");
  const [candidates, setCandidates] = useState<DatasetCandidate[]>([]);
  const [dsWarnings, setDsWarnings] = useState<string[]>([]);

  // Run state
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");
  const [ranked, setRanked] = useState<RankedCandidate[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  // Team Intelligence (optional, additive) state
  const [teamFiles, setTeamFiles] = useState<File[]>([]);
  const [teamAnalysis, setTeamAnalysis] = useState<TeamAnalysisResult | null>(null);
  const [teamWarning, setTeamWarning] = useState("");

  const resultsRef = useRef<HTMLDivElement>(null);

  const bothReady = jdState === "ready" && dsState === "ready";

  // ── JD handlers ───────────────────────────────────────────────────────────────
  async function handleJdFile(file: File) {
    setJdFilename(file.name);
    setJdError("");
    setJdState("uploading");
    try {
      await nextFrame();
      setJdState("extracting");
      const { text } = await extractFromFile(file);
      setJdText(text);
      setJdState("ready");
    } catch (err) {
      setJdError(err instanceof ExtractionError ? err.message : "Extraction failed. Please paste the content instead.");
      setJdState("error");
    }
  }

  function handleJdPaste() {
    const t = jdPaste.trim();
    if (t.length < 30) return;
    setJdText(t);
    setJdFilename("Pasted content");
    setJdState("ready");
    setJdError("");
  }

  function resetJd() {
    setJdState("idle"); setJdText(""); setJdFilename(""); setJdError(""); setJdPaste("");
  }

  // ── Dataset handlers ────────────────────────────────────────────────────────────
  async function handleDsFile(file: File) {
    setDsFilename(file.name);
    setDsError("");
    setDsWarnings([]);
    setDsState("uploading");
    try {
      await nextFrame();
      setDsState("extracting");
      const { candidates: parsed, warnings } = await parseDataset(file);
      setCandidates(parsed);
      setDsWarnings(warnings);
      setDsState("ready");
    } catch (err) {
      setDsError(err instanceof DatasetError ? err.message : "We couldn't read this dataset. Please upload a valid CSV or XLSX.");
      setDsState("error");
    }
  }

  function resetDs() {
    setDsState("idle"); setDsFilename(""); setDsError(""); setCandidates([]); setDsWarnings([]);
  }

  // ── Team Intelligence handlers (optional) ─────────────────────────────────────────
  function addTeamFiles(newFiles: File[]) {
    setTeamFiles((prev) => [...prev, ...newFiles]);
  }
  function removeTeamFile(index: number) {
    setTeamFiles((prev) => prev.filter((_, i) => i !== index));
  }
  function clearTeamFiles() {
    setTeamFiles([]);
  }

  // ── Run ──────────────────────────────────────────────────────────────────────────
  async function handleRun() {
    setRunning(true);
    setRunError("");
    setTeamAnalysis(null);
    setTeamWarning("");
    try {
      // Existing candidate ranking — unchanged, protected production path.
      const res = await fetch("/api/rank-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd: jdText, candidates }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Ranking failed.");
      }
      const data = (await res.json()) as { ranked: RankedCandidate[]; summary: Summary };
      setRanked(data.ranked);
      setSummary(data.summary);

      // ── Team Intelligence (optional, additive — never blocks candidate ranking) ──
      if (teamFiles.length > 0) {
        try {
          // Semantic axis ON: reuse the shared MiniLM model via /api/team-embed
          // (single batched call). Falls back to lexical if the model is offline.
          const result = await runTeamIntelligenceFromFiles(
            teamFiles,
            toCandidatesForTeam(candidates),
            { ...DEFAULT_ORCHESTRATOR_CONFIG, semantic: httpSemanticBackend },
          );
          setTeamAnalysis(result);
          if (result.degraded) {
            setTeamWarning("Team Intelligence ran with reduced signal — some documents could not be fully read.");
          }
        } catch (err) {
          console.error("[team-intelligence] run failed:", err);
          setTeamWarning("Team Intelligence could not be generated for the uploaded documents. Standard ranking is unaffected.");
        }
      }

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Ranking failed. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  function handleReset() {
    resetJd();
    resetDs();
    setRanked(null);
    setSummary(null);
    setRunError("");
    setTeamFiles([]);
    setTeamAnalysis(null);
    setTeamWarning("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Render ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute -top-1/3 left-1/2 -translate-x-1/2 w-[60vw] max-w-[700px] aspect-square rounded-full blur-[200px]"
          style={{ backgroundColor: "rgba(255,77,141,0.05)" }}
          aria-hidden="true"
        />
        <div className="relative container-page pt-32 pb-16 lg:pt-36 lg:pb-20">
          <Link href="/" className="group inline-flex items-center gap-2 text-[14px] font-medium text-muted hover:text-foreground transition-colors duration-150 mb-8">
            <BackArrow />
            Back to PeakMinds
          </Link>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
            Recruiter Workspace
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-tight lg:text-[60px]">
            Rank Your Talent Pool
            <br />
            <span className="text-gradient-accent">In One Run.</span>
          </h1>
          <p className="mt-5 max-w-[640px] text-xl leading-8 text-foreground/65">
            Upload a job description and a candidate dataset. PeakMinds scores and
            ranks every candidate against the role — instantly.
          </p>

          {/* Two upload cards */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 items-stretch">
            <UploadCard
              title="Job Description"
              description="Upload or paste the role you're hiring for."
              state={jdState}
              filename={jdFilename}
              error={jdError}
              pasteValue={jdPaste}
              onFile={handleJdFile}
              onPasteChange={setJdPaste}
              onPasteSubmit={handleJdPaste}
              onReset={resetJd}
            />
            <UploadCard
              title="Candidate Dataset"
              description="Upload a CSV or XLSX with Name, Resume, Skills, Experience columns."
              state={dsState}
              filename={dsState === "ready" ? `${dsFilename} · ${candidates.length} candidates` : dsFilename}
              error={dsError}
              pasteValue=""
              onFile={handleDsFile}
              onPasteChange={() => {}}
              onPasteSubmit={() => {}}
              onReset={resetDs}
              accept=".csv,.xlsx,.xls"
              formatsLabel="CSV · XLSX"
              allowPaste={false}
              extractingLabel="Parsing dataset…"
            />
          </div>

          {/* Dataset warnings (missing columns) */}
          {dsState === "ready" && dsWarnings.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-5 py-3.5">
              <p className="text-[12.5px] font-semibold text-amber-300 mb-1">Dataset notes</p>
              <ul className="list-disc pl-5 text-[13px] leading-[1.6] text-amber-200/80">
                {dsWarnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Team Intelligence (optional) */}
          <div className="mt-4">
            <TeamUploadCard
              files={teamFiles}
              onAdd={addTeamFiles}
              onRemove={removeTeamFile}
              onClear={clearTeamFiles}
            />
          </div>

          {/* Run button */}
          <div className="mt-6 flex flex-col gap-3">
            {bothReady && !running && !ranked && (
              <button onClick={handleRun} className="self-start btn btn-md btn-primary px-8">
                Run PeakMinds
              </button>
            )}
            {running && (
              <div className="flex items-center gap-3 self-start rounded-card border border-border bg-surface/60 px-6 py-4">
                <SpinnerIcon />
                <div>
                  <p className="text-[15px] font-semibold text-foreground">Ranking candidates…</p>
                  <p className="mt-0.5 text-[13px] text-muted">Scoring {candidates.length} candidates against the job description</p>
                </div>
              </div>
            )}
            {runError && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-5 py-4">
                <p className="text-[13.5px] text-red-400">{runError}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Results */}
      <div ref={resultsRef} className="container-page py-16 lg:py-24">
        {ranked && summary ? (
          <ResultsDashboard
            ranked={ranked}
            summary={summary}
            onReset={handleReset}
            teamAnalysis={teamAnalysis}
            teamWarning={teamWarning}
          />
        ) : (
          <div className="rounded-card border border-dashed border-border bg-surface/30 px-8 py-16 text-center">
            <p className="text-lg leading-8 text-muted">
              Upload a job description and candidate dataset above, then run PeakMinds to see ranked results here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function BackArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="transition-transform duration-150 group-hover:-translate-x-0.5">
      <path d="M11 7H3M6.5 3.5L3 7l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
