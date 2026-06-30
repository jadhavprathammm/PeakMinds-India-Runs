// Stage 12 — Recruiter Signal Derivation
// No Claude call. Deterministic classification over all stage outputs.
// Fields owned: seniority_level, primary_role_family, secondary_role_families,
//               role_family_confidence, specializations, is_career_changer,
//               has_pre_llm_depth, career_trajectory, domain_posture, profile_completeness.

import type {
  IdentityOutput,
  ExperienceOutput,
  SkillsOutput,
  EvidenceOutput,
  RecruiterSignalsOutput,
} from "@/engines/shared/types/stage-outputs";
import type { SeniorityLevel, RoleFamily, DomainPosture, CareerDirection } from "@/engines/shared/types/enums";
import type { CareerTrajectory, OwnershipSignals, RoleEntry } from "@/engines/shared/types/sub-types";
import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";

// ─── Helpers ────────────────────────────────────────────────────────────────────

const SENIORITY_ORDER: SeniorityLevel[] = [
  "intern",
  "junior",
  "mid",
  "senior",
  "staff",
  "principal",
];

const ROLE_FAMILY_ORDER: RoleFamily[] = [
  "ml_engineering",
  "data_science",
  "software_engineering",
  "research",
  "mlops",
  "management",
  "unknown",
];

const GENERIC_SKILLS = new Set([
  "python",
  "javascript",
  "typescript",
  "sql",
  "git",
  "docker",
  "linux",
  "bash",
  "html",
  "css",
  "rest",
  "api",
  "json",
  "yaml",
  "aws",
  "gcp",
  "azure",
  "ci/cd",
  "kubernetes",
  "terraform",
]);

const DOMAIN_SPECIALIZATION_KEYWORDS: Record<string, string[]> = {
  nlp: ["nlp", "natural language processing", "text", "llm", "transformer", "bert", "gpt", "language model", "huggingface", "spacy", "nltk"],
  computer_vision: ["computer vision", "cv", "image", "object detection", "segmentation", "opencv", "yolo", "resnet", "vision transformer", "vit"],
  recsys: ["recommendation", "recsys", "recommender", "ranking", "personalization", "collaborative filtering", "matrix factorization", "embedding"],
  llm: ["llm", "large language model", "gpt", "bert", "transformer", "fine-tuning", "rlhf", "instruction tuning", "prompt engineering"],
  forecasting: ["forecasting", "time series", "prophet", "arima", "seasonal", "demand forecasting"],
  search: ["search", "information retrieval", "elasticsearch", "solr", "ranking", "query understanding", "semantic search"],
  ranking: ["ranking", "learning to rank", "ltr", "xgboost ranking", "lightgbm ranking"],
  fraud_detection: ["fraud", "anomaly detection", "anti-fraud", "risk scoring", "transaction monitoring"],
  mlops: ["mlops", "model deployment", "model serving", "feature store", "model registry", "kubeflow", "mlflow", "airflow", "pipeline"],
  generative_ai: ["generative ai", "diffusion", "stable diffusion", "gan", "vae", "image generation", "text-to-image"],
  reinforcement_learning: ["reinforcement learning", "rl", "bandit", "policy gradient", "q-learning", "actor-critic"],
  speech: ["speech", "asr", "tts", "voice", "audio", "whisper", "speech recognition", "text-to-speech"],
  graphs: ["graph neural network", "gnn", "graph", "node classification", "link prediction", "graph embedding"],
  tabular: ["tabular", "xgboost", "lightgbm", "catboost", "gradient boosting", "structured data"],
};

function clampSeniority(level: SeniorityLevel): SeniorityLevel {
  const idx = SENIORITY_ORDER.indexOf(level);
  if (idx < 0) return "unknown";
  if (idx >= SENIORITY_ORDER.length) return SENIORITY_ORDER[SENIORITY_ORDER.length - 1];
  return SENIORITY_ORDER[idx];
}

function getBaseSeniority(yoe: number): SeniorityLevel {
  if (yoe < 1) return "intern";
  if (yoe < 3) return "junior";
  if (yoe < 6) return "mid";
  if (yoe < 10) return "senior";
  if (yoe < 15) return "staff";
  return "principal";
}

function getTitleBoost(title: string | null): number {
  if (!title) return 0;
  const t = title.toLowerCase();
  if (t.includes("principal")) return 2;
  if (t.includes("staff")) return 1;
  if (t.includes("director") || t.includes("vp ") || t.includes("vice president") || t.includes("head of") || t.includes("cto")) return 3;
  if (t.includes("junior") || t.includes("associate") || t.includes("intern")) return -1;
  return 0;
}

function mapRoleClassToFamily(roleClass: string): RoleFamily {
  switch (roleClass) {
    case "core_ml": return "ml_engineering";
    case "ml_adjacent": return "data_science";
    case "research": return "research";
    case "data_engineering": return "mlops";
    case "management": return "management";
    case "swe_generic": return "software_engineering";
    default: return "unknown";
  }
}

function getSpecializations(domainKeywords: string[]): string[] {
  const scores: Record<string, number> = {};

  for (const kw of domainKeywords) {
    const lower = kw.toLowerCase();
    if (GENERIC_SKILLS.has(lower)) continue;

    for (const [domain, patterns] of Object.entries(DOMAIN_SPECIALIZATION_KEYWORDS)) {
      for (const pattern of patterns) {
        if (lower.includes(pattern)) {
          scores[domain] = (scores[domain] || 0) + 1;
          break;
        }
      }
    }
  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain]) => domain);
}

function computeDomainPosture(
  specializationCount: number,
  uniqueRoleClasses: number,
): DomainPosture {
  if (specializationCount >= 8 && uniqueRoleClasses <= 2) return "specialist";
  if (specializationCount < 4) return "unfocused";
  return "balanced";
}

// ─── Exported Functions ──────────────────────────────────────────────────────

export function computeSeniorityLevel(
  yearsExperience: number,
  currentTitle: string | null,
  ownershipSignals: OwnershipSignals,
  _totalMlMonths: number,
): SeniorityLevel {
  let base = getBaseSeniority(yearsExperience);
  const baseIdx = SENIORITY_ORDER.indexOf(base);

  const titleBoost = getTitleBoost(currentTitle);
  const ownershipBoost =
    ownershipSignals.owned_full_pipeline && ownershipSignals.led_architecture_decisions ? 1 : 0;

  let finalIdx = baseIdx + titleBoost + ownershipBoost;
  finalIdx = Math.max(0, Math.min(SENIORITY_ORDER.length - 1, finalIdx));

  return SENIORITY_ORDER[finalIdx];
}

export function scoreRoleFamilies(
  experience: ExperienceOutput,
  _skills: SkillsOutput,
  _evidence: EvidenceOutput,
): { primary: RoleFamily; secondaries: RoleFamily[]; confidence: number } {
  const scores: Record<RoleFamily, number> = {
    ml_engineering: 0,
    data_science: 0,
    research: 0,
    mlops: 0,
    software_engineering: 0,
    management: 0,
    unknown: 0,
  };

  const currentTitle = experience.role_history[0]?.title ?? "";
  const allTitles = [currentTitle, ...experience.role_history.slice(1).map((r) => r.title)].filter(Boolean);

  // Title matching
  for (const title of allTitles) {
    const t = title.toLowerCase();
    if (t.includes("machine learning") || t.includes("ml engineer") || t.includes("ml platform") || t.includes("ml infrastructure")) {
      scores.ml_engineering += 3;
    }
    if (t.includes("data scientist") || t.includes("data science")) {
      scores.data_science += 3;
    }
    if (t.includes("research") || t.includes("scientist")) {
      scores.research += 3;
    }
    if (t.includes("mlops") || t.includes("ml platform") || t.includes("ml infrastructure") || t.includes("model deployment") || t.includes("feature store")) {
      scores.mlops += 3;
    }
    if (t.includes("software engineer") || t.includes("backend") || t.includes("frontend") || t.includes("full stack") || t.includes("sde")) {
      scores.software_engineering += 3;
    }
    if (t.includes("manager") || t.includes("lead") || t.includes("director") || t.includes("head of") || t.includes("vp ")) {
      scores.management += 3;
    }
  }

  // Role class matching
  for (const role of experience.role_history) {
    const family = mapRoleClassToFamily(role.role_class);
    if (family !== "unknown") {
      scores[family] += 2;
    }
  }

  // Sort by score, tiebreak by ROLE_FAMILY_ORDER
  const sorted = Object.entries(scores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return ROLE_FAMILY_ORDER.indexOf(a[0] as RoleFamily) - ROLE_FAMILY_ORDER.indexOf(b[0] as RoleFamily);
    });

  if (sorted.length === 0) {
    return { primary: "unknown", secondaries: [], confidence: 0 };
  }

  const primary = sorted[0][0] as RoleFamily;
  const secondaries = sorted.slice(1, 3).map(([k]) => k as RoleFamily);
  const totalScore = sorted.reduce((sum, [, v]) => sum + v, 0);
  const confidence = totalScore > 0 ? Math.min(1, sorted[0][1] / totalScore) : 0;

  return { primary, secondaries, confidence };
}

export function computeCareerTrajectory(
  roleHistory: RoleEntry[],
): CareerTrajectory {
  if (roleHistory.length < 3) {
    return { direction: "lateral", velocity: "steady" };
  }

  // Map role_class to seniority score
  const classToScore: Record<string, number> = {
    intern: 0,
    junior: 1,
    mid: 2,
    senior: 3,
    staff: 4,
    principal: 5,
    unknown: 2,
  };

  // Approximate seniority from role_class (we don't have per-role seniority, use role_class as proxy)
  // Better: use title keywords to estimate
  function estimateSeniority(role: RoleEntry): number {
    const t = role.title.toLowerCase();
    if (t.includes("principal")) return 5;
    if (t.includes("staff")) return 4;
    if (t.includes("senior")) return 3;
    if (t.includes("lead")) return 3;
    if (t.includes("junior") || t.includes("associate")) return 1;
    if (t.includes("intern")) return 0;
    // Use role_class as fallback
    switch (role.role_class) {
      case "management": return 4;
      case "research": return 3;
      case "core_ml": return 3;
      case "ml_adjacent": return 2;
      case "data_engineering": return 2;
      case "swe_generic": return 2;
      default: return 2;
    }
  }

  const scored = roleHistory.map((r) => estimateSeniority(r));
  const third = Math.ceil(roleHistory.length / 3);
  const firstThird = scored.slice(0, third);
  const lastThird = scored.slice(-third);

  const firstAvg = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
  const lastAvg = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;
  const diff = lastAvg - firstAvg;

  let direction: CareerDirection = "lateral";
  if (diff > 1) direction = "ascending";
  else if (diff < -1) direction = "descending";

  return { direction, velocity: "steady" };
}

export function detectSpecializations(
  skills: SkillsOutput,
): string[] {
  return getSpecializations(skills.domain_keywords);
}

export function checkIsCareerChanger(
  experience: ExperienceOutput,
): boolean {
  if (experience.role_history.length < 2) return false;

  const firstRole = experience.role_history[experience.role_history.length - 1];
  const lastRole = experience.role_history[0];

  const firstClass = firstRole?.role_class ?? "unknown";
  const lastClass = lastRole?.role_class ?? "unknown";

  // Meaningful transition: swe_generic -> core_ml/ml_adjacent, or data_engineering -> core_ml, etc.
  const meaningfulTransitions: Record<string, string[]> = {
    swe_generic: ["core_ml", "ml_adjacent", "research", "data_engineering"],
    data_engineering: ["core_ml", "ml_adjacent", "mlops"],
    software_engineering: ["core_ml", "ml_adjacent", "research", "data_engineering"],
    management: ["core_ml", "ml_adjacent", "research"],
  };

  const from = firstClass;
  const to = lastClass;

  if (from === to) return false;
  return meaningfulTransitions[from]?.includes(to) ?? false;
}

export function checkHasPreLlmDepth(
  experience: ExperienceOutput,
): boolean {
  const currentYear = new Date().getFullYear();
  for (const role of experience.role_history) {
    if (role.start_year !== null && role.start_year < 2020) {
      if (role.role_class === "core_ml" || role.role_class === "research") {
        return true;
      }
    }
  }
  return false;
}

export function computeProfileCompleteness(
  profile: Partial<CandidateProfile>,
): number {
  const fields: { key: keyof CandidateProfile; weight: number }[] = [
    { key: "candidate_name", weight: 5 },
    { key: "current_title", weight: 5 },
    { key: "current_company", weight: 5 },
    { key: "years_experience", weight: 5 },
    { key: "location", weight: 3 },
    { key: "contact_email", weight: 3 },
    { key: "technical_skills", weight: 5 },
    { key: "role_history", weight: 10 },
    { key: "total_ml_months", weight: 5 },
    { key: "leadership_signals", weight: 3 },
    { key: "ownership_signals", weight: 3 },
    { key: "highest_degree", weight: 3 },
    { key: "field_of_study", weight: 3 },
    { key: "institution", weight: 3 },
    { key: "graduation_year", weight: 3 },
    { key: "certifications", weight: 3 },
    { key: "quantified_achievements", weight: 5 },
    { key: "production_deployments", weight: 5 },
    { key: "publications", weight: 3 },
    { key: "projects", weight: 5 },
    { key: "career_preferences", weight: 3 },
    { key: "communication_signals", weight: 3 },
    { key: "risk_signals", weight: 3 },
    { key: "archetype", weight: 3 },
    { key: "seniority_level", weight: 3 },
    { key: "primary_role_family", weight: 3 },
    { key: "specializations", weight: 3 },
    { key: "career_trajectory", weight: 3 },
    { key: "domain_posture", weight: 3 },
    { key: "key_differentiators", weight: 3 },
  ];

  let score = 0;
  let maxScore = 0;

  for (const { key, weight } of fields) {
    maxScore += weight;
    const value = profile[key];
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        if (value.length > 0) score += weight;
      } else if (typeof value === "object") {
        score += weight;
      } else if (typeof value === "number") {
        score += weight;
      } else if (typeof value === "string" && value.length > 0) {
        score += weight;
      } else if (typeof value === "boolean") {
        score += weight;
      }
    }
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

// ─── Main Stage Function ──────────────────────────────────────────────────────

export function runStage12RecruiterSignals(
  identity: IdentityOutput,
  experience: ExperienceOutput,
  skills: SkillsOutput,
  evidence: EvidenceOutput,
): RecruiterSignalsOutput {
  const warnings: string[] = [];

  // Resolve years of experience with fallback chain
  let yearsExp = identity.years_experience;
  let fallbackUsed = false;

  if (yearsExp === null) {
    yearsExp = experience.computed_yoe ?? Math.round((experience.total_ml_months || 0) / 12);
    fallbackUsed = true;
  }

  if (yearsExp === null || yearsExp === undefined) {
    yearsExp = 0;
    fallbackUsed = true;
  }

  if (fallbackUsed) {
    warnings.push("YEARS_EXPERIENCE_FALLBACK_USED");
  }

  const seniorityLevel = computeSeniorityLevel(
    yearsExp,
    identity.current_title,
    experience.ownership_signals,
    experience.total_ml_months,
  );

  const { primary, secondaries, confidence } = scoreRoleFamilies(experience, skills, evidence);

  const careerTrajectory = computeCareerTrajectory(experience.role_history);

  const specializations = detectSpecializations(skills);

  const domainPosture = computeDomainPosture(
    specializations.length,
    new Set(experience.role_history.map((r) => r.role_class)).size,
  );

  const isCareerChanger = checkIsCareerChanger(experience);
  const hasPreLlmDepth = checkHasPreLlmDepth(experience);

  const profileCompleteness = 0; // Will be recomputed in Stage 14

  return {
    seniority_level: seniorityLevel,
    primary_role_family: primary,
    secondary_role_families: secondaries,
    role_family_confidence: confidence,
    specializations,
    is_career_changer: isCareerChanger,
    has_pre_llm_depth: hasPreLlmDepth,
    career_trajectory: careerTrajectory,
    domain_posture: domainPosture,
    profile_completeness: profileCompleteness,
    extraction_warnings: warnings,
  };
}