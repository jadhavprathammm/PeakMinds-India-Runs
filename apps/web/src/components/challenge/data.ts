// Top candidates from services/ranking-engine/submissions/team_redrob.csv
// Scores normalized to 0-100 display scale (raw CSV scores peak at ~1.011).
// Reasoning condensed into short proof chips — no paragraphs.
export interface RankedCandidate {
  id: string;
  rank: number;
  role: string;
  company: string;
  experience: number;
  score: number;
  chips: [string, string, string];
}

export const TOP_CANDIDATES: RankedCandidate[] = [
  {
    id: "CAND_0046525",
    rank: 1,
    role: "Senior Machine Learning Engineer",
    company: "Genpact AI",
    experience: 6,
    score: 98,
    chips: ["Production ranking", "NDCG · MRR · A/B", "6 yrs applied ML"],
  },
  {
    id: "CAND_0011687",
    rank: 2,
    role: "Senior NLP Engineer",
    company: "Niramai",
    experience: 8,
    score: 96,
    chips: ["Production retrieval", "NDCG · MRR · A/B", "8 yrs applied ML"],
  },
  {
    id: "CAND_0072688",
    rank: 3,
    role: "Data Scientist",
    company: "Niramai",
    experience: 7,
    score: 95,
    chips: ["Production ranking", "Pre-LLM ML roots", "7 yrs applied ML"],
  },
  {
    id: "CAND_0043860",
    rank: 4,
    role: "Junior ML Engineer",
    company: "Aganitha",
    experience: 6,
    score: 94,
    chips: ["Production ranking", "Open to relocate", "6 yrs applied ML"],
  },
  {
    id: "CAND_0004402",
    rank: 5,
    role: "AI Research Engineer",
    company: "Yellow.ai",
    experience: 6,
    score: 93,
    chips: ["Production ranking", "Pre-LLM ML roots", "6 yrs applied ML"],
  },
];
