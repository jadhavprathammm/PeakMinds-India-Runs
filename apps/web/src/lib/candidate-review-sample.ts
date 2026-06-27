// Re-export analysis types and provide the default sample report
// shown on the Candidate Review page before a user uploads documents.

export type {
  AnalysisOutput,
  StrengthItem,
  GapItem,
  RecruiterPerspective,
  ImprovementRoadmap,
} from "./analysis-types";

import type { AnalysisOutput } from "./analysis-types";

// Realistic mid-to-senior ML Engineer profile evaluated against a
// Senior ML Engineer JD. Shown by default before upload.
export const SAMPLE_ANALYSIS: AnalysisOutput = {
  overall_match_score: 74,
  analysis_summary:
    "This candidate demonstrates strong ML engineering fundamentals with clear production deployment experience and multi-framework proficiency. The primary gaps are around quantified impact, evaluation methodology, and scale context — signals that rank candidates in a competitive pool.",
  strength_analysis: [
    {
      title: "Production ML Deployment",
      description:
        "Resume shows clear evidence of deploying models to production environments including serving infrastructure and real-time systems — a critical requirement for this Senior ML Engineer role.",
    },
    {
      title: "Multi-Framework Proficiency",
      description:
        "Demonstrates hands-on experience with PyTorch, TensorFlow, and scikit-learn. Multi-framework depth signals genuine engineering breadth, not just tutorial-level exposure.",
    },
    {
      title: "NLP & Transformer Experience",
      description:
        "Clear NLP specialization with BERT fine-tuning and text classification work. Highly relevant to the semantic search and embedding requirements in the JD.",
    },
    {
      title: "Cloud Infrastructure Exposure",
      description:
        "Demonstrates AWS experience for ML workloads including SageMaker and S3. Cloud proficiency is an explicit requirement in the job description.",
    },
  ],
  gap_analysis: [
    {
      title: "Impact Metrics Missing",
      severity: "High",
      description:
        "The JD explicitly asks for candidates who 'demonstrate measurable impact.' The resume describes what was built but rarely quantifies outcomes. Add: 'reduced inference latency by 40%', 'improved NDCG@10 from 0.71 to 0.86'.",
    },
    {
      title: "No Evaluation Methodology",
      severity: "High",
      description:
        "The JD requires 'strong evaluation practices.' There is no mention of how model quality was measured. Candidates who cite NDCG, MRR, F1, or A/B testing frameworks rank significantly higher.",
    },
    {
      title: "Weak Ownership Signals",
      severity: "Medium",
      description:
        "The JD looks for candidates who 'lead technical initiatives.' The resume uses 'contributed to' and 'worked on' frequently. Replace with: 'led the design of', 'owned end-to-end', 'drove adoption'.",
    },
    {
      title: "No Scale Context",
      severity: "Medium",
      description:
        "The JD mentions 'large-scale ML systems.' The resume does not communicate scale. Adding signals like 'served 5M DAU' or 'processed 1TB/day' directly addresses this requirement.",
    },
  ],
  recruiter_perspective: {
    verdict: "Borderline",
    positives: [
      "Clear ML specialization with production exposure — passes initial keyword screening",
      "Framework breadth (PyTorch, TensorFlow) signals genuine hands-on experience",
      "NLP specialization aligns directly with stated role requirements",
    ],
    concerns: [
      "No quantified impact makes it hard to rank against candidates showing measurable outcomes",
      "Ownership language is weak — may be perceived as an IC without senior-level initiative signals",
      "No evaluation rigor mentioned — the JD explicitly requires this for senior candidates",
    ],
  },
  improvement_roadmap: {
    immediate: [
      "Add one quantified metric to each experience bullet: latency, accuracy, users served, or revenue impact",
      "Replace passive language ('worked on', 'contributed') with ownership verbs: 'led', 'built', 'owned'",
      "Add a technical summary at the top that mirrors the JD language: 'Senior ML Engineer with 6 years experience in production NLP systems'",
    ],
    seven_day: [
      "Document your evaluation methodology for each model: what metric, what baseline, what you achieved",
      "Add scale context to each role: inference volume, users served, data processed per day",
      "Create a Projects section with 2–3 standalone projects showing decision-making process end-to-end",
    ],
    thirty_day: [
      "Publish a technical writeup demonstrating NLP or ranking system depth — link it prominently",
      "Complete one project that shows evaluation → deployment → monitoring and make it public",
      "Engage with relevant open-source projects to close your largest skill gap and reference the contribution",
    ],
  },
};
