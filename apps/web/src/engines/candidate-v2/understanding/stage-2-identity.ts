// Stage 2 — Identity Extraction
// Single Claude call. Extracts personal and professional identity fields.
// Fields owned: candidate_name, current_title, current_company,
//               years_experience (stated), location, contact_email.
//
// phone, linkedin_url, github_url, portfolio_url: extracted deterministically
// via regex from header text. Stored in extraction_warnings as
// FOUND_PHONE:<value>, FOUND_LINKEDIN:<value>, etc. — IdentityOutput has no slots for these.

import type { SectionDetectionOutput, IdentityOutput } from "@/engines/shared/types/stage-outputs";
import { callClaudeWithSchema } from "@/engines/shared/utils/claude-client";
import { isIdentityOutput } from "@/engines/shared/schemas/stage-schemas";
import {
  STAGE_2_IDENTITY_PROMPT,
  STAGE_2_IDENTITY_SYSTEM_PROMPT,
} from "@/engines/shared/prompts/stage-2-identity";

// Default output returned on complete stage failure.
export const IDENTITY_STAGE_DEFAULTS: IdentityOutput = {
  candidate_name: null,
  current_title: null,
  current_company: null,
  years_experience: null,
  location: null,
  contact_email: null,
  spoken_languages_raw: null,
  stage_confidence: 0.1,
  field_confidence: {
    candidate_name: 0,
    current_title: 0,
    current_company: 0,
    years_experience: 0,
    location: 0,
    contact_email: 0,
  },
  extraction_warnings: ["IDENTITY_EXTRACTION_FAILED_AFTER_RETRY"],
};

// Regex for deterministic contact-info extraction.
const EMAIL_RE = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9\-_%]+\/?/i;
const PORTFOLIO_RE =
  /(?:https?:\/\/)?(?:www\.)?(?!linkedin|github)[A-Za-z0-9\-]+\.[A-Za-z]{2,}(?:\/[^\s]*)*/i;

// Run Stage 2.
// Input: section_map.header + section_map.objective_summary
//        (falls back to first 800 chars of normalized_text if header is null)
//
// Failure modes:
//   candidate_name null       → add warning CANDIDATE_NAME_NOT_FOUND; not a blocker
//   years_experience < 0 or > 60 → discard; let Stage 4 compute from dates
//   contact_email malformed   → set null; add warning CONTACT_EMAIL_MALFORMED
//   Claude returns non-JSON   → trigger retry
export async function runStage2Identity(
  sections: SectionDetectionOutput,
  normalizedText: string,
): Promise<IdentityOutput> {
  // Compose input text for Claude
  const headerText = composeInputText(sections, normalizedText);

  // Deterministic pre-extraction — regex runs on header before Claude call
  const regexExtracted = extractContactInfoByRegex(headerText);

  // Claude call
  const result = await callClaudeWithSchema<IdentityOutput>(
    {
      prompt: STAGE_2_IDENTITY_PROMPT(headerText),
      systemPrompt: STAGE_2_IDENTITY_SYSTEM_PROMPT,
      maxTokens: 512,
      temperature: 0.2,
    },
    isIdentityOutput,
    { ...IDENTITY_STAGE_DEFAULTS },
    "IDENTITY",
  );

  // Post-process Claude output
  const validated = validateIdentityOutput(result.data);

  // If Claude missed the email but regex found it, fill in
  if (validated.contact_email === null && regexExtracted.email !== null) {
    validated.contact_email = regexExtracted.email;
    validated.field_confidence.contact_email = 0.85;
  }

  // Apply confidence penalty from retry
  validated.stage_confidence = Math.max(
    0,
    validated.stage_confidence - result.confidence_penalty,
  );

  // Merge retry warnings
  if (result.warnings.length > 0) {
    validated.extraction_warnings.push(...result.warnings);
  }

  // Add warnings for deterministic fields that have no schema slot
  // These are preserved for downstream pipeline consumers via warnings
  if (regexExtracted.phone !== null) {
    validated.extraction_warnings.push(`FOUND_PHONE:${regexExtracted.phone}`);
  }
  if (regexExtracted.linkedin !== null) {
    validated.extraction_warnings.push(`FOUND_LINKEDIN:${regexExtracted.linkedin}`);
  }
  if (regexExtracted.github !== null) {
    validated.extraction_warnings.push(`FOUND_GITHUB:${regexExtracted.github}`);
  }
  if (regexExtracted.portfolio !== null) {
    validated.extraction_warnings.push(`FOUND_PORTFOLIO:${regexExtracted.portfolio}`);
  }

  return validated;
}

// Compose the text snippet sent to Claude.
// Header + objective_summary, or first 800 chars of full text.
function composeInputText(sections: SectionDetectionOutput, normalizedText: string): string {
  const parts: string[] = [];
  if (sections.section_map.header) parts.push(sections.section_map.header);
  if (sections.section_map.objective_summary) parts.push(sections.section_map.objective_summary);
  if (parts.length > 0) return parts.join("\n\n").slice(0, 1200);
  return normalizedText.slice(0, 800);
}

// Deterministic regex extraction of contact info.
function extractContactInfoByRegex(text: string): {
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
} {
  const emailMatch = EMAIL_RE.exec(text);
  const phoneMatch = PHONE_RE.exec(text);
  const linkedinMatch = LINKEDIN_RE.exec(text);
  const githubMatch = GITHUB_RE.exec(text);

  // Portfolio: any URL that is not linkedin or github
  let portfolio: string | null = null;
  const allUrls = text.match(/https?:\/\/[^\s]+/gi) ?? [];
  for (const url of allUrls) {
    if (!/linkedin\.com|github\.com/i.test(url)) {
      portfolio = url;
      break;
    }
  }
  // Fallback: bare domain pattern if no https:// URL found
  if (portfolio === null) {
    const bareMatch = PORTFOLIO_RE.exec(text.replace(LINKEDIN_RE, "").replace(GITHUB_RE, ""));
    portfolio = bareMatch?.[0] ?? null;
  }

  return {
    email: emailMatch?.[0] ?? null,
    phone: phoneMatch?.[0]?.trim() ?? null,
    linkedin: linkedinMatch?.[0] ?? null,
    github: githubMatch?.[0] ?? null,
    portfolio,
  };
}

// Post-processing: validate and sanitise raw Claude output.
function validateIdentityOutput(raw: IdentityOutput): IdentityOutput {
  const warnings = [...(raw.extraction_warnings ?? [])];
  let { candidate_name, contact_email, years_experience } = raw;

  // Validate email format
  if (contact_email !== null && !EMAIL_RE.test(contact_email)) {
    warnings.push("CONTACT_EMAIL_MALFORMED");
    contact_email = null;
  }

  // Validate years_experience range [0, 60]
  if (years_experience !== null && (years_experience < 0 || years_experience > 60)) {
    years_experience = null;
  }

  // Clamp candidate_name length
  if (candidate_name !== null && candidate_name.length > 200) {
    candidate_name = candidate_name.slice(0, 200).trim();
  }

  // Warn if name still null
  if (candidate_name === null && !warnings.includes("CANDIDATE_NAME_NOT_FOUND")) {
    warnings.push("CANDIDATE_NAME_NOT_FOUND");
  }

  // Clamp stage_confidence to [0, 1]
  const stage_confidence = Math.min(1, Math.max(0, raw.stage_confidence ?? 0.5));

  // Sanitise field_confidence values to [0, 1]
  const fc = raw.field_confidence ?? {
    candidate_name: 0,
    current_title: 0,
    current_company: 0,
    years_experience: 0,
    location: 0,
    contact_email: 0,
  };
  const field_confidence = {
    candidate_name: clamp01(fc.candidate_name),
    current_title: clamp01(fc.current_title),
    current_company: clamp01(fc.current_company),
    years_experience: clamp01(fc.years_experience),
    location: clamp01(fc.location),
    contact_email: clamp01(fc.contact_email),
  };

  return {
    candidate_name,
    current_title: raw.current_title ?? null,
    current_company: raw.current_company ?? null,
    years_experience,
    location: raw.location ?? null,
    contact_email,
    spoken_languages_raw: raw.spoken_languages_raw ?? null,
    stage_confidence,
    field_confidence,
    extraction_warnings: warnings,
  };
}

function clamp01(v: unknown): number {
  const n = typeof v === "number" ? v : 0;
  return Math.min(1, Math.max(0, n));
}
