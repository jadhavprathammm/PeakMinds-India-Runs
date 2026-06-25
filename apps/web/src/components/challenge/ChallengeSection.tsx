import SubmissionPreview from "./SubmissionPreview";
import PipelineTimeline from "./PipelineTimeline";
import ChallengeCTA from "./ChallengeCTA";

export default function ChallengeSection() {
  return (
    <section
      className="relative overflow-hidden py-28 lg:py-40"
      aria-label="Challenge Submission"
    >
      {/* Subtle top separator */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 50%, transparent)",
        }}
        aria-hidden="true"
      />

      {/* Faint ambient glow echoing the Hero atmosphere */}
      <div
        className="absolute top-0 right-0 w-[40vw] max-w-[560px] aspect-square rounded-full blur-[220px] pointer-events-none"
        style={{ backgroundColor: "rgba(255,77,141,0.04)" }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-[10%] w-[30vw] max-w-[400px] aspect-square rounded-full blur-[180px] pointer-events-none"
        style={{ backgroundColor: "rgba(139,92,246,0.035)" }}
        aria-hidden="true"
      />

      <div className="relative container-page">
        {/* ── Section header ─────────────────────────────────────────────────── */}
        <div className="text-center mx-auto">
          <span className="type-eyebrow flex items-center justify-center gap-2 mb-6">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-accent shrink-0"
              aria-hidden="true"
            />
            India Runs AI Hiring Challenge
          </span>
          <h2 className="type-section font-bold">Challenge Submission</h2>
          <p className="mx-auto mt-6 max-w-[700px] text-[17px] leading-[1.7] text-foreground/80">
            100 candidates ranked, validated, and submitted. These are the
            strongest matches the system surfaced.
          </p>
        </div>

        {/* ── Top 3 preview (full width) ─────────────────────────────────────── */}
        <div className="mt-20 lg:mt-28">
          <SubmissionPreview />
        </div>

        {/* ── Pipeline — the storytelling element ─────────────────────────────── */}
        <div className="mt-36 lg:mt-52">
          <PipelineTimeline />
        </div>

        {/* ── CTA ────────────────────────────────────────────────────────────── */}
        <div className="mt-28 lg:mt-36">
          <ChallengeCTA />
        </div>
      </div>
    </section>
  );
}
