// Top candidates from services/ranking-engine/submissions/team_redrob.csv.
// `score` is the REAL model score (S = S_fit × availability) — identical to the
// submission CSV. Reasoning condensed into short proof chips drawn from the
// engine's actual reasoning string — no paragraphs, no invented values.
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
    score: 1.0106,
    chips: ["Production ranking", "NDCG · MRR · A/B", "6 yrs applied ML"],
  },
  {
    id: "CAND_0011687",
    rank: 2,
    role: "Senior NLP Engineer",
    company: "Niramai",
    experience: 8,
    score: 0.9893,
    chips: ["Production retrieval", "NDCG · MRR · A/B", "8 yrs applied ML"],
  },
  {
    id: "CAND_0072688",
    rank: 3,
    role: "Data Scientist",
    company: "Niramai",
    experience: 7,
    score: 0.9824,
    chips: ["Production ranking", "Pre-LLM ML roots", "7 yrs applied ML"],
  },
  {
    id: "CAND_0043860",
    rank: 4,
    role: "Junior ML Engineer",
    company: "Aganitha",
    experience: 6,
    score: 0.9741,
    chips: ["Production ranking", "Open to relocate", "6 yrs applied ML"],
  },
  {
    id: "CAND_0004402",
    rank: 5,
    role: "AI Research Engineer",
    company: "Yellow.ai",
    experience: 6,
    score: 0.9655,
    chips: ["Production ranking", "Pre-LLM ML roots", "6 yrs applied ML"],
  },
];
