// Golden Test Scenarios
// Structured expected outputs for recruiter intelligence validation
// No resume text, no pipeline execution, no report generation

export interface GoldenScenario {
  id: string;
  title: string;
  expected: {
    archetype?: string;
    overallRisk?: "low" | "moderate" | "high" | "critical";
    primaryRisk?: string;
  };
}

export const GOLDEN_SCENARIOS: GoldenScenario[] = [
  {
    id: "strong-senior-engineer",
    title: "Strong Senior Engineer",
    expected: {
      archetype: "builder",
      overallRisk: "low",
      primaryRisk: "none",
    },
  },
  {
    id: "strong-ml-engineer",
    title: "Strong ML Engineer",
    expected: {
      archetype: "builder",
      overallRisk: "low",
      primaryRisk: "none",
    },
  },
  {
    id: "junior-fresher",
    title: "Junior Fresher",
    expected: {
      archetype: "generalist",
      overallRisk: "moderate",
      primaryRisk: "specialization_fragility_risk",
    },
  },
  {
    id: "career-switcher",
    title: "Career Switcher",
    expected: {
      archetype: "transitioner",
      overallRisk: "moderate",
      primaryRisk: "evidence_gap_risk",
    },
  },
  {
    id: "job-hopper",
    title: "Job Hopper",
    expected: {
      archetype: "transitioner",
      overallRisk: "high",
      primaryRisk: "job_hopping_risk",
    },
  },
  {
    id: "long-employment-gap",
    title: "Long Employment Gap",
    expected: {
      archetype: "builder",
      overallRisk: "high",
      primaryRisk: "employment_gap_risk",
    },
  },
  {
    id: "project-heavy",
    title: "Project Heavy Candidate",
    expected: {
      archetype: "builder",
      overallRisk: "low",
      primaryRisk: "none",
    },
  },
  {
    id: "experience-heavy",
    title: "Experience Heavy Candidate",
    expected: {
      archetype: "leader",
      overallRisk: "moderate",
      primaryRisk: "evidence_gap_risk",
    },
  },
  {
    id: "weak-resume",
    title: "Weak Resume",
    expected: {
      archetype: "generalist",
      overallRisk: "high",
      primaryRisk: "evidence_gap_risk",
    },
  },
  {
    id: "poorly-formatted",
    title: "Poorly Formatted Resume",
    expected: {
      archetype: "generalist",
      overallRisk: "moderate",
      primaryRisk: "extraction_risk",
    },
  },
  {
    id: "overqualified",
    title: "Overqualified Candidate",
    expected: {
      archetype: "leader",
      overallRisk: "moderate",
      primaryRisk: "overqualification_risk",
    },
  },
  {
    id: "underqualified",
    title: "Underqualified Candidate",
    expected: {
      archetype: "generalist",
      overallRisk: "moderate",
      primaryRisk: "underqualification_risk",
    },
  },
];

export function getScenario(id: string): GoldenScenario | undefined {
  return GOLDEN_SCENARIOS.find((s) => s.id === id);
}