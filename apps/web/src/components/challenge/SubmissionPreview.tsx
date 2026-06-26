import CandidateCard from "./CandidateCard";
import { TOP_CANDIDATES } from "./data";

export default function SubmissionPreview() {
  const top3 = TOP_CANDIDATES.slice(0, 3);

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {top3.map((candidate, index) => (
        <CandidateCard key={candidate.id} candidate={candidate} index={index} />
      ))}
    </div>
  );
}
