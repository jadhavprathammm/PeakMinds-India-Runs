// ── Types ─────────────────────────────────────────────────────────────────────

export interface StrengthItem {
  title: string;
  explanation: string;
  signal: string;
}

export interface MissingSignalItem {
  title: string;
  explanation: string;
  severity: "high" | "medium";
}

export interface RecruiterView {
  verdict: string;
  likelihood: "high" | "medium" | "low";
  positives: string[];
  concerns: string[];
}

export interface ImprovementPlan {
  immediate: string[];
  sevenDay: string[];
  thirtyDay: string[];
}

export interface ResumeScores {
  hiringReadiness: number;
  roleAlignment: number;
  experienceDepth: number;
  evidenceQuality: number;
}

export interface ResumeAnalysis {
  scores: ResumeScores;
  strengths: StrengthItem[];
  missingSignals: MissingSignalItem[];
  recruiterView: RecruiterView;
  improvements: ImprovementPlan;
}

// ── Signal taxonomy ────────────────────────────────────────────────────────────

const ML_FRAMEWORKS = [
  "pytorch", "tensorflow", "keras", "scikit-learn", "sklearn",
  "jax", "lightgbm", "xgboost", "catboost", "mxnet", "caffe",
];

const LLM_KEYWORDS = [
  "llm", "large language model", "gpt", "bert", "transformer",
  "embedding", "rag", "retrieval-augmented", "fine-tun", "lora",
  "qlora", "langchain", "vector database", "vector store",
  "semantic search", "sentence-transformer", "huggingface", "hugging face",
];

const ML_TECHNIQUES = [
  "neural network", "deep learning", "machine learning", "nlp",
  "natural language", "computer vision", "recommendation", "ranking",
  "information retrieval", "classification", "clustering",
  "reinforcement learning", "time series", "anomaly detection",
  "generative", "diffusion", "object detection", "segmentation",
];

const EVAL_METRICS = [
  "ndcg", "mrr", "map@", "precision@", "recall@", "f1", "auc",
  "bleu", "rouge", "perplexity", "a/b test", "ab test", "ablation",
  "offline eval", "online eval", "statistical significance",
  "p-value", "confidence interval", "baseline comparison",
];

const PRODUCTION_KEYWORDS = [
  "production", "deployed", "shipped", "serving", "kubernetes", "k8s",
  "docker", "mlops", "ci/cd", "real-time inference", "model monitoring",
  "feature store", "airflow", "kubeflow", "mlflow", "shadow mode", "canary",
];

const CLOUD_INFRA = [
  "aws", "gcp", "azure", "ec2", "s3", "sagemaker", "vertex ai",
  "databricks", "apache spark", "kafka", "redis", "elasticsearch",
  "bigquery", "snowflake", "emr", "glue",
];

const SCALE_KEYWORDS = [
  "million users", "million requests", "billion", "at scale",
  "high traffic", "distributed system", "microservice",
  "low latency", "throughput", "qps", "tps", "rps", "high availability",
];

const OWNERSHIP_KEYWORDS = [
  "led ", "owned ", "drove ", "designed ", "architected",
  "built from scratch", "founded", "launched", "pioneered",
  "spearheaded", "established", "created the",
];

const LEADERSHIP_KEYWORDS = [
  "managed", "mentored", "team of", "cross-functional",
  "tech lead", "principal engineer", "staff engineer", "head of ml",
  "engineering manager", "supervised",
];

const DATA_KEYWORDS = [
  "pandas", "numpy", "sql", "spark", "hadoop", "hive", "dbt",
  "data pipeline", "etl", "feature engineering",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function detect(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw));
}

function countImpactMetrics(text: string): number {
  const patterns = [
    /\d+(?:\.\d+)?%/g,
    /\$\d+(?:\.\d+)?[km]?(?:\s+(?:million|billion|thousand))?/gi,
    /\d+[km]?\s*(?:users?|customers?|requests?|queries|rpm|qps|tps|rps|transactions?)/gi,
    /\d+x\s+(?:faster|improvement|speedup|reduction|better)/gi,
    /(?:reduced?|improved?|increased?|decreased?|saved?)\s+(?:by\s+)?\d+/gi,
    /(?:serves?|serving|handled?|process(?:ing|ed)?)\s+\d+/gi,
  ];
  const matches = new Set<string>();
  for (const pattern of patterns) {
    for (const m of text.match(pattern) ?? []) {
      matches.add(m.toLowerCase().trim());
    }
  }
  return matches.size;
}

function detectYears(text: string): number {
  const patterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp|work|professional|industry)/gi,
    /(\d+)\+?\s*years?\s*(?:in\s*)?(?:ml|ai|software|data science|engineering|tech)/gi,
  ];
  let max = 0;
  for (const p of patterns) {
    let m: RegExpExecArray | null;
    p.lastIndex = 0;
    while ((m = p.exec(text)) !== null) {
      max = Math.max(max, parseInt(m[1]));
    }
  }
  return max;
}

function inferSeniority(text: string): number {
  const lower = text.toLowerCase();
  if (["principal", "staff ", "director", "vp of", "head of"].some((s) => lower.includes(s))) return 4;
  if (["tech lead", "engineering lead", "team lead"].some((s) => lower.includes(s))) return 3;
  if (["senior", "sr.", "sr "].some((s) => lower.includes(s))) return 2;
  if (["junior", "jr.", "entry level", "entry-level"].some((s) => lower.includes(s))) return 0;
  return 1;
}

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreRoleAlignment(
  frameworks: string[], llm: string[], techniques: string[],
  eval_: string[], data: string[]
): number {
  let s = 0;
  s += Math.min(40, frameworks.length * 9);
  s += Math.min(20, llm.length * 5);
  s += Math.min(20, techniques.length * 4);
  s += Math.min(12, eval_.length * 5);
  s += Math.min(8, data.length * 2);
  return clamp(s);
}

function scoreExperienceDepth(
  years: number, seniority: number, ownership: string[], leadership: string[]
): number {
  let s = 0;
  s += Math.min(40, years * 6);
  s += seniority * 10;
  s += Math.min(20, ownership.length * 5);
  s += Math.min(15, leadership.length * 4);
  return clamp(s);
}

function scoreEvidenceQuality(
  impactCount: number, production: string[], cloud: string[], scale: string[]
): number {
  let s = 0;
  s += Math.min(40, impactCount * 7);
  s += Math.min(25, production.length * 5);
  s += Math.min(20, cloud.length * 4);
  s += Math.min(15, scale.length * 5);
  return clamp(s);
}

// ── Strengths detection ───────────────────────────────────────────────────────

interface DetectedSignals {
  frameworks: string[];
  llm: string[];
  techniques: string[];
  eval_: string[];
  production: string[];
  cloud: string[];
  scale: string[];
  ownership: string[];
  leadership: string[];
  data: string[];
  impactCount: number;
  years: number;
}

function detectStrengths(d: DetectedSignals): StrengthItem[] {
  const out: StrengthItem[] = [];

  if (d.production.length >= 3) {
    out.push({
      title: "Strong Production ML Experience",
      explanation: `Clear evidence of deploying models to production. Keywords like "${d.production.slice(0, 3).join('", "')}" indicate real-world ML deployment — a critical differentiating signal for senior ML engineering roles.`,
      signal: d.production.slice(0, 3).join(", "),
    });
  }

  if (d.frameworks.length >= 3) {
    out.push({
      title: "Deep Framework Expertise",
      explanation: `Multi-framework proficiency across ${d.frameworks.slice(0, 4).join(", ")} signals genuine engineering depth rather than surface familiarity with a single tool.`,
      signal: d.frameworks.slice(0, 4).join(", "),
    });
  } else if (d.frameworks.length >= 1) {
    out.push({
      title: "Core ML Framework Knowledge",
      explanation: `Demonstrates proficiency in ${d.frameworks.join(", ")}. Framework knowledge is a baseline expectation for ML engineering roles.`,
      signal: d.frameworks.join(", "),
    });
  }

  if (d.llm.length >= 3) {
    out.push({
      title: "LLM & Transformer Expertise",
      explanation: `Strong signals of modern LLM/transformer experience: ${d.llm.slice(0, 4).join(", ")}. Highly valued in current ML hiring — especially for roles involving generative AI or semantic search.`,
      signal: d.llm.slice(0, 4).join(", "),
    });
  }

  if (d.eval_.length >= 2) {
    out.push({
      title: "Evaluation Methodology Rigor",
      explanation: `References specific evaluation metrics and methodology: ${d.eval_.slice(0, 3).join(", ")}. This distinguishes candidates who measure outcomes from those who only describe what they built.`,
      signal: d.eval_.slice(0, 3).join(", "),
    });
  }

  if (d.impactCount >= 4) {
    out.push({
      title: "Quantified Impact Evidence",
      explanation: `Resume contains ${d.impactCount} quantified outcomes (percentages, user counts, performance improvements). Specific numbers transform claims into proof — the strongest differentiator in a high-volume pool.`,
      signal: `${d.impactCount} quantified metrics detected`,
    });
  }

  if (d.scale.length >= 2) {
    out.push({
      title: "Large-Scale Systems Experience",
      explanation: `Signals of high-scale system experience: ${d.scale.slice(0, 3).join(", ")}. Scale context communicates the complexity of the work and is heavily weighted in senior evaluations.`,
      signal: d.scale.slice(0, 3).join(", "),
    });
  }

  if (d.ownership.length >= 3) {
    out.push({
      title: "Strong Ownership Language",
      explanation: `Clear ownership signals throughout: ${d.ownership.slice(0, 4).join(", ")}. Ownership language distinguishes candidates who drive outcomes from those who execute tasks.`,
      signal: d.ownership.slice(0, 4).join(", "),
    });
  }

  if (d.cloud.length >= 3) {
    out.push({
      title: "Cloud & Infrastructure Depth",
      explanation: `Demonstrates experience across ${d.cloud.slice(0, 4).join(", ")}. Cloud infrastructure proficiency is now a baseline expectation for production ML engineering roles.`,
      signal: d.cloud.slice(0, 4).join(", "),
    });
  }

  if (d.techniques.length >= 5) {
    out.push({
      title: "Broad ML Domain Coverage",
      explanation: `Experience across ${d.techniques.length} ML domains including ${d.techniques.slice(0, 3).join(", ")}. Breadth signals adaptability across problem types.`,
      signal: d.techniques.slice(0, 3).join(", "),
    });
  }

  return out.slice(0, 5);
}

// ── Missing signals ───────────────────────────────────────────────────────────

function detectMissing(d: DetectedSignals): MissingSignalItem[] {
  const out: MissingSignalItem[] = [];

  if (d.impactCount < 2) {
    out.push({
      title: "Impact Metrics Missing",
      explanation: "The resume describes responsibilities but rarely quantifies outcomes. Recruiters and ranking systems weight measurable impact heavily. Add specific numbers: 'reduced inference latency by 40%', 'improved NDCG@10 from 0.71 to 0.86', 'model serves 2M requests/day'.",
      severity: "high",
    });
  }

  if (d.eval_.length === 0) {
    out.push({
      title: "No Evaluation Methodology Stated",
      explanation: "There is no mention of how model quality was measured. Strong ML engineers define metrics upfront and track them rigorously. Even one metric with context (NDCG@10, F1, AUC) signals evaluation maturity that most candidates lack.",
      severity: "high",
    });
  }

  if (d.production.length < 2) {
    out.push({
      title: "Production Deployment Evidence Weak",
      explanation: "Little evidence of models deployed to real production systems. In a pool of 100K+ applicants, roles filter heavily on production exposure. Signals like 'deployed to Kubernetes', 'model serving via REST API', or 'monitored with Grafana' separate deployed engineers from researchers.",
      severity: "high",
    });
  }

  if (d.ownership.length < 2) {
    out.push({
      title: "Weak Ownership Signals",
      explanation: "The resume uses passive or vague language ('contributed to', 'worked on', 'involved in'). PeakMinds looks for ownership: 'led the design of', 'owned end-to-end', 'built from scratch'. Vague contributions suggest a supporting role.",
      severity: "medium",
    });
  }

  if (d.scale.length === 0) {
    out.push({
      title: "No Scale Context",
      explanation: "The resume does not communicate the scale of the systems built. Were these models serving 100 users or 10 million? Scale signals like 'served 5M DAU' or 'processed 1TB/day' contextualize work complexity and help rank candidates.",
      severity: "medium",
    });
  }

  if (d.cloud.length === 0) {
    out.push({
      title: "No Cloud or Infrastructure Signals",
      explanation: "There is no mention of cloud platforms or ML infrastructure. Nearly all production ML runs on AWS, GCP, or Azure. The absence of these signals may suggest limited infrastructure exposure — increasingly required for senior roles.",
      severity: "medium",
    });
  }

  return out.slice(0, 5);
}

// ── Recruiter view ────────────────────────────────────────────────────────────

function buildRecruiterView(scores: ResumeScores, d: DetectedSignals): RecruiterView {
  const { hiringReadiness } = scores;

  let verdict: string;
  let likelihood: "high" | "medium" | "low";

  if (hiringReadiness >= 80) {
    verdict = "Strong Shortlisting Candidate";
    likelihood = "high";
  } else if (hiringReadiness >= 65) {
    verdict = "Competitive for Mid-Level Roles";
    likelihood = "medium";
  } else if (hiringReadiness >= 48) {
    verdict = "Needs Stronger Evidence";
    likelihood = "medium";
  } else {
    verdict = "Requires Significant Strengthening";
    likelihood = "low";
  }

  const positives: string[] = [];
  const concerns: string[] = [];

  if (d.frameworks.length >= 2)
    positives.push(`Clear ML specialization with ${d.frameworks.slice(0, 3).join(", ")} — passes initial screening filters`);
  if (d.production.length >= 2)
    positives.push("Evidence of production ML deployment — differentiates from research-only candidates");
  if (d.eval_.length >= 1)
    positives.push("Evaluation methodology mentioned — signals engineering maturity");
  if (d.impactCount >= 3)
    positives.push(`${d.impactCount} quantified outcomes — strongly differentiating in a high-volume pool`);
  if (positives.length === 0)
    positives.push("ML background is present and will pass keyword screening");

  if (d.impactCount < 2)
    concerns.push("Lack of quantified impact makes it hard to rank against candidates with measurable outcomes");
  if (d.production.length < 2)
    concerns.push("Limited production evidence — may be screened out in favour of candidates with deployed ML experience");
  if (d.ownership.length < 2)
    concerns.push("Ownership language is weak — may be perceived as an IC without initiative signals");
  if (d.eval_.length === 0)
    concerns.push("No evaluation rigor mentioned — senior roles expect candidates who define and track metrics");
  if (concerns.length === 0)
    concerns.push("Resume is competitive; adding scale context and impact metrics would further strengthen it");

  return {
    verdict, likelihood,
    positives: positives.slice(0, 3),
    concerns: concerns.slice(0, 3),
  };
}

// ── Improvement plan ──────────────────────────────────────────────────────────

function buildImprovements(d: DetectedSignals): ImprovementPlan {
  const immediate: string[] = [];
  const sevenDay: string[] = [];
  const thirtyDay: string[] = [];

  if (d.impactCount < 3)
    immediate.push("Add one quantified metric to each experience bullet: latency improvement, accuracy gain, or business impact");
  if (d.ownership.length < 2)
    immediate.push("Replace passive language ('contributed to', 'worked on') with ownership verbs: 'led', 'built', 'owned', 'designed'");
  immediate.push("Add a 2–3 line technical summary at the top front-loading your strongest ML signals");
  if (d.eval_.length === 0)
    immediate.push("For each model, add the evaluation metric used and the result achieved — even one example changes recruiter perception");

  sevenDay.push("Document evaluation methodology for each model: metric, baseline, and outcome achieved");
  sevenDay.push("Add scale context to each role: number of users served, inference volume, data processed per day");
  if (d.production.length < 2)
    sevenDay.push("Add a Systems or Infrastructure section listing cloud platforms, orchestration tools, and deployment methods");
  sevenDay.push("Create a Projects section with 2–3 standalone projects showing decision-making process end-to-end");

  thirtyDay.push("Publish one technical writeup (blog post or GitHub README) demonstrating specialization depth — link it prominently");
  thirtyDay.push("Complete one end-to-end project: data → model → evaluation → deployment → monitoring. Make it public.");
  thirtyDay.push("Identify the largest gap in your experience and close it with a targeted project, then add it to your resume");

  return { immediate, sevenDay, thirtyDay };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function analyzeResume(text: string): ResumeAnalysis {
  const d: DetectedSignals = {
    frameworks: detect(text, ML_FRAMEWORKS),
    llm: detect(text, LLM_KEYWORDS),
    techniques: detect(text, ML_TECHNIQUES),
    eval_: detect(text, EVAL_METRICS),
    production: detect(text, PRODUCTION_KEYWORDS),
    cloud: detect(text, CLOUD_INFRA),
    scale: detect(text, SCALE_KEYWORDS),
    ownership: detect(text, OWNERSHIP_KEYWORDS),
    leadership: detect(text, LEADERSHIP_KEYWORDS),
    data: detect(text, DATA_KEYWORDS),
    impactCount: countImpactMetrics(text),
    years: detectYears(text),
  };

  const seniority = inferSeniority(text);
  const roleAlignment = scoreRoleAlignment(d.frameworks, d.llm, d.techniques, d.eval_, d.data);
  const experienceDepth = scoreExperienceDepth(d.years, seniority, d.ownership, d.leadership);
  const evidenceQuality = scoreEvidenceQuality(d.impactCount, d.production, d.cloud, d.scale);
  const hiringReadiness = clamp(
    Math.round(0.35 * roleAlignment + 0.25 * experienceDepth + 0.25 * evidenceQuality + 0.15 * (roleAlignment + evidenceQuality) / 2)
  );

  const scores: ResumeScores = { hiringReadiness, roleAlignment, experienceDepth, evidenceQuality };

  return {
    scores,
    strengths: detectStrengths(d),
    missingSignals: detectMissing(d),
    recruiterView: buildRecruiterView(scores, d),
    improvements: buildImprovements(d),
  };
}

// ── Sample report ─────────────────────────────────────────────────────────────
// Realistic mid-to-senior ML engineer profile. Shown before upload.

export const SAMPLE_ANALYSIS: ResumeAnalysis = {
  scores: {
    hiringReadiness: 74,
    roleAlignment: 82,
    experienceDepth: 71,
    evidenceQuality: 58,
  },
  strengths: [
    {
      title: "Strong Production ML Experience",
      explanation: "Resume shows clear evidence of deploying models to production environments. Keywords like 'deployed', 'serving', and 'real-time inference' indicate hands-on ML deployment — a critical differentiating signal for ML engineering roles.",
      signal: "deployed, serving, real-time inference",
    },
    {
      title: "Deep Framework Expertise",
      explanation: "Demonstrates proficiency in PyTorch, TensorFlow, and scikit-learn. Multi-framework experience signals genuine engineering depth rather than surface-level exposure to a single tool.",
      signal: "PyTorch, TensorFlow, scikit-learn",
    },
    {
      title: "NLP & Transformer Experience",
      explanation: "Clear NLP specialization with transformer-based model experience. BERT fine-tuning and text classification work suggests applied NLP beyond tutorials — relevant for a wide range of current ML roles.",
      signal: "NLP, BERT, transformer, fine-tuning",
    },
    {
      title: "Cloud Infrastructure Exposure",
      explanation: "Demonstrates experience with AWS cloud services for ML workloads. Cloud proficiency is now a baseline expectation for production ML engineering roles.",
      signal: "AWS, S3, SageMaker",
    },
  ],
  missingSignals: [
    {
      title: "Impact Metrics Missing",
      explanation: "The resume describes what was built but rarely quantifies the outcome. PeakMinds and human recruiters weight measurable impact heavily. Add specific numbers: 'reduced inference latency by 40%', 'improved NDCG@10 from 0.71 to 0.86', 'model serves 2M requests/day'.",
      severity: "high",
    },
    {
      title: "No Evaluation Methodology Stated",
      explanation: "There is no mention of how model quality was measured. Strong ML engineers define metrics upfront. Even one metric with context — NDCG@10, F1, AUC — signals evaluation maturity that most candidates lack.",
      severity: "high",
    },
    {
      title: "Weak Ownership Signals",
      explanation: "The resume uses 'contributed to' and 'worked on' frequently. PeakMinds looks for ownership: 'led the design of', 'owned end-to-end', 'built from scratch'. Vague contributions suggest a supporting role.",
      severity: "medium",
    },
    {
      title: "No Scale Context",
      explanation: "The resume does not communicate the scale of the systems built. Scale signals like 'served 5M DAU' or 'processed 500GB/day' significantly contextualize work complexity in a competitive pool.",
      severity: "medium",
    },
  ],
  recruiterView: {
    verdict: "Competitive for Mid-Level Roles",
    likelihood: "medium",
    positives: [
      "Clear ML specialization with production exposure — passes initial screening filters",
      "Framework breadth (PyTorch, TensorFlow) signals genuine hands-on experience",
      "NLP depth is highly relevant to current ML hiring demand",
    ],
    concerns: [
      "Lack of quantified impact makes it hard to rank against candidates showing measurable outcomes",
      "Ownership language is weak — may be perceived as an individual contributor without initiative signals",
      "No evaluation rigor mentioned — senior roles expect candidates who define and track metrics",
    ],
  },
  improvements: {
    immediate: [
      "Add one quantified metric to each experience bullet: latency improvement, accuracy gain, or business impact",
      "Replace 'contributed to' and 'worked on' with ownership verbs: 'led', 'built', 'owned', 'designed'",
      "Add a 2–3 line technical summary at the top front-loading your strongest ML signals",
      "For each model project, add the evaluation metric used and the result achieved",
    ],
    sevenDay: [
      "Document evaluation methodology for each model: metric, baseline, and what you achieved",
      "Add scale context to each role: inference volume, users served, data processed per day",
      "Create a Projects section with 2–3 standalone projects showing decision-making end-to-end",
      "List cloud platforms, orchestration tools, and deployment methods used at each company",
    ],
    thirtyDay: [
      "Publish one technical writeup (blog post or GitHub README) demonstrating depth in your specialization",
      "Complete one end-to-end project: data → model → evaluation → deployment → monitoring. Make it public.",
      "Identify your largest experience gap, close it with a targeted project, then add it to your resume",
    ],
  },
};
