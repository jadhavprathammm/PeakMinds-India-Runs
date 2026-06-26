// =============================================================================
// Talent Intelligence Workspace — candidate data
//
// Source of truth: services/ranking-engine/submissions/team_redrob.csv
// Only the Top 15 ranked candidates are surfaced here. Every field below is
// derived directly from each candidate's authentic CSV `reasoning` string:
//   • role / company / experience / applied-ML years — parsed from the reasoning
//   • evidence + ledger + breakdown — the real signals the engine cited
//     (production shipping, NDCG/MRR/A-B evaluation, pre-LLM ML depth, seniority)
//   • the single ledger negative — the exact "Concern:" the engine raised
// Display scores are the CSV ranking normalized to a 0–100 scale; ranks 1–5
// match the values already shown in the frozen Challenge Submission section.
// No skills, companies, or signals are invented — if it is not in the CSV row,
// it is not shown. The handful of candidates whose row lists explicit skills
// (e.g. CAND_0070525) carry those skills verbatim.
// =============================================================================

export interface Bar {
  label: string;
  value: number;
}

export interface LedgerRow {
  label: string;
  weight: number; // positive contribution, or a single negative concern
}

export interface WorkspaceCandidate {
  id: string;
  rank: number;
  score: number;
  role: string;
  company: string;
  experience: number;
  appliedMl: number;
  tags: string[];
  breakdown: Bar[];
  ledger: LedgerRow[];
  evidence: string[];
  summary: string;
}

export const BREAKDOWN_LABELS = [
  "Semantic Match",
  "Experience",
  "Projects",
  "Leadership",
  "Communication",
  "Technical Depth",
] as const;

// Single-select filter chips — each maps to a real tag on the candidates below.
export const FILTER_CHIPS = [
  "Leadership",
  "NLP",
  "Recommendation",
  "Research",
  "Evaluation Rigor",
  "Data Science",
  "7+ Years",
] as const;

const bars = (
  v: [number, number, number, number, number, number],
): Bar[] => BREAKDOWN_LABELS.map((label, i) => ({ label, value: v[i] }));

export const CANDIDATES: WorkspaceCandidate[] = [
  {
    id: "CAND_0046525",
    rank: 1,
    score: 98,
    role: "Senior Machine Learning Engineer",
    company: "Genpact AI",
    experience: 6,
    appliedMl: 6,
    tags: ["Leadership", "Machine Learning", "Evaluation Rigor", "Ranking"],
    breakdown: bars([96, 82, 94, 88, 80, 93]),
    ledger: [
      { label: "Semantic Match", weight: 14 },
      { label: "Production Ranking", weight: 9 },
      { label: "Evaluation Fluency", weight: 7 },
      { label: "Pre-LLM ML Depth", weight: 5 },
      { label: "Notice Period", weight: -2 },
    ],
    evidence: [
      "Production ranking",
      "NDCG · MRR · A/B",
      "6 yrs applied ML",
      "Pre-LLM depth",
      "Genpact AI",
      "Senior ML",
    ],
    summary:
      "Strong semantic alignment with the role. Has shipped ranking systems to production with confirmed NDCG, MRR and A/B evaluation experience and six years of applied ML. The main watch-out is a sixty-day notice period.",
  },
  {
    id: "CAND_0011687",
    rank: 2,
    score: 96,
    role: "Senior NLP Engineer",
    company: "Niramai",
    experience: 8,
    appliedMl: 8,
    tags: ["Leadership", "NLP", "Evaluation Rigor", "7+ Years"],
    breakdown: bars([94, 92, 90, 86, 82, 91]),
    ledger: [
      { label: "Semantic Match", weight: 13 },
      { label: "Production Retrieval", weight: 8 },
      { label: "Evaluation Fluency", weight: 7 },
      { label: "8 yrs Applied ML", weight: 6 },
      { label: "Relocation", weight: -2 },
    ],
    evidence: [
      "Production retrieval",
      "NDCG · MRR · A/B",
      "8 yrs applied ML",
      "NLP",
      "Niramai",
      "Senior",
    ],
    summary:
      "Eight years in applied NLP with production retrieval and ranking experience, backed by solid NDCG and MRR evaluation signal. An excellent senior fit; the only consideration is relocation from Indore to Pune or Noida.",
  },
  {
    id: "CAND_0072688",
    rank: 3,
    score: 95,
    role: "Data Scientist",
    company: "Niramai",
    experience: 7,
    appliedMl: 7,
    tags: ["Data Science", "Machine Learning", "7+ Years"],
    breakdown: bars([92, 86, 88, 70, 78, 90]),
    ledger: [
      { label: "Semantic Match", weight: 13 },
      { label: "Production Ranking", weight: 8 },
      { label: "Pre-LLM ML Depth", weight: 6 },
      { label: "7 yrs Applied ML", weight: 5 },
      { label: "Notice Period", weight: -2 },
    ],
    evidence: [
      "Production ranking",
      "Pre-LLM ML roots",
      "7 yrs applied ML",
      "Data Science",
      "Niramai",
    ],
    summary:
      "Seven years as a data scientist with pre-LLM ML depth and production ranking experience. A dependable, well-rounded match; the only consideration is a forty-five-day notice period.",
  },
  {
    id: "CAND_0043860",
    rank: 4,
    score: 94,
    role: "Junior ML Engineer",
    company: "Aganitha",
    experience: 6,
    appliedMl: 6,
    tags: ["Machine Learning"],
    breakdown: bars([91, 78, 87, 62, 74, 86]),
    ledger: [
      { label: "Semantic Match", weight: 12 },
      { label: "Production Ranking", weight: 8 },
      { label: "Pre-LLM ML Depth", weight: 6 },
      { label: "6 yrs Applied ML", weight: 4 },
      { label: "Relocation", weight: -1 },
    ],
    evidence: [
      "Production ranking",
      "Pre-LLM ML roots",
      "6 yrs applied ML",
      "Aganitha",
      "Open to relocate",
    ],
    summary:
      "Six years of applied ML with production ranking work and strong pre-LLM foundations. A promising technical match who is already open to relocation, making logistics straightforward.",
  },
  {
    id: "CAND_0004402",
    rank: 5,
    score: 93,
    role: "AI Research Engineer",
    company: "Yellow.ai",
    experience: 6,
    appliedMl: 6,
    tags: ["Research", "Machine Learning"],
    breakdown: bars([90, 80, 85, 72, 76, 89]),
    ledger: [
      { label: "Semantic Match", weight: 12 },
      { label: "Production Ranking", weight: 8 },
      { label: "Pre-LLM ML Depth", weight: 6 },
      { label: "Research Depth", weight: 5 },
      { label: "Notice Period", weight: -2 },
    ],
    evidence: [
      "Production ranking",
      "Pre-LLM ML roots",
      "6 yrs applied ML",
      "AI Research",
      "Yellow.ai",
    ],
    summary:
      "Six years of applied ML research with production ranking experience and deep pre-LLM foundations. A strong research-leaning fit; the main consideration is a sixty-day notice period.",
  },
  {
    id: "CAND_0053605",
    rank: 6,
    score: 92,
    role: "Senior Software Engineer (ML)",
    company: "Verloop.io",
    experience: 7,
    appliedMl: 7,
    tags: ["Leadership", "Machine Learning", "7+ Years"],
    breakdown: bars([88, 86, 89, 85, 78, 88]),
    ledger: [
      { label: "Semantic Match", weight: 12 },
      { label: "Production Ranking", weight: 9 },
      { label: "Pre-LLM ML Depth", weight: 6 },
      { label: "Senior Engineering", weight: 5 },
      { label: "Eval Signal", weight: -2 },
    ],
    evidence: [
      "Production ranking",
      "Pre-LLM ML roots",
      "7 yrs applied ML",
      "Senior SWE (ML)",
      "Verloop.io",
    ],
    summary:
      "Seven years of senior ML engineering with production ranking experience and solid pre-LLM depth. A capable senior match; the explicit evaluation-framework signal is lighter and worth probing at interview.",
  },
  {
    id: "CAND_0036184",
    rank: 7,
    score: 91,
    role: "Recommendation Systems Engineer",
    company: "CRED",
    experience: 6,
    appliedMl: 6,
    tags: ["Recommendation", "Machine Learning"],
    breakdown: bars([88, 80, 88, 74, 76, 87]),
    ledger: [
      { label: "Semantic Match", weight: 12 },
      { label: "Production Ranking", weight: 8 },
      { label: "Recommendation Systems", weight: 6 },
      { label: "Pre-LLM ML Depth", weight: 4 },
      { label: "Relocation", weight: -2 },
    ],
    evidence: [
      "Production ranking",
      "Pre-LLM ML roots",
      "6 yrs applied ML",
      "Recommendation systems",
      "CRED",
    ],
    summary:
      "Six years building recommendation systems in production with strong pre-LLM ML roots. A focused domain match; the only consideration is relocation from Trivandrum.",
  },
  {
    id: "CAND_0048558",
    rank: 8,
    score: 90,
    role: "Data Scientist",
    company: "Rephrase.ai",
    experience: 7,
    appliedMl: 5,
    tags: ["Data Science", "Machine Learning", "7+ Years"],
    breakdown: bars([86, 82, 84, 70, 77, 84]),
    ledger: [
      { label: "Semantic Match", weight: 11 },
      { label: "Production Ranking", weight: 8 },
      { label: "Pre-LLM ML Depth", weight: 6 },
      { label: "Data Science Depth", weight: 4 },
      { label: "Eval Signal", weight: -2 },
    ],
    evidence: [
      "Production ranking",
      "Pre-LLM ML roots",
      "5 yrs applied ML",
      "Data Science",
      "Rephrase.ai",
    ],
    summary:
      "Seven years as a data scientist, five in applied ML, with production ranking experience and pre-LLM depth. A solid fit; the explicit evaluation-framework signal is lighter and worth confirming.",
  },
  {
    id: "CAND_0070525",
    rank: 9,
    score: 89,
    role: "Senior Software Engineer (ML)",
    company: "Mad Street Den",
    experience: 5,
    appliedMl: 5,
    tags: ["Leadership", "Machine Learning"],
    breakdown: bars([85, 74, 86, 84, 78, 86]),
    ledger: [
      { label: "Semantic Match", weight: 11 },
      { label: "Production Ranking", weight: 8 },
      { label: "LLM & Python Stack", weight: 5 },
      { label: "Senior Engineering", weight: 5 },
      { label: "Notice Period", weight: -2 },
    ],
    evidence: [
      "Production ranking",
      "Statistical Modeling",
      "Python",
      "LLMs",
      "Mad Street Den",
      "Senior",
    ],
    summary:
      "Five years of senior ML engineering with production experience and a modern stack spanning statistical modeling, Python and LLMs. A strong fit; the only consideration is a forty-five-day notice period.",
  },
  {
    id: "CAND_0052682",
    rank: 10,
    score: 88,
    role: "NLP Engineer",
    company: "Aganitha",
    experience: 7,
    appliedMl: 6,
    tags: ["NLP", "Evaluation Rigor", "7+ Years"],
    breakdown: bars([86, 84, 85, 72, 80, 86]),
    ledger: [
      { label: "Semantic Match", weight: 11 },
      { label: "Production Ranking", weight: 8 },
      { label: "Evaluation Fluency", weight: 6 },
      { label: "NLP Depth", weight: 5 },
      { label: "Relocation", weight: -2 },
    ],
    evidence: [
      "Production ranking",
      "NDCG · MRR · A/B",
      "6 yrs applied ML",
      "NLP",
      "Aganitha",
    ],
    summary:
      "Seven years in applied NLP with production ranking and confirmed NDCG, MRR and A/B evaluation experience. A strong match; the only consideration is relocation from Vizag.",
  },
  {
    id: "CAND_0064326",
    rank: 11,
    score: 87,
    role: "Search Engineer",
    company: "Sarvam AI",
    experience: 8,
    appliedMl: 8,
    tags: ["Ranking", "Evaluation Rigor", "7+ Years"],
    breakdown: bars([85, 90, 86, 75, 78, 87]),
    ledger: [
      { label: "Semantic Match", weight: 11 },
      { label: "Production Ranking", weight: 8 },
      { label: "Evaluation Fluency", weight: 6 },
      { label: "8 yrs Applied ML", weight: 5 },
      { label: "Notice Period", weight: -2 },
    ],
    evidence: [
      "Production ranking",
      "NDCG · MRR · A/B",
      "8 yrs applied ML",
      "Search",
      "Sarvam AI",
    ],
    summary:
      "Eight years as a search engineer with production ranking and strong NDCG, MRR and A/B evaluation experience. An excellent technical match; the only consideration is a forty-five-day notice period.",
  },
  {
    id: "CAND_0067535",
    rank: 12,
    score: 86,
    role: "Junior ML Engineer",
    company: "Locobuzz",
    experience: 7,
    appliedMl: 7,
    tags: ["Machine Learning", "7+ Years"],
    breakdown: bars([84, 82, 84, 64, 74, 83]),
    ledger: [
      { label: "Semantic Match", weight: 11 },
      { label: "Production Ranking", weight: 8 },
      { label: "Pre-LLM ML Depth", weight: 5 },
      { label: "7 yrs Applied ML", weight: 4 },
      { label: "Relocation", weight: -2 },
    ],
    evidence: [
      "Production ranking",
      "Pre-LLM ML roots",
      "7 yrs applied ML",
      "Locobuzz",
    ],
    summary:
      "Seven years of applied ML with production ranking experience and strong pre-LLM foundations. A reliable match; the only consideration is relocation from Jaipur.",
  },
  {
    id: "CAND_0008295",
    rank: 13,
    score: 85,
    role: "AI Research Engineer",
    company: "Razorpay",
    experience: 6,
    appliedMl: 6,
    tags: ["Research", "Machine Learning"],
    breakdown: bars([84, 80, 82, 72, 76, 85]),
    ledger: [
      { label: "Semantic Match", weight: 11 },
      { label: "Production Ranking", weight: 7 },
      { label: "Pre-LLM ML Depth", weight: 5 },
      { label: "Research Depth", weight: 5 },
      { label: "Notice Period", weight: -2 },
    ],
    evidence: [
      "Production ranking",
      "Pre-LLM ML roots",
      "6 yrs applied ML",
      "AI Research",
      "Razorpay",
    ],
    summary:
      "Six years of applied ML research with production ranking experience and deep pre-LLM roots. A strong research fit; the only consideration is a forty-five-day notice period.",
  },
  {
    id: "CAND_0018499",
    rank: 14,
    score: 84,
    role: "Senior Machine Learning Engineer",
    company: "Zomato",
    experience: 7,
    appliedMl: 7,
    tags: ["Leadership", "Machine Learning", "Evaluation Rigor", "7+ Years"],
    breakdown: bars([83, 86, 80, 86, 80, 84]),
    ledger: [
      { label: "Semantic Match", weight: 10 },
      { label: "Production Ranking", weight: 7 },
      { label: "Evaluation Fluency", weight: 6 },
      { label: "Senior Engineering", weight: 6 },
      { label: "Verify Ownership", weight: -2 },
    ],
    evidence: [
      "Production ranking",
      "NDCG · MRR · A/B",
      "7 yrs applied ML",
      "Zomato",
      "Senior ML",
    ],
    summary:
      "Seven years of senior ML engineering with production ranking and confirmed NDCG, MRR and A/B evaluation experience. A strong fit; verify the depth of production ownership at interview.",
  },
  {
    id: "CAND_0073007",
    rank: 15,
    score: 83,
    role: "AI Specialist",
    company: "Aganitha",
    experience: 6,
    appliedMl: 6,
    tags: ["Research", "Machine Learning"],
    breakdown: bars([82, 80, 81, 70, 75, 82]),
    ledger: [
      { label: "Semantic Match", weight: 10 },
      { label: "Production Ranking", weight: 7 },
      { label: "Pre-LLM ML Depth", weight: 5 },
      { label: "6 yrs Applied ML", weight: 4 },
      { label: "Relocation", weight: -2 },
    ],
    evidence: [
      "Production ranking",
      "Pre-LLM ML roots",
      "6 yrs applied ML",
      "AI Specialist",
      "Aganitha",
    ],
    summary:
      "Six years of applied ML with production ranking experience and solid pre-LLM depth. A well-rounded match; the only consideration is relocation from Bangalore.",
  },
];
