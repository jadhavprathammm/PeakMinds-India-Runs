import type { Metadata } from "next";
import CandidateReviewClient from "@/components/candidate-review/CandidateReviewClient";

export const metadata: Metadata = {
  title: "Candidate Review — PeakMinds",
  description:
    "Upload your resume and receive the same evidence-based analysis PeakMinds uses to evaluate candidates inside the Talent Intelligence Platform.",
};

export default function CandidateReviewPage() {
  return <CandidateReviewClient />;
}
