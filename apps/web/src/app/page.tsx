import Hero from "@/components/hero/Hero";
import ChallengeSection from "@/components/challenge/ChallengeSection";
import EngineeringSection from "@/components/engineering/EngineeringSection";
import WorkspaceSection from "@/components/workspace/WorkspaceSection";

export default function Home() {
  return (
    <main>
      <Hero />
      <ChallengeSection />
      <EngineeringSection />
      <WorkspaceSection />
    </main>
  );
}
