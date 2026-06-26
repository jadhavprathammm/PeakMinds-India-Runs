import HeroBackground from "./HeroBackground";
import HeroContent from "./HeroContent";
import CandidateNodes from "./CandidateNodes";

export default function Hero() {
  return (
    <section
      className="relative flex min-h-dvh items-center overflow-hidden"
      aria-label="Hero"
    >
      <HeroBackground />
      <CandidateNodes />

      {/* Centered pitch */}
      <div className="relative z-10 flex w-full justify-center container-page pt-32 pb-24 lg:pt-40 lg:pb-32">
        <HeroContent />
      </div>
    </section>
  );
}
