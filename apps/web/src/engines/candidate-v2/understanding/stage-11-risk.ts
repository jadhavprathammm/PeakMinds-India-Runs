// Stage 11 — Risk Analysis
// No Claude call. Deterministic computation over structured stage outputs.
// Fields owned: risk_signals.

import type {
  ExperienceOutput,
  SkillsOutput,
  IdentityOutput,
  RiskOutput,
  QualityOutput,
  ProjectsOutput,
  EvidenceOutput,
  CommunicationOutput,
} from "@/engines/shared/types/stage-outputs";
import type { RiskLevel } from "@/engines/shared/types/enums";
import type { RoleEntry, RiskSignals, Project } from "@/engines/shared/types/sub-types";

// Severity ordering for comparison (used by overall_risk_level = max).
export const RISK_SEVERITY: Record<RiskLevel, number> = {
  none: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

// Run Stage 11.
// No Claude call — reads outputs from Stages 4–10.
export function runStage11Risk(
  identity: IdentityOutput,
  experience: ExperienceOutput,
  skills: SkillsOutput,
  projects: ProjectsOutput,
  evidence: EvidenceOutput,
  communication: CommunicationOutput,
  quality: QualityOutput,
): RiskOutput {
  // 1. Job Hopping Risk
  const jobHopping = computeJobHoppingRisk(experience.role_history);

  // 2. Employment Gap Risk
  const employmentGap = computeEmploymentGapRisk(experience.role_history);

  // 3. Evidence Gap Risk
  // Uses stated YoE from identity and total ML months from experience
  // Also considers projects and evidence for supporting signals
  const evidenceGap = computeEvidenceGapRisk(
    identity.years_experience,
    experience.total_ml_months,
    projects.projects,
    evidence,
  );

  // 4. Extraction Risk (parsing reliability only — does NOT affect overall risk)
  const extractionRisk = computeExtractionRisk(
    quality.extraction_confidence,
    quality.parsing_warnings,
  );

  // 5. Fragility Risk (profile depends on too few signals)
  const fragilityRisk = computeFragilityRisk(
    experience,
    projects.projects,
    evidence,
    skills,
  );

  // 6. Communication Risk
  const communicationRisk = computeCommunicationRisk(communication.communication_signals);

  // 7. Overqualification Risk
  const overqualificationRisk = computeOverqualificationRisk(
    experience,
    identity.years_experience,
  );

  // 8. Underqualification Risk
  const underqualificationRisk = computeUnderqualificationRisk(
    experience,
    evidence,
    identity.years_experience,
  );

  // 9. Determine primary risk factor (recruiter-relevant priority order)
  const primaryRiskFactor = determinePrimaryRiskFactor(
    jobHopping.level,
    employmentGap.level,
    evidenceGap.level,
    fragilityRisk,
    communicationRisk,
    extractionRisk,
  );

  // 10. Overall risk level = max of recruiter-relevant risks (EXCLUDING extraction_risk)
  const recruiterRiskLevels: RiskLevel[] = [
    jobHopping.level,
    employmentGap.level,
    evidenceGap.level,
    fragilityRisk,
    communicationRisk,
    overqualificationRisk,
    underqualificationRisk,
  ];
  const overallRiskLevel = maxRiskLevel(recruiterRiskLevels);

  // 11. Collect risk flags for risks >= moderate, ordered by severity
  const riskFlags = collectRiskFlags({
    job_hopping_risk: jobHopping.level,
    job_hopping_detail: jobHopping.detail,
    employment_gap_risk: employmentGap.level,
    employment_gap_months: employmentGap.employment_gap_months,
    evidence_gap_risk: evidenceGap.level,
    evidence_gap_detail: evidenceGap.detail,
    specialization_fragility_risk: fragilityRisk,
    extraction_risk: extractionRisk,
    overqualification_risk: overqualificationRisk,
    underqualification_risk: underqualificationRisk,
  });

  return {
    risk_signals: {
      job_hopping_risk: jobHopping.level,
      job_hopping_detail: jobHopping.detail,
      evidence_gap_risk: evidenceGap.level,
      evidence_gap_detail: evidenceGap.detail,
      employment_gap_risk: employmentGap.level,
      employment_gap_months: employmentGap.employment_gap_months,
      specialization_fragility_risk: fragilityRisk,
      extraction_risk: extractionRisk,
      overqualification_risk: overqualificationRisk,
      underqualification_risk: underqualificationRisk,
      overall_risk_level: overallRiskLevel,
      primary_risk_factor: primaryRiskFactor,
      risk_flags: riskFlags,
    },
    extraction_warnings: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Job Hopping Risk
// ─────────────────────────────────────────────────────────────────────────────

// Job hopping: count short stints (< 18 months), check consecutive.
export function computeJobHoppingRisk(
  roleHistory: RoleEntry[],
): { level: RiskLevel; detail: string | null } {
  if (roleHistory.length === 0) {
    return { level: "none", detail: "No employment history" };
  }

  // Count short stints (1-17 months)
  const shortStints = roleHistory.filter(
    (r) => (r.duration_months ?? 0) >= 1 && (r.duration_months ?? 0) < 18,
  ).length;

  // Check consecutive short stints (sorted by start date descending - most recent first)
  const sortedRoles = [...roleHistory].sort((a, b) => {
    const aStart = a.start_year ?? 0;
    const bStart = b.start_year ?? 0;
    return bStart - aStart; // Descending: most recent first
  });

  let maxConsecutiveShort = 0;
  let currentConsecutive = 0;

  for (const role of sortedRoles) {
    const dur = role.duration_months ?? 0;
    if (dur >= 1 && dur < 18) {
      currentConsecutive++;
      maxConsecutiveShort = Math.max(maxConsecutiveShort, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }

  // Compute average tenure for critical check
  const totalMonths = roleHistory.reduce((sum, r) => sum + (r.duration_months ?? 0), 0);
  const avgTenure = roleHistory.length > 0 ? totalMonths / roleHistory.length : 0;

  let level: RiskLevel = "none";
  let detail: string | null = null;

  if (avgTenure < 10 && roleHistory.length >= 3) {
    level = "critical";
    detail = `Average tenure ${avgTenure.toFixed(1)} months across ${roleHistory.length} roles — critical job hopping pattern`;
  } else if (shortStints >= 4 || maxConsecutiveShort >= 3) {
    level = "high";
    detail = `${shortStints} short stints (<18 mo), ${maxConsecutiveShort} consecutive — high job hopping risk`;
  } else if (shortStints >= 2 || maxConsecutiveShort >= 2) {
    level = "moderate";
    detail = `${shortStints} short stints (<18 mo), ${maxConsecutiveShort} consecutive — moderate job hopping risk`;
  } else if (shortStints === 1) {
    level = "low";
    detail = `1 short stint (<18 mo) — low job hopping risk`;
  } else {
    level = "none";
    detail = "No short stints detected";
  }

  return { level, detail };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Employment Gap Risk
// ─────────────────────────────────────────────────────────────────────────────

// Employment gap: find max gap between adjacent roles (sorted by start date).
export function computeEmploymentGapRisk(
  roleHistory: RoleEntry[],
): { level: RiskLevel; employment_gap_months: number } {
  if (roleHistory.length < 2) {
    return { level: "none", employment_gap_months: 0 };
  }

  // Sort by start_year ASC (oldest first)
  const sortedRoles = [...roleHistory]
    .filter((r) => r.start_year !== null)
    .sort((a, b) => (a.start_year ?? 0) - (b.start_year ?? 0));

  let maxGapMonths = 0;

  for (let i = 0; i < sortedRoles.length - 1; i++) {
    const current = sortedRoles[i];
    const next = sortedRoles[i + 1];

    const currentEndYear = current.end_year ?? (current.is_current ? new Date().getFullYear() : current.start_year ?? 0);
    const currentEndMonth = current.end_month ?? (current.is_current ? new Date().getMonth() + 1 : current.start_month ?? 1);
    const nextStartYear = next.start_year ?? 0;
    const nextStartMonth = next.start_month ?? 1;

    const currentEndTotal = currentEndYear * 12 + currentEndMonth;
    const nextStartTotal = nextStartYear * 12 + nextStartMonth;

    const gapMonths = nextStartTotal - currentEndTotal;
    if (gapMonths > maxGapMonths) {
      maxGapMonths = gapMonths;
    }
  }

  // Ignore gaps <= 3 months
  if (maxGapMonths <= 3) {
    return { level: "none", employment_gap_months: 0 };
  }

  let level: RiskLevel;
  if (maxGapMonths >= 24) {
    level = "critical";
  } else if (maxGapMonths >= 12) {
    level = "high";
  } else if (maxGapMonths >= 6) {
    level = "moderate";
  } else {
    level = "low";
  }

  return { level, employment_gap_months: maxGapMonths };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Evidence Gap Risk
// ─────────────────────────────────────────────────────────────────────────────

// Evidence gap: compare stated YoE to evidenced ML months + projects + achievements
export function computeEvidenceGapRisk(
  statedYoe: number | null,
  totalMlMonths: number,
  projects: Project[],
  evidence: EvidenceOutput,
): { level: RiskLevel; detail: string | null } {
  if (statedYoe === null || statedYoe === undefined) {
    return { level: "low", detail: "Stated years of experience not available" };
  }

  // Evidence signals
  const evidencedMlYears = totalMlMonths / 12;
  const productionProjects = projects.filter((p) => p.production_grade).length;
  const quantifiedAchievements = evidence.quantified_achievements.length;
  const productionDeployments = evidence.production_deployments.length;
  const publications = evidence.publications.length;

  // Total evidence count
  const totalEvidenceSignals =
    productionProjects +
    quantifiedAchievements +
    productionDeployments +
    publications;

  // Delta: stated YoE - evidenced ML years
  const delta = statedYoe - evidencedMlYears;

  let level: RiskLevel;
  let detail: string;

  if (delta <= 1 && totalEvidenceSignals >= 2) {
    level = "none";
    detail = `Stated ${statedYoe} YoE aligns with ${evidencedMlYears.toFixed(1)} evidenced ML years; ${totalEvidenceSignals} supporting evidence signals`;
  } else if (delta <= 2 && totalEvidenceSignals >= 1) {
    level = "low";
    detail = `Stated ${statedYoe} YoE exceeds evidenced ${evidencedMlYears.toFixed(1)} ML years by ${delta.toFixed(1)} years; ${totalEvidenceSignals} evidence signals`;
  } else if (delta <= 3) {
    level = "moderate";
    detail = `Stated ${statedYoe} YoE exceeds evidenced ${evidencedMlYears.toFixed(1)} ML years by ${delta.toFixed(1)} years; limited supporting evidence (${totalEvidenceSignals} signals)`;
  } else if (delta <= 5) {
    level = "high";
    detail = `Stated ${statedYoe} YoE significantly exceeds evidenced ${evidencedMlYears.toFixed(1)} ML years (delta ${delta.toFixed(1)} years); weak evidence (${totalEvidenceSignals} signals)`;
  } else {
    level = "critical";
    detail = `Stated ${statedYoe} YoE far exceeds evidenced ${evidencedMlYears.toFixed(1)} ML years (delta ${delta.toFixed(1)} years); minimal evidence (${totalEvidenceSignals} signals)`;
  }

  return { level, detail };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Extraction Risk (parsing reliability only — does NOT affect overall risk)
// ─────────────────────────────────────────────────────────────────────────────

// Extraction risk: based on extraction_confidence and parsing_warnings
export function computeExtractionRisk(
  extractionConfidence: number,
  parsingWarnings: string[],
): RiskLevel {
  // High extraction risk = low confidence or many warnings
  // This indicates PARSING issues, not candidate quality
  const warningCount = parsingWarnings.length;

  if (extractionConfidence >= 0.8 && warningCount === 0) {
    return "none";
  }
  if (extractionConfidence >= 0.6 && warningCount <= 1) {
    return "low";
  }
  if (extractionConfidence >= 0.4 && warningCount <= 3) {
    return "moderate";
  }
  if (extractionConfidence >= 0.2) {
    return "high";
  }
  return "critical";
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Fragility Risk (profile depends on too few signals)
// ─────────────────────────────────────────────────────────────────────────────

// Fragility risk: does the candidate profile depend on too few signals?
export function computeFragilityRisk(
  experience: ExperienceOutput,
  projects: Project[],
  evidence: EvidenceOutput,
  skills: SkillsOutput,
): RiskLevel {
  // Signal counts
  const roleCount = experience.role_history.length;
  const projectCount = projects.length;
  const productionProjectCount = projects.filter((p) => p.production_grade).length;
  const achievementCount = evidence.quantified_achievements.length;
  const deploymentCount = evidence.production_deployments.length;
  const publicationCount = evidence.publications.length;
  const skillCount = skills.technical_skills.length + skills.frameworks.length + skills.tools.length;
  const domainKeywordCount = skills.domain_keywords.length;

  // Total validation points
  let validationPoints = 0;
  if (roleCount >= 1) validationPoints++;
  if (roleCount >= 3) validationPoints++;
  if (projectCount >= 1) validationPoints++;
  if (productionProjectCount >= 1) validationPoints++;
  if (achievementCount >= 1) validationPoints++;
  if (deploymentCount >= 1) validationPoints++;
  if (publicationCount >= 1) validationPoints++;
  if (skillCount >= 5) validationPoints++;
  if (skillCount >= 15) validationPoints++;
  if (domainKeywordCount >= 3) validationPoints++;

  // High risk: very few signals
  if (validationPoints <= 2) {
    return "critical";
  }
  if (validationPoints <= 4) {
    return "high";
  }
  if (validationPoints <= 6) {
    return "moderate";
  }
  if (validationPoints <= 8) {
    return "low";
  }
  return "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Communication Risk
// ─────────────────────────────────────────────────────────────────────────────

// Communication risk: based on communication_tier and communication_score
export function computeCommunicationRisk(
  signals: CommunicationOutput["communication_signals"],
): RiskLevel {
  const tier = signals.communication_tier;
  const score = signals.communication_score;

  // Tier-based primary, score as secondary
  switch (tier) {
    case "exceptional":
      return "none";
    case "strong":
      return score >= 3 ? "none" : "low";
    case "moderate":
      return score >= 2 ? "low" : "moderate";
    case "minimal":
      return score >= 1 ? "moderate" : "high";
    default:
      return "moderate";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Overqualification Risk
// ─────────────────────────────────────────────────────────────────────────────

// Overqualification risk: candidate significantly exceeds typical requirements
// for the roles they're applying to (heuristic: very high YoE + few recent relevant roles)
export function computeOverqualificationRisk(
  experience: ExperienceOutput,
  statedYoe: number | null,
): RiskLevel {
  if (statedYoe === null || statedYoe < 15) {
    return "none";
  }

  // Check if recent roles are junior/mismatched
  const recentRoles = experience.role_history.slice(0, 3);
  const hasJuniorRecent = recentRoles.some(
    (r) => r.role_class === "swe_generic" && (r.duration_months ?? 0) < 24,
  );

  if (hasJuniorRecent) {
    return "low";
  }
  return "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Underqualification Risk
// ─────────────────────────────────────────────────────────────────────────────

// Underqualification risk: candidate lacks expected depth for stated seniority
export function computeUnderqualificationRisk(
  experience: ExperienceOutput,
  evidence: EvidenceOutput,
  statedYoe: number | null,
): RiskLevel {
  if (statedYoe === null || statedYoe < 3) {
    return "none";
  }

  // Expected: at least some production deployments or quantified achievements for 3+ YoE
  const hasProductionExperience =
    evidence.production_deployments.length > 0 ||
    evidence.quantified_achievements.length > 0;

  const hasMLRole = experience.role_history.some(
    (r) => r.role_class === "core_ml" || r.role_class === "ml_adjacent" || r.role_class === "research",
  );

  if (!hasMLRole && statedYoe >= 5) {
    return "moderate";
  }
  if (!hasProductionExperience && statedYoe >= 5) {
    return "low";
  }
  return "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// Primary Risk Factor Determination
// ─────────────────────────────────────────────────────────────────────────────

// Priority order (per spec):
// 1. job_hopping_risk
// 2. employment_gap_risk
// 3. evidence_gap_risk
// 4. fragility_risk
// 5. communication_risk
// 6. extraction_risk
function determinePrimaryRiskFactor(
  jobHopping: RiskLevel,
  employmentGap: RiskLevel,
  evidenceGap: RiskLevel,
  fragility: RiskLevel,
  communication: RiskLevel,
  extraction: RiskLevel,
): string {
  const risks: Array<{ name: string; level: RiskLevel }> = [
    { name: "job_hopping_risk", level: jobHopping },
    { name: "employment_gap_risk", level: employmentGap },
    { name: "evidence_gap_risk", level: evidenceGap },
    { name: "specialization_fragility_risk", level: fragility },
    { name: "communication_risk", level: communication },
    { name: "extraction_risk", level: extraction },
  ];

  // Find highest severity among recruiter-relevant risks first
  const recruiterRisks = risks.slice(0, 5);
  const maxSeverity = Math.max(...recruiterRisks.map((r) => RISK_SEVERITY[r.level]));

  // Return first risk at max severity in priority order
  for (const risk of recruiterRisks) {
    if (RISK_SEVERITY[risk.level] === maxSeverity && maxSeverity > 0) {
      return risk.name;
    }
  }

  // If all recruiter risks are "none", check extraction
  if (extraction !== "none") {
    return "extraction_risk";
  }

  return "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// Max Risk Level Utility
// ─────────────────────────────────────────────────────────────────────────────

// Return the highest risk level from an array of component levels.
export function maxRiskLevel(levels: RiskLevel[]): RiskLevel {
  if (levels.length === 0) return "none";

  let maxLevel: RiskLevel = "none";
  let maxSeverity = -1;

  for (const level of levels) {
    const severity = RISK_SEVERITY[level];
    if (severity > maxSeverity) {
      maxSeverity = severity;
      maxLevel = level;
    }
  }

  return maxLevel;
}

// ─────────────────────────────────────────────────────────────────────────────
// Risk Flags Collection
// ─────────────────────────────────────────────────────────────────────────────

// Collect non-null detail strings for risks >= "moderate", ordered by severity.
// Limit to 10 items.
export function collectRiskFlags(signals: Partial<RiskSignals>): string[] {
  const flags: Array<{ severity: number; flag: string }> = [];

  const riskItems: Array<{ key: keyof RiskSignals; severity: number; label: string }> = [
    { key: "job_hopping_risk", severity: RISK_SEVERITY[signals.job_hopping_risk ?? "none"], label: "JOB_HOPPING" },
    { key: "employment_gap_risk", severity: RISK_SEVERITY[signals.employment_gap_risk ?? "none"], label: "EMPLOYMENT_GAP" },
    { key: "evidence_gap_risk", severity: RISK_SEVERITY[signals.evidence_gap_risk ?? "none"], label: "EVIDENCE_GAP" },
    { key: "specialization_fragility_risk", severity: RISK_SEVERITY[signals.specialization_fragility_risk ?? "none"], label: "FRAGILITY" },
    { key: "extraction_risk", severity: RISK_SEVERITY[signals.extraction_risk ?? "none"], label: "EXTRACTION" },
    { key: "overqualification_risk", severity: RISK_SEVERITY[signals.overqualification_risk ?? "none"], label: "OVERQUALIFIED" },
    { key: "underqualification_risk", severity: RISK_SEVERITY[signals.underqualification_risk ?? "none"], label: "UNDERQUALIFIED" },
  ];

  for (const item of riskItems) {
    if (item.severity >= RISK_SEVERITY.moderate) {
      const detailKey = `${item.key.replace("_risk", "")}_detail` as keyof RiskSignals;
      const detail = signals[detailKey];
      const flag = detail ? `${item.label}: ${detail}` : item.label;
      flags.push({ severity: item.severity, flag });
    }
  }

  // Sort by severity descending, then alphabetically
  flags.sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity;
    return a.flag.localeCompare(b.flag);
  });

  // Limit to 10
  return flags.slice(0, 10).map((f) => f.flag);
}