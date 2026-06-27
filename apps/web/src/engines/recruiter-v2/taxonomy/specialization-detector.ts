// Skill array → Specialization label detector.
// Used by Stage 12 (Recruiter Signals).

// Keyword groups that map to specialization labels.
// Keys are keyword strings; values are the specialization label.
export const SPECIALIZATION_KEYWORD_MAP: Array<{
  keywords: string[];
  label: string;
}> = [
  // TODO: populate from the spec
  // { keywords: ["ndcg", "bm25", "faiss", "retrieval", "elasticsearch"], label: "Information Retrieval" },
  // { keywords: ["recommendation", "collaborative filtering", "matrix factorization"], label: "Recommendation Systems" },
  // { keywords: ["nlp", "transformers", "bert", "llm", "gpt"], label: "NLP" },
  // { keywords: ["cnn", "resnet", "yolo", "segmentation", "object detection"], label: "Computer Vision" },
  // { keywords: ["mlflow", "ray serve", "kubeflow", "model monitoring"], label: "MLOps" },
  // { keywords: ["flink", "kafka", "spark streaming", "data pipeline"], label: "Data Engineering" },
];

// All skill arrays passed as a flat list for matching.
export interface AllSkillArrays {
  technical_skills: string[];
  tools: string[];
  frameworks: string[];
  cloud_platforms: string[];
  databases: string[];
  domain_keywords: string[];
}

// Detect specializations from all skill arrays.
// Returns an array of specialization labels (may be empty).
export function detectSpecializations(skills: AllSkillArrays): string[] {
  // TODO: implement
  //   1. flatten all skill arrays into one list, lower-cased
  //   2. for each entry in SPECIALIZATION_KEYWORD_MAP:
  //      if any keyword appears in the flat list → add label to results
  //   3. deduplicate and return
  void skills;
  return [];
}

// Compute domain_concentration = max(domain_skills in one label) / total_skills.
// Used by Stage 11 (specialization_fragility_risk) and Stage 12 (domain_posture).
export function computeDomainConcentration(skills: AllSkillArrays): number {
  // TODO: implement
  void skills;
  return 0;
}
