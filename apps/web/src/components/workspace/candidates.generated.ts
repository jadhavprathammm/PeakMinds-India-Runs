// AUTO-GENERATED — DO NOT EDIT BY HAND.
// Source of truth: team_redrob.csv + candidate_features.parquet + reasoning_facts.parquet
// Regenerate: python services/ranking-engine/export_web_data.py
import type { WorkspaceCandidate } from "./types";

export const FILTER_CHIPS = ["Semantic Search", "BentoML", "Python", "pgvector", "Information Retrieval", "Image Classification", "GANs"] as const;

export const CANDIDATES: WorkspaceCandidate[] = [
  {
    "id": "CAND_0046525",
    "rank": 1,
    "score": 1.0106,
    "role": "Senior Machine Learning Engineer",
    "company": "Genpact AI",
    "experience": 6,
    "appliedMl": 6,
    "tags": [
      "YOLO",
      "pgvector",
      "Information Retrieval"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 16
      },
      {
        "label": "Production depth",
        "weight": 11
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Location & availability",
        "weight": 7
      },
      {
        "label": "Tenure stability",
        "weight": 7
      },
      {
        "label": "Trust signals",
        "weight": 4
      },
      {
        "label": "60-day notice period (JD prefers <=30)",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "NDCG / MRR / A·B evaluation signal",
      "Pre-LLM ML roots (started before 2021)",
      "AI-product company: Genpact AI",
      "6 yrs applied ML"
    ],
    "summary": "Top pick: Senior Machine Learning Engineer, 6 yrs experience (~6 in applied ML); has shipped retrieval/ranking systems to production; at AI-product company Genpact AI; ranking-evaluation signal (NDCG/MRR/A-B). Concern: 60-day notice period (JD prefers <=30)."
  },
  {
    "id": "CAND_0011687",
    "rank": 2,
    "score": 0.9893,
    "role": "Senior NLP Engineer",
    "company": "Niramai",
    "experience": 8,
    "appliedMl": 8,
    "tags": [
      "Semantic Search",
      "LangChain",
      "Image Classification"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 16
      },
      {
        "label": "Production depth",
        "weight": 11
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Tenure stability",
        "weight": 7
      },
      {
        "label": "Location & availability",
        "weight": 6
      },
      {
        "label": "Trust signals",
        "weight": 4
      },
      {
        "label": "based in Indore, would need relocation to Pune/Noida",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "NDCG / MRR / A·B evaluation signal",
      "Pre-LLM ML roots (started before 2021)",
      "AI-product company: Niramai",
      "8 yrs applied ML"
    ],
    "summary": "Top pick: Senior NLP Engineer, 8 yrs experience (~8 in applied ML); has shipped retrieval/ranking systems to production; at AI-product company Niramai; ranking-evaluation signal (NDCG/MRR/A-B). Concern: based in Indore, would need relocation to Pune/Noida."
  },
  {
    "id": "CAND_0072688",
    "rank": 3,
    "score": 0.9824,
    "role": "Data Scientist",
    "company": "Niramai",
    "experience": 7,
    "appliedMl": 7,
    "tags": [
      "Image Classification",
      "Time Series",
      "Forecasting"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 40
      },
      {
        "label": "Experience",
        "weight": 15
      },
      {
        "label": "Production depth",
        "weight": 10
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Location & availability",
        "weight": 8
      },
      {
        "label": "Tenure stability",
        "weight": 7
      },
      {
        "label": "Trust signals",
        "weight": 5
      },
      {
        "label": "45-day notice period (JD prefers <=30)",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "Pre-LLM ML roots (started before 2021)",
      "AI-product company: Niramai",
      "7 yrs applied ML"
    ],
    "summary": "Top pick: Data Scientist, 7 yrs experience (~7 in applied ML); has shipped retrieval/ranking systems to production; at AI-product company Niramai; pre-LLM ML roots. Concern: 45-day notice period (JD prefers <=30)."
  },
  {
    "id": "CAND_0043860",
    "rank": 4,
    "score": 0.9741,
    "role": "Junior ML Engineer",
    "company": "Aganitha",
    "experience": 6,
    "appliedMl": 6,
    "tags": [
      "Semantic Search",
      "GANs",
      "Information Retrieval"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 15
      },
      {
        "label": "Production depth",
        "weight": 10
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Location & availability",
        "weight": 7
      },
      {
        "label": "Tenure stability",
        "weight": 7
      },
      {
        "label": "Trust signals",
        "weight": 4
      },
      {
        "label": "based in Bhubaneswar but open to relocation",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "Pre-LLM ML roots (started before 2021)",
      "AI-product company: Aganitha",
      "6 yrs applied ML"
    ],
    "summary": "Top pick: Junior ML Engineer, 6 yrs experience (~6 in applied ML); has shipped retrieval/ranking systems to production; at AI-product company Aganitha; pre-LLM ML roots. Concern: based in Bhubaneswar but open to relocation."
  },
  {
    "id": "CAND_0004402",
    "rank": 5,
    "score": 0.9655,
    "role": "AI Research Engineer",
    "company": "Yellow.ai",
    "experience": 6,
    "appliedMl": 6,
    "tags": [
      "PEFT",
      "BentoML",
      "TTS"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 14
      },
      {
        "label": "Production depth",
        "weight": 10
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Location & availability",
        "weight": 7
      },
      {
        "label": "Tenure stability",
        "weight": 7
      },
      {
        "label": "Trust signals",
        "weight": 5
      },
      {
        "label": "60-day notice period (JD prefers <=30)",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "Pre-LLM ML roots (started before 2021)",
      "AI-product company: Yellow.ai",
      "6 yrs applied ML"
    ],
    "summary": "Top pick: AI Research Engineer, 6 yrs experience (~6 in applied ML); has shipped retrieval/ranking systems to production; at AI-product company Yellow.ai; pre-LLM ML roots. Concern: 60-day notice period (JD prefers <=30)."
  },
  {
    "id": "CAND_0053605",
    "rank": 6,
    "score": 0.9588,
    "role": "Senior Software Engineer (ML)",
    "company": "Verloop.io",
    "experience": 7,
    "appliedMl": 7,
    "tags": [
      "RAG",
      "pgvector",
      "Semantic Search"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 15
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Location & availability",
        "weight": 8
      },
      {
        "label": "Production depth",
        "weight": 7
      },
      {
        "label": "Tenure stability",
        "weight": 7
      },
      {
        "label": "Trust signals",
        "weight": 3
      },
      {
        "label": "limited explicit evaluation-framework signal",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "Pre-LLM ML roots (started before 2021)",
      "AI-product company: Verloop.io",
      "7 yrs applied ML"
    ],
    "summary": "Top pick: Senior Software Engineer (ML), 7 yrs experience (~7 in applied ML); has shipped retrieval/ranking systems to production; at AI-product company Verloop.io; pre-LLM ML roots. Concern: limited explicit evaluation-framework signal."
  },
  {
    "id": "CAND_0036184",
    "rank": 7,
    "score": 0.9562,
    "role": "Recommendation Systems Engineer",
    "company": "CRED",
    "experience": 6,
    "appliedMl": 6,
    "tags": [
      "Semantic Search",
      "Vector Search",
      "GANs"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 14
      },
      {
        "label": "Production depth",
        "weight": 8
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Tenure stability",
        "weight": 7
      },
      {
        "label": "Location & availability",
        "weight": 6
      },
      {
        "label": "Trust signals",
        "weight": 5
      },
      {
        "label": "based in Trivandrum, would need relocation to Pune/Noida",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "Pre-LLM ML roots (started before 2021)",
      "6 yrs applied ML"
    ],
    "summary": "Top pick: Recommendation Systems Engineer, 6 yrs experience (~6 in applied ML); has shipped retrieval/ranking systems to production; product-company background (CRED); pre-LLM ML roots. Concern: based in Trivandrum, would need relocation to Pune/Noida."
  },
  {
    "id": "CAND_0048558",
    "rank": 8,
    "score": 0.9552,
    "role": "Data Scientist",
    "company": "Rephrase.ai",
    "experience": 7,
    "appliedMl": 5,
    "tags": [
      "OpenSearch",
      "Feature Engineering",
      "Qdrant"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 15
      },
      {
        "label": "Production depth",
        "weight": 10
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Location & availability",
        "weight": 8
      },
      {
        "label": "Tenure stability",
        "weight": 5
      },
      {
        "label": "Trust signals",
        "weight": 5
      },
      {
        "label": "limited explicit evaluation-framework signal",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "Pre-LLM ML roots (started before 2021)",
      "AI-product company: Rephrase.ai",
      "5 yrs applied ML"
    ],
    "summary": "Top pick: Data Scientist, 7 yrs experience (~5 in applied ML); has shipped retrieval/ranking systems to production; at AI-product company Rephrase.ai; pre-LLM ML roots. Concern: limited explicit evaluation-framework signal."
  },
  {
    "id": "CAND_0070525",
    "rank": 9,
    "score": 0.9494,
    "role": "Senior Software Engineer (ML)",
    "company": "Mad Street Den",
    "experience": 5,
    "appliedMl": 5,
    "tags": [
      "Statistical Modeling",
      "Python",
      "LLMs"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 13
      },
      {
        "label": "Production depth",
        "weight": 10
      },
      {
        "label": "Location & availability",
        "weight": 7
      },
      {
        "label": "Tenure stability",
        "weight": 7
      },
      {
        "label": "Trust signals",
        "weight": 5
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 4
      },
      {
        "label": "45-day notice period (JD prefers <=30)",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "AI-product company: Mad Street Den",
      "5 yrs applied ML"
    ],
    "summary": "Top pick: Senior Software Engineer (ML), 5 yrs experience (~5 in applied ML); has shipped retrieval/ranking systems to production; at AI-product company Mad Street Den; skills incl. Statistical Modeling, Python, LLMs. Concern: 45-day notice period (JD prefers <=30)."
  },
  {
    "id": "CAND_0052682",
    "rank": 10,
    "score": 0.948,
    "role": "NLP Engineer",
    "company": "Aganitha",
    "experience": 7,
    "appliedMl": 6,
    "tags": [
      "Python",
      "QLoRA",
      "Embeddings"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 15
      },
      {
        "label": "Production depth",
        "weight": 11
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Tenure stability",
        "weight": 7
      },
      {
        "label": "Location & availability",
        "weight": 6
      },
      {
        "label": "Trust signals",
        "weight": 5
      },
      {
        "label": "based in Vizag, would need relocation to Pune/Noida",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "NDCG / MRR / A·B evaluation signal",
      "Pre-LLM ML roots (started before 2021)",
      "AI-product company: Aganitha",
      "6 yrs applied ML"
    ],
    "summary": "Top pick: NLP Engineer, 7 yrs experience (~6 in applied ML); has shipped retrieval/ranking systems to production; at AI-product company Aganitha; ranking-evaluation signal (NDCG/MRR/A-B). Concern: based in Vizag, would need relocation to Pune/Noida."
  },
  {
    "id": "CAND_0064326",
    "rank": 11,
    "score": 0.945,
    "role": "Search Engineer",
    "company": "Sarvam AI",
    "experience": 8,
    "appliedMl": 8,
    "tags": [
      "Deep Learning",
      "RAG",
      "Weaviate"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 15
      },
      {
        "label": "Production depth",
        "weight": 9
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Location & availability",
        "weight": 7
      },
      {
        "label": "Tenure stability",
        "weight": 4
      },
      {
        "label": "Trust signals",
        "weight": 3
      },
      {
        "label": "45-day notice period (JD prefers <=30)",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "NDCG / MRR / A·B evaluation signal",
      "Pre-LLM ML roots (started before 2021)",
      "AI-product company: Sarvam AI",
      "8 yrs applied ML"
    ],
    "summary": "Top pick: Search Engineer, 8 yrs experience (~8 in applied ML); has shipped retrieval/ranking systems to production; at AI-product company Sarvam AI; ranking-evaluation signal (NDCG/MRR/A-B). Concern: 45-day notice period (JD prefers <=30)."
  },
  {
    "id": "CAND_0067535",
    "rank": 12,
    "score": 0.9434,
    "role": "Junior ML Engineer",
    "company": "Locobuzz",
    "experience": 7,
    "appliedMl": 7,
    "tags": [
      "BentoML",
      "Excel",
      "Reinforcement Learning"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 15
      },
      {
        "label": "Production depth",
        "weight": 8
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Location & availability",
        "weight": 6
      },
      {
        "label": "Tenure stability",
        "weight": 6
      },
      {
        "label": "Trust signals",
        "weight": 5
      },
      {
        "label": "based in Jaipur, would need relocation to Pune/Noida",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "Pre-LLM ML roots (started before 2021)",
      "AI-product company: Locobuzz",
      "7 yrs applied ML"
    ],
    "summary": "Top pick: Junior ML Engineer, 7 yrs experience (~7 in applied ML); has shipped retrieval/ranking systems to production; at AI-product company Locobuzz; pre-LLM ML roots. Concern: based in Jaipur, would need relocation to Pune/Noida."
  },
  {
    "id": "CAND_0008295",
    "rank": 13,
    "score": 0.9421,
    "role": "AI Research Engineer",
    "company": "Razorpay",
    "experience": 6,
    "appliedMl": 6,
    "tags": [
      "QLoRA",
      "Python",
      "BentoML"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 15
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Location & availability",
        "weight": 8
      },
      {
        "label": "Tenure stability",
        "weight": 7
      },
      {
        "label": "Production depth",
        "weight": 4
      },
      {
        "label": "Trust signals",
        "weight": 4
      },
      {
        "label": "45-day notice period (JD prefers <=30)",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "Pre-LLM ML roots (started before 2021)",
      "6 yrs applied ML"
    ],
    "summary": "Top pick: AI Research Engineer, 6 yrs experience (~6 in applied ML); has shipped retrieval/ranking systems to production; product-company background (Razorpay); pre-LLM ML roots. Concern: 45-day notice period (JD prefers <=30)."
  },
  {
    "id": "CAND_0018499",
    "rank": 14,
    "score": 0.9417,
    "role": "Senior Machine Learning Engineer",
    "company": "Zomato",
    "experience": 7,
    "appliedMl": 7,
    "tags": [
      "scikit-learn",
      "Recommendation Systems",
      "Learning to Rank"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 15
      },
      {
        "label": "Production depth",
        "weight": 10
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Location & availability",
        "weight": 8
      },
      {
        "label": "Tenure stability",
        "weight": 7
      },
      {
        "label": "Trust signals",
        "weight": 5
      },
      {
        "label": "verify depth of production ownership at interview",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "NDCG / MRR / A·B evaluation signal",
      "Pre-LLM ML roots (started before 2021)",
      "7 yrs applied ML"
    ],
    "summary": "Top pick: Senior Machine Learning Engineer, 7 yrs experience (~7 in applied ML); has shipped retrieval/ranking systems to production; product-company background (Zomato); ranking-evaluation signal (NDCG/MRR/A-B). Concern: verify depth of production ownership at interview."
  },
  {
    "id": "CAND_0073007",
    "rank": 15,
    "score": 0.9378,
    "role": "AI Specialist",
    "company": "Aganitha",
    "experience": 6,
    "appliedMl": 6,
    "tags": [
      "MLflow",
      "Speech Recognition",
      "Embeddings"
    ],
    "ledger": [
      {
        "label": "Role fit",
        "weight": 42
      },
      {
        "label": "Experience",
        "weight": 14
      },
      {
        "label": "Production depth",
        "weight": 11
      },
      {
        "label": "Pre-LLM ML depth",
        "weight": 8
      },
      {
        "label": "Tenure stability",
        "weight": 7
      },
      {
        "label": "Location & availability",
        "weight": 5
      },
      {
        "label": "Trust signals",
        "weight": 4
      },
      {
        "label": "based in Bangalore, would need relocation to Pune/Noida",
        "weight": -1
      }
    ],
    "evidence": [
      "Shipped retrieval / ranking to production",
      "Pre-LLM ML roots (started before 2021)",
      "AI-product company: Aganitha",
      "6 yrs applied ML"
    ],
    "summary": "Top pick: AI Specialist, 6 yrs experience (~6 in applied ML); has shipped retrieval/ranking systems to production; at AI-product company Aganitha; pre-LLM ML roots. Concern: based in Bangalore, would need relocation to Pune/Noida."
  }
];
