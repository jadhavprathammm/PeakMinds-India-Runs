import HeroBackground from "./HeroBackground";
import HeroContent from "./HeroContent";
import PipelineFlow from "./PipelineFlow";
import HeroDashboard from "./HeroDashboard";

// Three-zone composition: input (content) â†’ process (pipeline) â†’ proof
// (dashboard). On xl this reads left-to-right as one connected scene; below xl
// it stacks in the same narrative order, preserving the hierarchy.

export default function Hero() {
  return (
    <section
      className="relative flex min-h-dvh items-center overflow-hidden"
      aria-label="Hero"
    >
      <HeroBackground />

      <div className="relative z-10 w-full container-page pt-32 pb-20 lg:pt-40">
        <div className="mx-auto max-w-2xl xl:max-w-none grid grid-cols-1 xl:grid-cols-12 gap-12 xl:gap-6 items-center">
          {/* Input â€” the pitch */}
          <div className="xl:col-span-4">
            <HeroContent />
          </div>

          {/* Process â€” the pipeline bridge */}
          <div className="flex justify-center xl:col-span-3">
            <PipelineFlow />
          </div>

          {/* Proof â€” the dashboard */}
          <div className="xl:col-span-5">
            <HeroDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}

