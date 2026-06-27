import type { Metadata } from "next";
import RecruiterUploadClient from "@/components/recruiter/RecruiterUploadClient";

export const metadata: Metadata = {
  title: "Recruiter Upload — PeakMinds",
  description: "Upload a job description and candidate dataset to rank your talent pool with PeakMinds Talent Intelligence.",
};

export default function RecruiterUploadPage() {
  return <RecruiterUploadClient />;
}
