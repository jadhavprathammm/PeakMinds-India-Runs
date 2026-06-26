import EngineeringStory from "./EngineeringStory";
import ReasoningShowcase from "./ReasoningShowcase";

export default function EngineeringSection() {
  return (
    <section
      id="engineering"
      className="relative overflow-hidden py-20 lg:py-32"
      aria-label="Engineering Deep Dive"
    >
      {/* ── Atmosphere: deep plum "engineering" ───────────────────────────────── */}
      {/* Base plum tint — fades to the page black at both seams (soft, no border) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 0, #140c18 200px, #1a1020 50%, #140c18 calc(100% - 200px), transparent 100%)",
        }}
        aria-hidden="true"
      />
      {/* Dominant plum glow behind the heading */}
      <div
        className="absolute -top-[6%] left-1/2 -translate-x-1/2 w-[70vw] max-w-[820px] aspect-square rounded-full blur-[240px] pointer-events-none"
        style={{ backgroundColor: "rgba(157,78,221,0.10)" }}
        aria-hidden="true"
      />
      {/* Faint pink accent — keeps the brand anchor present */}
      <div
        className="absolute bottom-[8%] right-[6%] w-[28vw] max-w-[360px] aspect-square rounded-full blur-[200px] pointer-events-none"
        style={{ backgroundColor: "rgba(255,77,141,0.05)" }}
        aria-hidden="true"
      />
      {/* Subtle dot texture (<3% opacity), faded top→bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative container-page">
        {/* ── Section header — one dominant chapter title ─────────────────────── */}
        <div className="text-center mx-auto">
          <h2 className="text-5xl sm:text-6xl lg:text-[80px] font-bold tracking-[-0.03em] leading-[1.05] text-foreground text-balance">Inside the Engine</h2>
          <p className="mx-auto mt-6 max-w-[720px] text-[20px] leading-[1.7] text-foreground/80">
            Follow one real candidate from raw résumé to final rank — exactly how
            the system sees it.
          </p>
        </div>

        {/* ── The story — one continuous, scroll-driven narrative ─────────────── */}
        <div className="mt-18 lg:mt-24">
          <EngineeringStory />
        </div>

        {/* ── The reward — the human-readable reasoning ───────────────────────── */}
        <div className="mt-18 lg:mt-24">
          <ReasoningShowcase />
        </div>
      </div>
    </section>
  );
}
