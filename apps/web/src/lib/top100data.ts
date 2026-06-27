// AUTO-GENERATED — DO NOT EDIT BY HAND.
// Source of truth: services/ranking-engine/submissions/team_redrob.csv
//   + artifacts/candidate_features.parquet + reasoning_facts.parquet
// Regenerate: python services/ranking-engine/export_web_data.py

export type RankedEntry = {
  id: string;
  rank: number;
  score: number; // real model score from team_redrob.csv (S = S_fit x availability)
  role: string;
  company: string;
  experience: number; // years
  tier: number; // rubric tier 0-5 (every finalist clears the Tier-5 bar, S >= 0.80)
  skills: string[]; // top-3 endorsed skills from the candidate profile
};

export type Finding = { stat: string; label: string };

export const SCORE_RANGE = {"min": 0.8601, "max": 1.0106};

export const FINDINGS: Finding[] = [
  {
    "stat": "100%",
    "label": "of finalists show production-deployment evidence in their history."
  },
  {
    "stat": "100%",
    "label": "have personally shipped a retrieval / ranking system to production."
  },
  {
    "stat": "80%",
    "label": "have pre-LLM ML roots — applied ML before 2021, not just recent GenAI."
  },
  {
    "stat": "92%",
    "label": "have 5+ years of experience (mean 6.4 yrs)."
  },
  {
    "stat": "47%",
    "label": "show explicit ranking-evaluation signal (NDCG / MRR / A·B testing)."
  },
  {
    "stat": "96%",
    "label": "are currently at product or AI-product companies, not services firms."
  }
];

export const TOP_100: RankedEntry[] = [
  {
    "id": "CAND_0046525",
    "rank": 1,
    "score": 1.0106,
    "role": "Senior Machine Learning Engineer",
    "company": "Genpact AI",
    "experience": 6,
    "tier": 5,
    "skills": [
      "YOLO",
      "pgvector",
      "Information Retrieval"
    ]
  },
  {
    "id": "CAND_0011687",
    "rank": 2,
    "score": 0.9893,
    "role": "Senior NLP Engineer",
    "company": "Niramai",
    "experience": 8,
    "tier": 5,
    "skills": [
      "Semantic Search",
      "LangChain",
      "Image Classification"
    ]
  },
  {
    "id": "CAND_0072688",
    "rank": 3,
    "score": 0.9824,
    "role": "Data Scientist",
    "company": "Niramai",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Image Classification",
      "Time Series",
      "Forecasting"
    ]
  },
  {
    "id": "CAND_0043860",
    "rank": 4,
    "score": 0.9741,
    "role": "Junior ML Engineer",
    "company": "Aganitha",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Semantic Search",
      "GANs",
      "Information Retrieval"
    ]
  },
  {
    "id": "CAND_0004402",
    "rank": 5,
    "score": 0.9655,
    "role": "AI Research Engineer",
    "company": "Yellow.ai",
    "experience": 6,
    "tier": 5,
    "skills": [
      "PEFT",
      "BentoML",
      "TTS"
    ]
  },
  {
    "id": "CAND_0053605",
    "rank": 6,
    "score": 0.9588,
    "role": "Senior Software Engineer (ML)",
    "company": "Verloop.io",
    "experience": 7,
    "tier": 5,
    "skills": [
      "RAG",
      "pgvector",
      "Semantic Search"
    ]
  },
  {
    "id": "CAND_0036184",
    "rank": 7,
    "score": 0.9562,
    "role": "Recommendation Systems Engineer",
    "company": "CRED",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Semantic Search",
      "Vector Search",
      "GANs"
    ]
  },
  {
    "id": "CAND_0048558",
    "rank": 8,
    "score": 0.9552,
    "role": "Data Scientist",
    "company": "Rephrase.ai",
    "experience": 7,
    "tier": 5,
    "skills": [
      "OpenSearch",
      "Feature Engineering",
      "Qdrant"
    ]
  },
  {
    "id": "CAND_0070525",
    "rank": 9,
    "score": 0.9494,
    "role": "Senior Software Engineer (ML)",
    "company": "Mad Street Den",
    "experience": 5,
    "tier": 5,
    "skills": [
      "Statistical Modeling",
      "Python",
      "LLMs"
    ]
  },
  {
    "id": "CAND_0052682",
    "rank": 10,
    "score": 0.948,
    "role": "NLP Engineer",
    "company": "Aganitha",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Python",
      "QLoRA",
      "Embeddings"
    ]
  },
  {
    "id": "CAND_0064326",
    "rank": 11,
    "score": 0.945,
    "role": "Search Engineer",
    "company": "Sarvam AI",
    "experience": 8,
    "tier": 5,
    "skills": [
      "Deep Learning",
      "RAG",
      "Weaviate"
    ]
  },
  {
    "id": "CAND_0067535",
    "rank": 12,
    "score": 0.9434,
    "role": "Junior ML Engineer",
    "company": "Locobuzz",
    "experience": 7,
    "tier": 5,
    "skills": [
      "BentoML",
      "Excel",
      "Reinforcement Learning"
    ]
  },
  {
    "id": "CAND_0008295",
    "rank": 13,
    "score": 0.9421,
    "role": "AI Research Engineer",
    "company": "Razorpay",
    "experience": 6,
    "tier": 5,
    "skills": [
      "QLoRA",
      "Python",
      "BentoML"
    ]
  },
  {
    "id": "CAND_0018499",
    "rank": 14,
    "score": 0.9417,
    "role": "Senior Machine Learning Engineer",
    "company": "Zomato",
    "experience": 7,
    "tier": 5,
    "skills": [
      "scikit-learn",
      "Recommendation Systems",
      "Learning to Rank"
    ]
  },
  {
    "id": "CAND_0073007",
    "rank": 15,
    "score": 0.9378,
    "role": "AI Specialist",
    "company": "Aganitha",
    "experience": 6,
    "tier": 5,
    "skills": [
      "MLflow",
      "Speech Recognition",
      "Embeddings"
    ]
  },
  {
    "id": "CAND_0077337",
    "rank": 16,
    "score": 0.9366,
    "role": "Staff Machine Learning Engineer",
    "company": "Paytm",
    "experience": 7,
    "tier": 5,
    "skills": [
      "LlamaIndex",
      "LLMs",
      "Information Retrieval"
    ]
  },
  {
    "id": "CAND_0032271",
    "rank": 17,
    "score": 0.9323,
    "role": "AI Research Engineer",
    "company": "Mad Street Den",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Forecasting",
      "Data Science",
      "PEFT"
    ]
  },
  {
    "id": "CAND_0050454",
    "rank": 18,
    "score": 0.9316,
    "role": "AI Engineer",
    "company": "Rephrase.ai",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Qdrant",
      "BM25",
      "PyTorch"
    ]
  },
  {
    "id": "CAND_0088025",
    "rank": 19,
    "score": 0.9316,
    "role": "Staff Machine Learning Engineer",
    "company": "Yellow.ai",
    "experience": 9,
    "tier": 5,
    "skills": [
      "Elasticsearch",
      "Learning to Rank",
      "RAG"
    ]
  },
  {
    "id": "CAND_0092706",
    "rank": 20,
    "score": 0.93,
    "role": "AI Research Engineer",
    "company": "Unacademy",
    "experience": 6,
    "tier": 5,
    "skills": [
      "MLOps",
      "Hugging Face Transformers",
      "Forecasting"
    ]
  },
  {
    "id": "CAND_0011327",
    "rank": 21,
    "score": 0.9277,
    "role": "AI Research Engineer",
    "company": "Krutrim",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Forecasting",
      "Weights & Biases",
      "Speech Recognition"
    ]
  },
  {
    "id": "CAND_0006418",
    "rank": 22,
    "score": 0.9269,
    "role": "Machine Learning Engineer",
    "company": "Verloop.io",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Elasticsearch",
      "OpenSearch",
      "Time Series"
    ]
  },
  {
    "id": "CAND_0067866",
    "rank": 23,
    "score": 0.9206,
    "role": "Senior Software Engineer (ML)",
    "company": "Tech Mahindra",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Weights & Biases",
      "Qdrant",
      "Elasticsearch"
    ]
  },
  {
    "id": "CAND_0069905",
    "rank": 24,
    "score": 0.9192,
    "role": "Applied ML Engineer",
    "company": "Sarvam AI",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Python",
      "Sentence Transformers",
      "TensorFlow"
    ]
  },
  {
    "id": "CAND_0018722",
    "rank": 25,
    "score": 0.9188,
    "role": "Recommendation Systems Engineer",
    "company": "Saarthi.ai",
    "experience": 7,
    "tier": 5,
    "skills": [
      "TensorFlow",
      "GANs",
      "Hugging Face Transformers"
    ]
  },
  {
    "id": "CAND_0010149",
    "rank": 26,
    "score": 0.9172,
    "role": "ML Engineer",
    "company": "Glance",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Learning to Rank",
      "Milvus",
      "Vector Search"
    ]
  },
  {
    "id": "CAND_0062247",
    "rank": 27,
    "score": 0.9162,
    "role": "AI Engineer",
    "company": "Google",
    "experience": 7,
    "tier": 5,
    "skills": [
      "PEFT",
      "Hugging Face Transformers",
      "RAG"
    ]
  },
  {
    "id": "CAND_0052328",
    "rank": 28,
    "score": 0.9144,
    "role": "Recommendation Systems Engineer",
    "company": "Amazon",
    "experience": 6,
    "tier": 5,
    "skills": [
      "QLoRA",
      "Learning to Rank",
      "Image Classification"
    ]
  },
  {
    "id": "CAND_0018549",
    "rank": 29,
    "score": 0.9141,
    "role": "Recommendation Systems Engineer",
    "company": "Uber",
    "experience": 7,
    "tier": 5,
    "skills": [
      "OpenSearch",
      "Elasticsearch",
      "scikit-learn"
    ]
  },
  {
    "id": "CAND_0018013",
    "rank": 30,
    "score": 0.9135,
    "role": "AI Specialist",
    "company": "Sarvam AI",
    "experience": 7,
    "tier": 5,
    "skills": [
      "PyTorch",
      "Weights & Biases",
      "LlamaIndex"
    ]
  },
  {
    "id": "CAND_0068932",
    "rank": 31,
    "score": 0.9131,
    "role": "ML Engineer",
    "company": "Krutrim",
    "experience": 5,
    "tier": 5,
    "skills": [
      "Reinforcement Learning",
      "OpenSearch",
      "CNN"
    ]
  },
  {
    "id": "CAND_0079387",
    "rank": 32,
    "score": 0.9127,
    "role": "AI Engineer",
    "company": "Microsoft",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Haystack",
      "Time Series",
      "scikit-learn"
    ]
  },
  {
    "id": "CAND_0033179",
    "rank": 33,
    "score": 0.9108,
    "role": "AI Research Engineer",
    "company": "Wipro",
    "experience": 7,
    "tier": 5,
    "skills": [
      "OpenSearch",
      "Fine-tuning LLMs",
      "Information Retrieval"
    ]
  },
  {
    "id": "CAND_0098454",
    "rank": 34,
    "score": 0.9089,
    "role": "AI Specialist",
    "company": "Meesho",
    "experience": 7,
    "tier": 5,
    "skills": [
      "GANs",
      "Feature Engineering",
      "CNN"
    ]
  },
  {
    "id": "CAND_0046132",
    "rank": 35,
    "score": 0.9044,
    "role": "AI Research Engineer",
    "company": "Verloop.io",
    "experience": 4,
    "tier": 5,
    "skills": [
      "Time Series",
      "MLflow",
      "MLOps"
    ]
  },
  {
    "id": "CAND_0083852",
    "rank": 36,
    "score": 0.9027,
    "role": "Data Scientist",
    "company": "Mad Street Den",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Sentence Transformers",
      "Prompt Engineering",
      "Qdrant"
    ]
  },
  {
    "id": "CAND_0024878",
    "rank": 37,
    "score": 0.9021,
    "role": "AI Specialist",
    "company": "HCL",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Prompt Engineering",
      "MLOps",
      "PEFT"
    ]
  },
  {
    "id": "CAND_0061257",
    "rank": 38,
    "score": 0.9012,
    "role": "Staff Machine Learning Engineer",
    "company": "LinkedIn",
    "experience": 8,
    "tier": 5,
    "skills": [
      "Workflow Orchestration",
      "Indexing Algorithms",
      "Vector Representations"
    ]
  },
  {
    "id": "CAND_0010257",
    "rank": 39,
    "score": 0.8997,
    "role": "Senior Data Scientist",
    "company": "Google",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Recommendation Systems",
      "MLflow",
      "TensorFlow"
    ]
  },
  {
    "id": "CAND_0044222",
    "rank": 40,
    "score": 0.8995,
    "role": "AI Engineer",
    "company": "PolicyBazaar",
    "experience": 8,
    "tier": 5,
    "skills": [
      "Feature Engineering",
      "Fine-tuning LLMs",
      "Deep Learning"
    ]
  },
  {
    "id": "CAND_0078002",
    "rank": 41,
    "score": 0.8981,
    "role": "Machine Learning Engineer",
    "company": "Meta",
    "experience": 6,
    "tier": 5,
    "skills": [
      "QLoRA",
      "Haystack",
      "NLP"
    ]
  },
  {
    "id": "CAND_0010603",
    "rank": 42,
    "score": 0.8974,
    "role": "ML Engineer",
    "company": "BYJU'S",
    "experience": 5,
    "tier": 5,
    "skills": [
      "OpenSearch",
      "Forecasting",
      "Deep Learning"
    ]
  },
  {
    "id": "CAND_0046064",
    "rank": 43,
    "score": 0.8973,
    "role": "Senior NLP Engineer",
    "company": "Salesforce",
    "experience": 9,
    "tier": 5,
    "skills": [
      "Deep Learning",
      "Pinecone",
      "BM25"
    ]
  },
  {
    "id": "CAND_0008425",
    "rank": 44,
    "score": 0.8967,
    "role": "Senior NLP Engineer",
    "company": "Ola",
    "experience": 8,
    "tier": 5,
    "skills": [
      "TensorFlow",
      "Information Retrieval",
      "Sentence Transformers"
    ]
  },
  {
    "id": "CAND_0081852",
    "rank": 45,
    "score": 0.8967,
    "role": "Senior Data Scientist",
    "company": "Mad Street Den",
    "experience": 6,
    "tier": 5,
    "skills": [
      "LoRA",
      "Weaviate",
      "Haystack"
    ]
  },
  {
    "id": "CAND_0070514",
    "rank": 46,
    "score": 0.8967,
    "role": "AI Specialist",
    "company": "Glance",
    "experience": 6,
    "tier": 5,
    "skills": [
      "OpenSearch",
      "Kubeflow",
      "BentoML"
    ]
  },
  {
    "id": "CAND_0064256",
    "rank": 47,
    "score": 0.8963,
    "role": "Junior ML Engineer",
    "company": "BYJU'S",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Hugging Face Transformers",
      "Python",
      "BentoML"
    ]
  },
  {
    "id": "CAND_0055905",
    "rank": 48,
    "score": 0.8963,
    "role": "Senior Machine Learning Engineer",
    "company": "Flipkart",
    "experience": 8,
    "tier": 5,
    "skills": [
      "OpenSearch",
      "Fine-tuning LLMs",
      "ASR"
    ]
  },
  {
    "id": "CAND_0090155",
    "rank": 49,
    "score": 0.894,
    "role": "ML Engineer",
    "company": "Swiggy",
    "experience": 6,
    "tier": 5,
    "skills": [
      "CNN",
      "Pinecone",
      "GANs"
    ]
  },
  {
    "id": "CAND_0032887",
    "rank": 50,
    "score": 0.8936,
    "role": "ML Engineer",
    "company": "Niramai",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Elasticsearch",
      "Forecasting",
      "NLP"
    ]
  },
  {
    "id": "CAND_0079064",
    "rank": 51,
    "score": 0.8934,
    "role": "Senior Data Scientist",
    "company": "Niramai",
    "experience": 5,
    "tier": 5,
    "skills": [
      "OpenSearch",
      "LlamaIndex",
      "Semantic Search"
    ]
  },
  {
    "id": "CAND_0017960",
    "rank": 52,
    "score": 0.8928,
    "role": "Recommendation Systems Engineer",
    "company": "Nykaa",
    "experience": 8,
    "tier": 5,
    "skills": [
      "Python",
      "BentoML",
      "QLoRA"
    ]
  },
  {
    "id": "CAND_0099806",
    "rank": 53,
    "score": 0.8927,
    "role": "AI Engineer",
    "company": "Mad Street Den",
    "experience": 5,
    "tier": 5,
    "skills": [
      "Qdrant",
      "BM25",
      "Prompt Engineering"
    ]
  },
  {
    "id": "CAND_0027691",
    "rank": 54,
    "score": 0.8919,
    "role": "NLP Engineer",
    "company": "Haptik",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Recommendation Systems",
      "QLoRA",
      "scikit-learn"
    ]
  },
  {
    "id": "CAND_0053527",
    "rank": 55,
    "score": 0.8916,
    "role": "Junior ML Engineer",
    "company": "PhonePe",
    "experience": 7,
    "tier": 5,
    "skills": [
      "QLoRA",
      "CNN",
      "Reinforcement Learning"
    ]
  },
  {
    "id": "CAND_0052335",
    "rank": 56,
    "score": 0.8912,
    "role": "Applied ML Engineer",
    "company": "Aganitha",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Learning to Rank",
      "GANs",
      "Sentence Transformers"
    ]
  },
  {
    "id": "CAND_0073883",
    "rank": 57,
    "score": 0.8912,
    "role": "AI Specialist",
    "company": "Krutrim",
    "experience": 5,
    "tier": 5,
    "skills": [
      "PEFT",
      "Forecasting",
      "Image Classification"
    ]
  },
  {
    "id": "CAND_0096104",
    "rank": 58,
    "score": 0.891,
    "role": "AI Specialist",
    "company": "Yellow.ai",
    "experience": 7,
    "tier": 5,
    "skills": [
      "ASR",
      "TTS",
      "PEFT"
    ]
  },
  {
    "id": "CAND_0041669",
    "rank": 59,
    "score": 0.8882,
    "role": "Recommendation Systems Engineer",
    "company": "CRED",
    "experience": 8,
    "tier": 5,
    "skills": [
      "Weaviate",
      "Time Series",
      "Prompt Engineering"
    ]
  },
  {
    "id": "CAND_0075249",
    "rank": 60,
    "score": 0.8868,
    "role": "Applied ML Engineer",
    "company": "Zomato",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Kubeflow",
      "Haystack",
      "Machine Learning"
    ]
  },
  {
    "id": "CAND_0000422",
    "rank": 61,
    "score": 0.8863,
    "role": "AI Research Engineer",
    "company": "Haptik",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Python",
      "OpenCV",
      "Reinforcement Learning"
    ]
  },
  {
    "id": "CAND_0035879",
    "rank": 62,
    "score": 0.8861,
    "role": "AI Research Engineer",
    "company": "Krutrim",
    "experience": 4,
    "tier": 5,
    "skills": [
      "Speech Recognition",
      "Diffusion Models",
      "Python"
    ]
  },
  {
    "id": "CAND_0026942",
    "rank": 63,
    "score": 0.8856,
    "role": "Junior ML Engineer",
    "company": "Verloop.io",
    "experience": 6,
    "tier": 5,
    "skills": [
      "OpenCV",
      "Recommendation Systems",
      "Data Science"
    ]
  },
  {
    "id": "CAND_0098846",
    "rank": 64,
    "score": 0.8844,
    "role": "AI Engineer",
    "company": "upGrad",
    "experience": 8,
    "tier": 5,
    "skills": [
      "Recommendation Systems",
      "Qdrant",
      "Haystack"
    ]
  },
  {
    "id": "CAND_0076163",
    "rank": 65,
    "score": 0.8844,
    "role": "NLP Engineer",
    "company": "Ola",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Python",
      "Weaviate",
      "Semantic Search"
    ]
  },
  {
    "id": "CAND_0041918",
    "rank": 66,
    "score": 0.884,
    "role": "AI Specialist",
    "company": "Glance",
    "experience": 6,
    "tier": 5,
    "skills": [
      "YOLO",
      "GANs",
      "Semantic Search"
    ]
  },
  {
    "id": "CAND_0049540",
    "rank": 67,
    "score": 0.8829,
    "role": "ML Engineer",
    "company": "Saarthi.ai",
    "experience": 7,
    "tier": 5,
    "skills": [
      "pgvector",
      "MLflow",
      "YOLO"
    ]
  },
  {
    "id": "CAND_0099751",
    "rank": 68,
    "score": 0.8824,
    "role": "Junior ML Engineer",
    "company": "Observe.AI",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Reinforcement Learning",
      "Hugging Face Transformers",
      "QLoRA"
    ]
  },
  {
    "id": "CAND_0037566",
    "rank": 69,
    "score": 0.8823,
    "role": "Machine Learning Engineer",
    "company": "LinkedIn",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Elasticsearch",
      "NLP",
      "Feature Engineering"
    ]
  },
  {
    "id": "CAND_0050876",
    "rank": 70,
    "score": 0.8817,
    "role": "Applied ML Engineer",
    "company": "Freshworks",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Qdrant",
      "Sentence Transformers",
      "Prompt Engineering"
    ]
  },
  {
    "id": "CAND_0075574",
    "rank": 71,
    "score": 0.8812,
    "role": "Machine Learning Engineer",
    "company": "Haptik",
    "experience": 6,
    "tier": 5,
    "skills": [
      "PyTorch",
      "Weaviate",
      "pgvector"
    ]
  },
  {
    "id": "CAND_0061265",
    "rank": 72,
    "score": 0.8793,
    "role": "Recommendation Systems Engineer",
    "company": "Zoho",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Hugging Face Transformers",
      "Milvus",
      "QLoRA"
    ]
  },
  {
    "id": "CAND_0011162",
    "rank": 73,
    "score": 0.8791,
    "role": "Recommendation Systems Engineer",
    "company": "upGrad",
    "experience": 6,
    "tier": 5,
    "skills": [
      "OpenSearch",
      "Python",
      "Sentence Transformers"
    ]
  },
  {
    "id": "CAND_0024147",
    "rank": 74,
    "score": 0.8781,
    "role": "ML Engineer",
    "company": "Ola",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Qdrant",
      "Feature Engineering",
      "Computer Vision"
    ]
  },
  {
    "id": "CAND_0027801",
    "rank": 75,
    "score": 0.8778,
    "role": "NLP Engineer",
    "company": "InMobi",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Milvus",
      "QLoRA",
      "Learning to Rank"
    ]
  },
  {
    "id": "CAND_0070398",
    "rank": 76,
    "score": 0.8772,
    "role": "Machine Learning Engineer",
    "company": "Genpact AI",
    "experience": 7,
    "tier": 5,
    "skills": [
      "BM25",
      "Data Science",
      "LoRA"
    ]
  },
  {
    "id": "CAND_0091909",
    "rank": 77,
    "score": 0.8763,
    "role": "Machine Learning Engineer",
    "company": "Rephrase.ai",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Qdrant",
      "OpenSearch",
      "Learning to Rank"
    ]
  },
  {
    "id": "CAND_0009691",
    "rank": 78,
    "score": 0.8761,
    "role": "Applied ML Engineer",
    "company": "LinkedIn",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Prompt Engineering",
      "Fine-tuning LLMs",
      "ASR"
    ]
  },
  {
    "id": "CAND_0073504",
    "rank": 79,
    "score": 0.8754,
    "role": "Junior ML Engineer",
    "company": "PolicyBazaar",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Vector Search",
      "TensorFlow",
      "Diffusion Models"
    ]
  },
  {
    "id": "CAND_0037980",
    "rank": 80,
    "score": 0.8737,
    "role": "Senior Applied Scientist",
    "company": "Niramai",
    "experience": 9,
    "tier": 5,
    "skills": [
      "Text Encoders",
      "LoRA",
      "TTS"
    ]
  },
  {
    "id": "CAND_0025640",
    "rank": 81,
    "score": 0.8725,
    "role": "AI Research Engineer",
    "company": "HCL",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Semantic Search",
      "Elasticsearch",
      "CNN"
    ]
  },
  {
    "id": "CAND_0055960",
    "rank": 82,
    "score": 0.8717,
    "role": "AI Specialist",
    "company": "Dream11",
    "experience": 5,
    "tier": 5,
    "skills": [
      "Machine Learning",
      "PyTorch",
      "Reinforcement Learning"
    ]
  },
  {
    "id": "CAND_0065195",
    "rank": 83,
    "score": 0.8708,
    "role": "Search Engineer",
    "company": "CRED",
    "experience": 5,
    "tier": 5,
    "skills": [
      "Hugging Face Transformers",
      "LlamaIndex",
      "Diffusion Models"
    ]
  },
  {
    "id": "CAND_0012837",
    "rank": 84,
    "score": 0.8701,
    "role": "Junior ML Engineer",
    "company": "Sarvam AI",
    "experience": 6,
    "tier": 5,
    "skills": [
      "MLOps",
      "Object Detection",
      "Speech Recognition"
    ]
  },
  {
    "id": "CAND_0049896",
    "rank": 85,
    "score": 0.8689,
    "role": "Search Engineer",
    "company": "Unacademy",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Information Retrieval",
      "Data Science",
      "LangChain"
    ]
  },
  {
    "id": "CAND_0043829",
    "rank": 86,
    "score": 0.8688,
    "role": "AI Research Engineer",
    "company": "Observe.AI",
    "experience": 5,
    "tier": 5,
    "skills": [
      "Qdrant",
      "Time Series",
      "BM25"
    ]
  },
  {
    "id": "CAND_0016163",
    "rank": 87,
    "score": 0.8685,
    "role": "Applied ML Engineer",
    "company": "Dream11",
    "experience": 7,
    "tier": 5,
    "skills": [
      "LoRA",
      "Time Series",
      "pgvector"
    ]
  },
  {
    "id": "CAND_0029367",
    "rank": 88,
    "score": 0.8662,
    "role": "Senior Data Scientist",
    "company": "Rephrase.ai",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Recommendation Systems",
      "Forecasting",
      "Haystack"
    ]
  },
  {
    "id": "CAND_0010685",
    "rank": 89,
    "score": 0.866,
    "role": "NLP Engineer",
    "company": "Rephrase.ai",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Weights & Biases",
      "Haystack",
      "Deep Learning"
    ]
  },
  {
    "id": "CAND_0030784",
    "rank": 90,
    "score": 0.8657,
    "role": "Data Scientist",
    "company": "Yellow.ai",
    "experience": 4,
    "tier": 5,
    "skills": [
      "Python",
      "QLoRA",
      "Reinforcement Learning"
    ]
  },
  {
    "id": "CAND_0053591",
    "rank": 91,
    "score": 0.8656,
    "role": "AI Engineer",
    "company": "Ola",
    "experience": 5,
    "tier": 5,
    "skills": [
      "Sentence Transformers",
      "Embeddings",
      "Statistical Modeling"
    ]
  },
  {
    "id": "CAND_0020991",
    "rank": 92,
    "score": 0.8651,
    "role": "Junior ML Engineer",
    "company": "PhonePe",
    "experience": 5,
    "tier": 5,
    "skills": [
      "Python",
      "Statistical Modeling",
      "Computer Vision"
    ]
  },
  {
    "id": "CAND_0000273",
    "rank": 93,
    "score": 0.8648,
    "role": "ML Engineer",
    "company": "BYJU'S",
    "experience": 6,
    "tier": 5,
    "skills": [
      "Weights & Biases",
      "Object Detection",
      "Forecasting"
    ]
  },
  {
    "id": "CAND_0081053",
    "rank": 94,
    "score": 0.8646,
    "role": "NLP Engineer",
    "company": "Glance",
    "experience": 5,
    "tier": 5,
    "skills": [
      "Machine Learning",
      "Image Classification",
      "QLoRA"
    ]
  },
  {
    "id": "CAND_0083879",
    "rank": 95,
    "score": 0.8641,
    "role": "Machine Learning Engineer",
    "company": "Ola",
    "experience": 7,
    "tier": 5,
    "skills": [
      "Hugging Face Transformers",
      "Prompt Engineering",
      "Fine-tuning LLMs"
    ]
  },
  {
    "id": "CAND_0000031",
    "rank": 96,
    "score": 0.8629,
    "role": "Recommendation Systems Engineer",
    "company": "Swiggy",
    "experience": 6,
    "tier": 5,
    "skills": [
      "MLflow",
      "Image Classification",
      "Embeddings"
    ]
  },
  {
    "id": "CAND_0096142",
    "rank": 97,
    "score": 0.8626,
    "role": "Applied ML Engineer",
    "company": "upGrad",
    "experience": 5,
    "tier": 5,
    "skills": [
      "Weights & Biases",
      "BentoML",
      "RAG"
    ]
  },
  {
    "id": "CAND_0092989",
    "rank": 98,
    "score": 0.8606,
    "role": "Data Scientist",
    "company": "PharmEasy",
    "experience": 6,
    "tier": 5,
    "skills": [
      "GANs",
      "Object Detection",
      "Statistical Modeling"
    ]
  },
  {
    "id": "CAND_0028422",
    "rank": 99,
    "score": 0.8603,
    "role": "Junior ML Engineer",
    "company": "Yellow.ai",
    "experience": 6,
    "tier": 5,
    "skills": [
      "YOLO",
      "Learning to Rank",
      "Pinecone"
    ]
  },
  {
    "id": "CAND_0016659",
    "rank": 100,
    "score": 0.8601,
    "role": "ML Engineer",
    "company": "Glance",
    "experience": 4,
    "tier": 5,
    "skills": [
      "scikit-learn",
      "Weaviate",
      "Information Retrieval"
    ]
  }
];
