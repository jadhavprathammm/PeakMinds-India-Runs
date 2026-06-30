// Stage 4 — Experience Extraction
// Single Claude call + the most complex deterministic post-processing stage.
// Fields owned: role_history, total_ml_months, has_management_experience,
//               leadership_signals, ownership_signals, computed_yoe.

import type { SectionDetectionOutput, ExperienceOutput } from "@/engines/shared/types/stage-outputs";
import type { RoleEntry, LeadershipSignals, OwnershipSignals } from "@/engines/shared/types/sub-types";
import type { RoleClass } from "@/engines/shared/types/enums";
import { callClaudeWithSchema } from "@/engines/shared/utils/claude-client";
import { isExperienceOutput } from "@/engines/shared/schemas/stage-schemas";
import {
  STAGE_4_EXPERIENCE_PROMPT,
  STAGE_4_EXPERIENCE_SYSTEM_PROMPT,
} from "@/engines/shared/prompts/stage-4-experience";
import {
  parseDate,
  computeDurationMonths,
  getCurrentDate,
} from "@/engines/shared/utils/date-parser";
import { classifyTitle } from "@/engines/recruiter-v2/taxonomy/role-classifier";

// Raw role schema from Claude output
interface RawRole {
  title: string;
  company: string;
  start_date_raw: string | null;
  end_date_raw: string | null;
  is_current: boolean;
  description: string;
  key_responsibilities_raw: string[];
}

interface RawExperienceOutput {
  raw_roles: RawRole[];
  stage_confidence: number;
  extraction_warnings: string[];
}

// Default output returned on complete stage failure.
export const EXPERIENCE_STAGE_DEFAULTS: ExperienceOutput = {
  role_history: [],
  total_ml_months: 0,
  has_management_experience: false,
  leadership_signals: {
    managed_teams: false,
    team_size_estimate: null,
    led_cross_functional_projects: false,
    mentored_juniors: false,
    presented_externally: false,
  },
  ownership_signals: {
    shipped_to_production: false,
    owned_full_pipeline: false,
    led_architecture_decisions: false,
    drove_measurable_outcomes: false,
  },
  computed_yoe: null,
  stage_confidence: 0.1,
  date_parse_failures: 0,
  extraction_warnings: ["EXPERIENCE_EXTRACTION_FAILED_AFTER_RETRY"],
};

// Run Stage 4.
// Input: experience section (primary) + header section (for current role).
//
// Post-processing per role:
//   1. Date normalisation + duration arithmetic (shared/utils/date-parser.ts)
//   2. Role classification via taxonomy/role-classifier.ts
//   3. Leadership signals derivation (regex over key_responsibilities)
//   4. Ownership signals derivation (regex over all descriptions)
//   5. total_ml_months computation (sum of core_ml + ml_adjacent role durations)
//   6. has_management_experience detection
//   7. Multiple current role resolution (retain most recent)
//
// Failure modes:
//   Date parsing fails for a role   → duration_months = 0; increment date_parse_failures
//   All dates unparseable           → stage_confidence = 0.3; add warning ALL_DATES_UNPARSEABLE
//   section_map.experience is null  → run against full text; stage_confidence = 0.4
//   is_current set for multiple     → retain only most recent; add warning
export async function runStage4Experience(
  sections: SectionDetectionOutput,
  normalizedText: string,
): Promise<ExperienceOutput> {
  const experienceText = sections.section_map.experience ?? "";
  const headerText = sections.section_map.header ?? "";

  // No experience section — run against full text with confidence penalty
  const hasExperienceSection = Boolean(experienceText);
  const inputText = hasExperienceSection ? experienceText : normalizedText;
  const baseConfidence = hasExperienceSection ? 0.5 : 0.4;
  const penaltyWarnings = hasExperienceSection ? [] : ["NO_EXPERIENCE_SECTION"];

  // Compose prompt
  const prompt = STAGE_4_EXPERIENCE_PROMPT(inputText, headerText);

  // Validate raw experience output
  function isRawExperienceOutput(data: unknown): data is RawExperienceOutput {
    if (typeof data !== "object" || data === null) return false;
    const d = data as Record<string, unknown>;
    if (!Array.isArray(d.raw_roles)) return false;
    for (const role of d.raw_roles) {
      if (typeof role !== "object" || role === null) return false;
      const r = role as Record<string, unknown>;
      if (!("title" in r) || !("company" in r) || !("is_current" in r)) return false;
    }
    if (typeof d.stage_confidence !== "number") return false;
    if (!Array.isArray(d.extraction_warnings)) return false;
    return true;
  }

  const rawDefaults: RawExperienceOutput = {
    raw_roles: [],
    stage_confidence: 0.1,
    extraction_warnings: ["EXPERIENCE_EXTRACTION_FAILED_AFTER_RETRY"],
  };

  // Claude call
  const result = await callClaudeWithSchema<RawExperienceOutput>(
    {
      prompt,
      systemPrompt: STAGE_4_EXPERIENCE_SYSTEM_PROMPT,
      maxTokens: 2048,
      temperature: 0.2,
    },
    isRawExperienceOutput,
    rawDefaults,
    "EXPERIENCE",
  );

  // Post-process raw roles
  const { roles, dateParseFailures, warnings } = postProcessRoles(
    result.data.raw_roles,
    hasExperienceSection,
  );

  // Aggregate leadership signals across all roles
  const allResponsibilities = roles.flatMap((r) => r.key_responsibilities);
  const allDescriptions = roles.map((r) => r.description);
  const leadershipSignals = deriveLeadershipSignals(allResponsibilities, allDescriptions);

  // Aggregate ownership signals across all roles (scan both descriptions and responsibilities)
  const allTextForOwnership = allDescriptions.concat(allResponsibilities);
  const ownershipSignals = deriveOwnershipSignals(allTextForOwnership);

  // Compute total ML months
  const totalMlMonths = computeTotalMlMonths(roles);

  // Detect management experience
  const hasManagementExperience = roles.some((r) =>
    r.role_class === "management" ||
    leadershipSignals.managed_teams ||
    r.title.toLowerCase().includes("manager") ||
    r.title.toLowerCase().includes("lead") ||
    r.title.toLowerCase().includes("director") ||
    r.title.toLowerCase().includes("head of") ||
    r.title.toLowerCase().includes("vp ") ||
    r.title.toLowerCase().includes("cto")
  );

  // Compute years of experience from roles
  const computedYoe = computeYoeFromRoles(roles);

  // Resolve multiple current roles
  const { resolvedRoles, warnings: currentRoleWarnings } = resolveMultipleCurrentRoles(roles);

  // Calculate stage confidence
  let stageConfidence = baseConfidence;
  if (dateParseFailures === roles.length && roles.length > 0) {
    stageConfidence = 0.3;
    warnings.push("ALL_DATES_UNPARSEABLE");
  }
  stageConfidence = Math.max(0, stageConfidence - result.confidence_penalty);
  stageConfidence = Math.min(1, stageConfidence);

  // Merge all warnings
  const allWarnings = [
    ...result.data.extraction_warnings,
    ...result.warnings,
    ...penaltyWarnings,
    ...warnings,
    ...currentRoleWarnings,
  ];

  return {
    role_history: resolvedRoles,
    total_ml_months: totalMlMonths,
    has_management_experience: hasManagementExperience,
    leadership_signals: leadershipSignals,
    ownership_signals: ownershipSignals,
    computed_yoe: computedYoe,
    stage_confidence: stageConfidence,
    date_parse_failures: dateParseFailures,
    extraction_warnings: allWarnings,
  };
}

// Post-processing: process raw roles into structured RoleEntry[].
function postProcessRoles(
  rawRoles: RawRole[],
  hasExperienceSection: boolean,
): {
  roles: RoleEntry[];
  dateParseFailures: number;
  warnings: string[];
} {
  const currentDate = getCurrentDate();
  let dateParseFailures = 0;
  const warnings: string[] = [];

  const roles: RoleEntry[] = rawRoles.map((raw, index) => {
    // Parse dates
    const startParsed = parseDate(raw.start_date_raw);
    const endParsed = raw.is_current ? null : parseDate(raw.end_date_raw);

    // Check for unparseable dates
    if (!startParsed) dateParseFailures++;
    if (!raw.is_current && raw.end_date_raw && !endParsed) dateParseFailures++;

    const durationMonths = computeDurationMonths(startParsed, endParsed, currentDate);

    // Classify role
    const roleClass = classifyTitle(raw.title);

    return {
      title: raw.title,
      company: raw.company,
      start_date_raw: raw.start_date_raw,
      end_date_raw: raw.end_date_raw,
      start_year: startParsed?.year ?? null,
      start_month: startParsed?.month ?? null,
      end_year: endParsed?.year ?? null,
      end_month: endParsed?.month ?? null,
      is_current: raw.is_current,
      duration_months: durationMonths,
      role_class: roleClass,
      description: raw.description,
      key_responsibilities: raw.key_responsibilities_raw,
    };
  });

  if (dateParseFailures > 0) {
    warnings.push(`DATE_PARSE_FAILURES:${dateParseFailures}`);
  }

  return { roles, dateParseFailures, warnings };
}

// Scan key_responsibilities text for leadership signals.
export function deriveLeadershipSignals(
  responsibilities: string[],
  _allDescriptions: string[],
): LeadershipSignals {
  const text = responsibilities.join(" ").toLowerCase();

  const managedTeams =
    text.includes("managed") ||
    text.includes("led a team") ||
    text.includes("led team") ||
    text.includes("leading team") ||
    text.includes("direct reports") ||
    text.includes("people manager") ||
    text.includes("supervised") ||
    text.includes("managed a team") ||
    text.includes("lead a team") ||
    text.includes("leading a team");

  let teamSizeEstimate: number | null = null;
  if (managedTeams) {
    // Try to extract team size from "team of N" or "N direct reports"
    const teamOfMatch = text.match(/team of (\d+)/);
    if (teamOfMatch) {
      teamSizeEstimate = parseInt(teamOfMatch[1], 10);
    } else {
      const reportsMatch = text.match(/(\d+)\s*direct reports?/);
      if (reportsMatch) {
        teamSizeEstimate = parseInt(reportsMatch[1], 10);
      } else if (text.includes("team")) {
        teamSizeEstimate = 5; // default estimate
      }
    }
  }

  const ledCrossFunctional =
    text.includes("cross-functional") ||
    text.includes("cross functional") ||
    text.includes("worked with product") ||
    text.includes("worked with design") ||
    text.includes("worked with data") ||
    text.includes("collaborated with product") ||
    text.includes("collaborated with design") ||
    text.includes("collaborated with data") ||
    text.includes("partnered with product") ||
    text.includes("partnered with design") ||
    text.includes("partnered with data");

  const mentoredJuniors =
    text.includes("mentored") ||
    text.includes("coached") ||
    text.includes("onboarded junior") ||
    text.includes("onboarded new") ||
    text.includes("guided junior") ||
    text.includes("trained junior") ||
    text.includes("mentoring");

  const presentedExternally =
    text.includes("presented at") ||
    text.includes("conference") ||
    text.includes("talk at") ||
    text.includes("blog post") ||
    text.includes("published") ||
    text.includes("speaker") ||
    text.includes("workshop") ||
    text.includes("meetup");

  return {
    managed_teams: managedTeams,
    team_size_estimate: teamSizeEstimate,
    led_cross_functional_projects: ledCrossFunctional,
    mentored_juniors: mentoredJuniors,
    presented_externally: presentedExternally,
  };
}

// Scan all role descriptions and responsibilities for ownership signals.
export function deriveOwnershipSignals(descriptions: string[]): OwnershipSignals {
  const text = descriptions.join(" ").toLowerCase();

  const shippedToProduction =
    text.includes("deployed") ||
    text.includes("shipped") ||
    text.includes("launched") ||
    text.includes("serving") ||
    text.includes("in production") ||
    text.includes("went live") ||
    text.includes("released to production") ||
    text.includes("production deployment") ||
    text.includes("production release");

  const ownedFullPipeline =
    text.includes("end-to-end") ||
    text.includes("end to end") ||
    text.includes("from scratch") ||
    text.includes("full pipeline") ||
    text.includes("built from ground up") ||
    text.includes("designed and built") ||
    text.includes("architected and implemented") ||
    text.includes("owned the full") ||
    text.includes("full ownership");

  const ledArchitectureDecisions =
    text.includes("architected") ||
    text.includes("architecture") ||
    text.includes("designed the system") ||
    text.includes("designed the platform") ||
    text.includes("designed system") ||
    text.includes("designed platform") ||
    text.includes("technical lead") ||
    text.includes("architecture decisions") ||
    text.includes("system design") ||
    text.includes("technical architecture") ||
    text.includes("led the design") ||
    text.includes("design decisions");

  const droveMeasurableOutcomes =
    /(\d+(\.\d+)?%\s*(improvement|increase|reduction|decrease|gain|boost|lift))/.test(text) ||
    /(\d+(\.\d+)?%\s*(reduced|improved|increased|decreased|cut)\s+by)/.test(text) ||
    /(\d+(\.\d+)?\s*(x|times)\s*(faster|speedup|improvement|reduction))/.test(text) ||
    /(\d+(\.\d+)?\s*(x|times)\s*(faster|speedup))/.test(text) ||
    /(million|billion|thousand)\s*(users|requests|transactions|predictions|queries)/.test(text) ||
    /(\d+(\.\d+)?)\s*(ms|seconds?|minutes?|hours?)\s*(latency|response|inference|training)/.test(text) ||
    /(accuracy|f1|precision|recall|auc|rmse)\s*(of|:)\s*0?\.\d+/.test(text);

  return {
    shipped_to_production: shippedToProduction,
    owned_full_pipeline: ownedFullPipeline,
    led_architecture_decisions: ledArchitectureDecisions,
    drove_measurable_outcomes: droveMeasurableOutcomes,
  };
}

// Sum duration_months for roles classified as core_ml or ml_adjacent.
export function computeTotalMlMonths(roles: RoleEntry[]): number {
  return roles
    .filter((r) => r.role_class === "core_ml" || r.role_class === "ml_adjacent" || r.role_class === "research")
    .reduce((sum, r) => sum + r.duration_months, 0);
}

// Compute years of experience from role history.
// Uses the earliest start_year and latest end_year (or current date).
function computeYoeFromRoles(roles: RoleEntry[]): number | null {
  if (roles.length === 0) return null;

  const validRoles = roles.filter((r) => r.start_year !== null);
  if (validRoles.length === 0) return null;

  const startYears = validRoles.map((r) => r.start_year!);
  const earliestStart = Math.min(...startYears);

  const currentDate = getCurrentDate();
  let latestEnd = currentDate.year;

  for (const role of roles) {
    if (role.end_year !== null) {
      latestEnd = Math.max(latestEnd, role.end_year);
    } else if (role.is_current) {
      latestEnd = Math.max(latestEnd, currentDate.year);
    }
  }

  const years = latestEnd - earliestStart;
  return Math.max(0, years);
}

// Resolve multiple current roles: retain only the most recent one.
function resolveMultipleCurrentRoles(roles: RoleEntry[]): {
  resolvedRoles: RoleEntry[];
  warnings: string[];
} {
  const currentRoles = roles.filter((r) => r.is_current);
  if (currentRoles.length <= 1) {
    return { resolvedRoles: roles, warnings: [] };
  }

  // Sort by start_year descending (most recent first)
  const withStartYear = currentRoles.filter((r) => r.start_year !== null);
  if (withStartYear.length === 0) {
    return { resolvedRoles: roles, warnings: ["MULTIPLE_CURRENT_ROLES_NO_START_DATE"] };
  }

  withStartYear.sort((a, b) => (b.start_year ?? 0) - (a.start_year ?? 0));
  const keepRole = withStartYear[0];

  const resolvedRoles = roles.map((r) => {
    if (r.is_current && r !== keepRole) {
      return { ...r, is_current: false };
    }
    return r;
  });

  return { resolvedRoles, warnings: ["MULTIPLE_CURRENT_ROLES_RESOLVED"] };
}