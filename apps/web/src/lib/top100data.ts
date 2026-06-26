// All 100 ranked candidates — sourced from services/ranking-engine/submissions/team_redrob.csv
// scores are normalized to a 0-100 display scale; tiers match the CSV reasoning labels.

export type Tier = "Top" | "Strong" | "Solid";

export type RankedEntry = {
  id: string;
  rank: number;
  score: number;
  role: string;
  company: string;
  experience: number;
  tier: Tier;
  skills: string[];
};

function s(rank: number): number {
  const top15 = [98, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83];
  if (rank <= 15) return top15[rank - 1];
  return Math.round(82 - (rank - 16) * (10 / 84));
}

function t(rank: number): Tier {
  if (rank <= 20) return "Top";
  if (rank <= 60) return "Strong";
  return "Solid";
}

function roleSkills(role: string): string[] {
  if (role.includes("NLP")) return ["NLP", "Python", "Transformers"];
  if (role.includes("Recommendation")) return ["RecSys", "Python"];
  if (role.includes("Search")) return ["Search", "Elasticsearch", "Python"];
  if (role.includes("Applied Scientist")) return ["Statistics", "Python", "Research"];
  if (role.includes("Senior Data Scientist") || role.includes("Data Scientist")) return ["Python", "Statistics", "ML"];
  if (role.includes("Research Engineer")) return ["Research", "PyTorch", "Python"];
  if (role.includes("Staff Machine Learning")) return ["Production ML", "Python", "Scale"];
  if (role.includes("Senior Machine Learning")) return ["Production ML", "Python"];
  if (role.includes("Machine Learning Engineer")) return ["Production ML", "Python"];
  if (role.includes("Software Engineer (ML)")) return ["Python", "System Design", "Production ML"];
  if (role.includes("Applied ML")) return ["Python", "ML Systems", "MLOps"];
  if (role.includes("AI Specialist")) return ["Python", "Deep Learning", "ML"];
  if (role.includes("AI Engineer")) return ["Python", "MLOps"];
  if (role.includes("AI Research")) return ["Research", "PyTorch", "Python"];
  return ["Python", "Machine Learning"];
}

type Raw = [string, number, string, string, number, string[]?];

const RAW: Raw[] = [
  ["CAND_0046525",  1, "Senior Machine Learning Engineer",      "Genpact AI",    6],
  ["CAND_0011687",  2, "Senior NLP Engineer",                   "Niramai",       8],
  ["CAND_0072688",  3, "Data Scientist",                        "Niramai",       7],
  ["CAND_0043860",  4, "Junior ML Engineer",                    "Aganitha",      6],
  ["CAND_0004402",  5, "AI Research Engineer",                  "Yellow.ai",     6],
  ["CAND_0053605",  6, "Senior Software Engineer (ML)",         "Verloop.io",    7],
  ["CAND_0036184",  7, "Recommendation Systems Engineer",       "CRED",          6],
  ["CAND_0048558",  8, "Data Scientist",                        "Rephrase.ai",   7],
  ["CAND_0070525",  9, "Senior Software Engineer (ML)",         "Mad Street Den",5, ["Statistical Modeling", "Python", "LLMs"]],
  ["CAND_0052682", 10, "NLP Engineer",                         "Aganitha",      7],
  ["CAND_0064326", 11, "Search Engineer",                      "Sarvam AI",     8],
  ["CAND_0067535", 12, "Junior ML Engineer",                   "Locobuzz",      7],
  ["CAND_0008295", 13, "AI Research Engineer",                 "Razorpay",      6],
  ["CAND_0018499", 14, "Senior Machine Learning Engineer",     "Zomato",        7],
  ["CAND_0073007", 15, "AI Specialist",                        "Aganitha",      6],
  ["CAND_0077337", 16, "Staff Machine Learning Engineer",      "Paytm",         7],
  ["CAND_0032271", 17, "AI Research Engineer",                 "Mad Street Den",7],
  ["CAND_0050454", 18, "AI Engineer",                          "Rephrase.ai",   7],
  ["CAND_0088025", 19, "Staff Machine Learning Engineer",      "Yellow.ai",     9],
  ["CAND_0092706", 20, "AI Research Engineer",                 "Unacademy",     6],
  ["CAND_0011327", 21, "AI Research Engineer",                 "Krutrim",       6],
  ["CAND_0006418", 22, "Machine Learning Engineer",            "Verloop.io",    6],
  ["CAND_0067866", 23, "Senior Software Engineer (ML)",        "Tech Mahindra", 6, ["Weights & Biases", "Qdrant", "Elasticsearch"]],
  ["CAND_0069905", 24, "Applied ML Engineer",                  "Sarvam AI",     7],
  ["CAND_0018722", 25, "Recommendation Systems Engineer",      "Saarthi.ai",    7],
  ["CAND_0010149", 26, "ML Engineer",                          "Glance",        7],
  ["CAND_0062247", 27, "AI Engineer",                          "Google",        7],
  ["CAND_0052328", 28, "Recommendation Systems Engineer",      "Amazon",        6],
  ["CAND_0018549", 29, "Recommendation Systems Engineer",      "Uber",          7],
  ["CAND_0018013", 30, "AI Specialist",                        "Sarvam AI",     7],
  ["CAND_0068932", 31, "ML Engineer",                          "Krutrim",       5, ["Reinforcement Learning", "OpenSearch", "CNN"]],
  ["CAND_0079387", 32, "AI Engineer",                          "Microsoft",     7],
  ["CAND_0033179", 33, "AI Research Engineer",                 "Wipro",         7, ["OpenSearch", "Fine-tuning LLMs", "Information Retrieval"]],
  ["CAND_0098454", 34, "AI Specialist",                        "Meesho",        7],
  ["CAND_0046132", 35, "AI Research Engineer",                 "Verloop.io",    4, ["Time Series", "MLflow", "MLOps"]],
  ["CAND_0083852", 36, "Data Scientist",                       "Mad Street Den",6, ["Sentence Transformers", "Prompt Engineering", "Qdrant"]],
  ["CAND_0024878", 37, "AI Specialist",                        "HCL",           6, ["Prompt Engineering", "MLOps", "PEFT"]],
  ["CAND_0061257", 38, "Staff Machine Learning Engineer",      "LinkedIn",      8],
  ["CAND_0010257", 39, "Senior Data Scientist",                "Google",        6],
  ["CAND_0044222", 40, "AI Engineer",                          "PolicyBazaar",  8],
  ["CAND_0078002", 41, "Machine Learning Engineer",            "Meta",          6],
  ["CAND_0010603", 42, "ML Engineer",                          "BYJU'S",        5, ["OpenSearch", "Forecasting", "Deep Learning"]],
  ["CAND_0046064", 43, "Senior NLP Engineer",                  "Salesforce",    9],
  ["CAND_0008425", 44, "Senior NLP Engineer",                  "Ola",           8],
  ["CAND_0081852", 45, "Senior Data Scientist",                "Mad Street Den",6],
  ["CAND_0070514", 46, "AI Specialist",                        "Glance",        6, ["OpenSearch", "Kubeflow", "BentoML"]],
  ["CAND_0064256", 47, "Junior ML Engineer",                   "BYJU'S",        6],
  ["CAND_0055905", 48, "Senior Machine Learning Engineer",     "Flipkart",      8],
  ["CAND_0090155", 49, "ML Engineer",                          "Swiggy",        6],
  ["CAND_0032887", 50, "ML Engineer",                          "Niramai",       6],
  ["CAND_0079064", 51, "Senior Data Scientist",                "Niramai",       5],
  ["CAND_0017960", 52, "Recommendation Systems Engineer",      "Nykaa",         8],
  ["CAND_0099806", 53, "AI Engineer",                          "Mad Street Den",5],
  ["CAND_0027691", 54, "NLP Engineer",                         "Haptik",        6],
  ["CAND_0053527", 55, "Junior ML Engineer",                   "PhonePe",       7],
  ["CAND_0052335", 56, "Applied ML Engineer",                  "Aganitha",      6],
  ["CAND_0073883", 57, "AI Specialist",                        "Krutrim",       5, ["PEFT", "Forecasting", "Image Classification"]],
  ["CAND_0096104", 58, "AI Specialist",                        "Yellow.ai",     7],
  ["CAND_0041669", 59, "Recommendation Systems Engineer",      "CRED",          8],
  ["CAND_0075249", 60, "Applied ML Engineer",                  "Zomato",        6],
  ["CAND_0000422", 61, "AI Research Engineer",                 "Haptik",        6],
  ["CAND_0035879", 62, "AI Research Engineer",                 "Krutrim",       4, ["Speech Recognition", "Diffusion Models", "Python"]],
  ["CAND_0026942", 63, "Junior ML Engineer",                   "Verloop.io",    6],
  ["CAND_0098846", 64, "AI Engineer",                          "upGrad",        8],
  ["CAND_0076163", 65, "NLP Engineer",                         "Ola",           7],
  ["CAND_0041918", 66, "AI Specialist",                        "Glance",        6],
  ["CAND_0049540", 67, "ML Engineer",                          "Saarthi.ai",    7],
  ["CAND_0099751", 68, "Junior ML Engineer",                   "Observe.AI",    6],
  ["CAND_0037566", 69, "Machine Learning Engineer",            "LinkedIn",      7],
  ["CAND_0050876", 70, "Applied ML Engineer",                  "Freshworks",    6],
  ["CAND_0075574", 71, "Machine Learning Engineer",            "Haptik",        6],
  ["CAND_0061265", 72, "Recommendation Systems Engineer",      "Zoho",          7],
  ["CAND_0011162", 73, "Recommendation Systems Engineer",      "upGrad",        6],
  ["CAND_0024147", 74, "ML Engineer",                          "Ola",           6],
  ["CAND_0027801", 75, "NLP Engineer",                         "InMobi",        7],
  ["CAND_0070398", 76, "Machine Learning Engineer",            "Genpact AI",    7],
  ["CAND_0091909", 77, "Machine Learning Engineer",            "Rephrase.ai",   7],
  ["CAND_0009691", 78, "Applied ML Engineer",                  "LinkedIn",      6],
  ["CAND_0073504", 79, "Junior ML Engineer",                   "PolicyBazaar",  7],
  ["CAND_0037980", 80, "Senior Applied Scientist",             "Niramai",       9],
  ["CAND_0025640", 81, "AI Research Engineer",                 "HCL",           6, ["Semantic Search", "Elasticsearch", "CNN"]],
  ["CAND_0055960", 82, "AI Specialist",                        "Dream11",       5, ["Machine Learning", "PyTorch", "Reinforcement Learning"]],
  ["CAND_0065195", 83, "Search Engineer",                      "CRED",          5],
  ["CAND_0012837", 84, "Junior ML Engineer",                   "Sarvam AI",     6],
  ["CAND_0049896", 85, "Search Engineer",                      "Unacademy",     7],
  ["CAND_0043829", 86, "AI Research Engineer",                 "Observe.AI",    5, ["Qdrant", "Time Series", "BM25"]],
  ["CAND_0016163", 87, "Applied ML Engineer",                  "Dream11",       7],
  ["CAND_0029367", 88, "Senior Data Scientist",                "Rephrase.ai",   6],
  ["CAND_0010685", 89, "NLP Engineer",                         "Rephrase.ai",   7],
  ["CAND_0030784", 90, "Data Scientist",                       "Yellow.ai",     4, ["Python", "QLoRA", "Reinforcement Learning"]],
  ["CAND_0053591", 91, "AI Engineer",                          "Ola",           5],
  ["CAND_0020991", 92, "Junior ML Engineer",                   "PhonePe",       5, ["Python", "Statistical Modeling", "Computer Vision"]],
  ["CAND_0000273", 93, "ML Engineer",                          "BYJU'S",        6],
  ["CAND_0081053", 94, "NLP Engineer",                         "Glance",        5],
  ["CAND_0083879", 95, "Machine Learning Engineer",            "Ola",           7],
  ["CAND_0000031", 96, "Recommendation Systems Engineer",      "Swiggy",        6],
  ["CAND_0096142", 97, "Applied ML Engineer",                  "upGrad",        5],
  ["CAND_0092989", 98, "Data Scientist",                       "PharmEasy",     6],
  ["CAND_0028422", 99, "Junior ML Engineer",                   "Yellow.ai",     6, ["YOLO", "Learning to Rank", "Pinecone"]],
  ["CAND_0016659",100, "ML Engineer",                          "Glance",        4, ["scikit-learn", "Weaviate", "Information Retrieval"]],
];

export const TOP_100: RankedEntry[] = RAW.map(([id, rank, role, company, experience, explicitSkills]) => ({
  id,
  rank,
  score: s(rank),
  role,
  company,
  experience,
  tier: t(rank),
  skills: explicitSkills ?? roleSkills(role),
}));
