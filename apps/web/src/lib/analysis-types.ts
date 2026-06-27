// Shared types for the JD ↔ Resume analysis pipeline.
// Used by both the API route and the client component.

export interface StrengthItem {
  title: string;
  description: string;
}

export interface GapItem {
  title: string;
  severity: "High" | "Medium" | "Low";
  description: string;
}

export interface RecruiterPerspective {
  verdict: string;
  positives: string[];
  concerns: string[];
}

export interface ImprovementRoadmap {
  immediate: string[];
  seven_day: string[];
  thirty_day: string[];
}

// Structured profile extracted from the job description (Step 1 of the
// matching pipeline). Role-agnostic — fields may be empty for non-technical
// roles. Surfaced for auditability and included in the downloaded report.
export interface JdProfile {
  role_title: string;
  seniority: string;
  years_required: string;
  technical_skills: string[];
  tools: string[];
  frameworks: string[];
  domain_knowledge: string[];
  leadership_requirements: string[];
  nice_to_have_skills: string[];
}

export interface AnalysisOutput {
  overall_match_score: number;
  analysis_summary: string;
  jd_profile?: JdProfile;
  strength_analysis: StrengthItem[];
  gap_analysis: GapItem[];
  recruiter_perspective: RecruiterPerspective;
  improvement_roadmap: ImprovementRoadmap;
}

// Validates that an unknown value conforms to AnalysisOutput
export function isValidAnalysisOutput(data: unknown): data is AnalysisOutput {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.overall_match_score === "number" &&
    d.overall_match_score >= 0 &&
    d.overall_match_score <= 100 &&
    typeof d.analysis_summary === "string" &&
    Array.isArray(d.strength_analysis) &&
    Array.isArray(d.gap_analysis) &&
    typeof d.recruiter_perspective === "object" &&
    d.recruiter_perspective !== null &&
    typeof d.improvement_roadmap === "object" &&
    d.improvement_roadmap !== null
  );
}
