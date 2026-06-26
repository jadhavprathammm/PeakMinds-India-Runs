import SubmissionPreview from "./SubmissionPreview";
import PipelineTimeline from "./PipelineTimeline";
import ChallengeCTA from "./ChallengeCTA";

export default function ChallengeSection() {
  return (
    <section
      id="challenge"
      className="relative overflow-hidden py-20 lg:py-32"
      aria-label="Challenge Submission"
    >
      {/* ── Atmosphere: deep burgundy "evaluation room" ───────────────────────── */}
      {/* Base wine tint — fades to the page black at both seams (no hard line) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 0, #190b10 200px, #1a0c11 50%, #190b10 calc(100% - 200px), transparent 100%)",
        }}
        aria-hidden="true"
      />
      {/* Dominant burgundy glow behind the heading */}
      <div
        className="absolute -top-[6%] left-1/2 -translate-x-1/2 w-[70vw] max-w-[820px] aspect-square rounded-full blur-[240px] pointer-events-none"
        style={{ backgroundColor: "rgba(124,26,55,0.16)" }}
        aria-hidden="true"
      />
      {/* Faint pink accent — keeps the brand anchor present */}
      <div
        className="absolute bottom-[8%] right-[6%] w-[26vw] max-w-[340px] aspect-square rounded-full blur-[200px] pointer-events-none"
        style={{ backgroundColor: "rgba(255,77,141,0.045)" }}
        aria-hidden="true"
      />
      {/* Subtle dot texture (<5% opacity), faded top→bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(214,150,160,0.04) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative container-page">
        {/* ── Section header ─────────────────────────────────────────────────── */}
        <div className="text-center mx-auto">
          <h2 className="text-5xl sm:text-6xl lg:text-[80px] font-bold tracking-[-0.03em] leading-[1.05] text-foreground text-balance">India Runs Challenge Submission</h2>
          <p className="mx-auto mt-7 max-w-[720px] text-[20px] leading-[1.7] text-foreground/80">
            100 candidates ranked, validated, and submitted. These are the
            strongest matches the system surfaced.
          </p>
        </div>

        {/* ── Top 3 preview (full width) ─────────────────────────────────────── */}
        <div className="mt-24 lg:mt-32">
          <SubmissionPreview />
        </div>

        {/* ── Primary path to the full ranking ────────────────────────────────── */}
        <div className="mt-20 lg:mt-28">
          <ChallengeCTA />
        </div>

        {/* ── Pipeline — the storytelling element ─────────────────────────────── */}
        <div className="mt-28 lg:mt-40">
          <PipelineTimeline />
        </div>
      </div>
    </section>
  );
}
