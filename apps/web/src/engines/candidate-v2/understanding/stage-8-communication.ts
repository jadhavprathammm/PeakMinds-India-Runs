// Stage 8 — Communication Signals Extraction
// Single Claude call + deterministic post-processing.
// Fields owned: communication_signals (all sub-fields including communication_tier and communication_score).

import type { PreflightOutput, EvidenceOutput, CommunicationOutput } from "@/engines/shared/types/stage-outputs";
import type { AudienceScope, CommunicationTier } from "@/engines/shared/types/enums";
import type { CommunicationSignals, Presentation } from "@/engines/shared/types/sub-types";
import { callClaudeWithSchema } from "@/engines/shared/utils/claude-client";
import {
  STAGE_8_COMMUNICATION_PROMPT,
  STAGE_8_COMMUNICATION_SYSTEM_PROMPT,
} from "@/engines/shared/prompts/stage-8-communication";

// Raw output schema from Claude
interface RawPresentation {
  title: string;
  event: string | null;
  year: number | null;
  audience_scope_raw: string | null;
  url: string | null;
}

interface RawTechnicalWriting {
  has_technical_blog: boolean;
  blog_platform: string | null;
  blog_url: string | null;
  estimated_post_count: number | null;
  writing_topics: string[];
}

interface RawMentoring {
  formal_mentoring_role: boolean;
  junior_coaching_described: boolean;
  onboarding_described: boolean;
  mentees_count_estimate: number | null;
}

interface RawCommunity {
  open_source_maintainer: boolean;
  conference_organizer: boolean;
  community_names: string[];
  stackoverflow_reputation_mentioned: boolean;
}

interface RawCommunicationOutput {
  raw_presentations: RawPresentation[];
  raw_technical_writing: RawTechnicalWriting;
  raw_mentoring: RawMentoring;
  raw_community: RawCommunity;
  stage_confidence: number;
  extraction_warnings: string[];
}

// Default output returned on complete stage failure.
export const COMMUNICATION_STAGE_DEFAULTS: CommunicationOutput = {
  communication_signals: {
    presentations: [],
    technical_writing: {
      has_technical_blog: false,
      blog_platform: null,
      blog_url: null,
      estimated_post_count: null,
      writing_topics: [],
    },
    mentoring: {
      formal_mentoring_role: false,
      junior_coaching_described: false,
      onboarding_described: false,
      mentees_count_estimate: null,
    },
    community: {
      open_source_maintainer: false,
      conference_organizer: false,
      community_names: [],
      stackoverflow_reputation_mentioned: false,
    },
    communication_tier: "minimal",
    publication_count: 0,
    communication_score: 0,
  },
  stage_confidence: 0.1,
  extraction_warnings: ["COMMUNICATION_EXTRACTION_FAILED_AFTER_RETRY"],
};

// Run Stage 8.
// Input: full normalized_text + evidence for publication_count.
//
// Post-processing passes:
//   1. Normalise audience_scope_raw → AudienceScope enum (default "internal")
//   2. Set publication_count = evidence.publications.length
//   3. Compute communication_score from signals
//   4. Compute communication_tier from score
//   5. Validate presentation years (1950 ≤ year ≤ current_year + 1)
export async function runStage8Communication(
  preflight: PreflightOutput,
  evidence: EvidenceOutput,
): Promise<CommunicationOutput> {
  const normalizedText = preflight.normalized_text;
  const hasSubstantialText = normalizedText.length > 100;
  const baseConfidence = hasSubstantialText ? 0.5 : 0.3;
  const penaltyWarnings = hasSubstantialText ? [] : ["NO_SUBSTANTIAL_TEXT"];

  // Compose prompt
  const prompt = STAGE_8_COMMUNICATION_PROMPT(normalizedText);

  // Validate raw communication output
  function isRawCommunicationOutput(data: unknown): data is RawCommunicationOutput {
    if (typeof data !== "object" || data === null) return false;
    const d = data as Record<string, unknown>;
    const requiredKeys = [
      "raw_presentations",
      "raw_technical_writing",
      "raw_mentoring",
      "raw_community",
      "stage_confidence",
      "extraction_warnings",
    ];
    for (const k of requiredKeys) {
      if (!(k in d)) return false;
    }
    if (!Array.isArray(d.raw_presentations)) return false;
    if (typeof d.raw_technical_writing !== "object" || d.raw_technical_writing === null) return false;
    if (typeof d.raw_mentoring !== "object" || d.raw_mentoring === null) return false;
    if (typeof d.raw_community !== "object" || d.raw_community === null) return false;
    if (typeof d.stage_confidence !== "number") return false;
    if (!Array.isArray(d.extraction_warnings)) return false;
    return true;
  }

  const rawDefaults: RawCommunicationOutput = {
    raw_presentations: [],
    raw_technical_writing: {
      has_technical_blog: false,
      blog_platform: null,
      blog_url: null,
      estimated_post_count: null,
      writing_topics: [],
    },
    raw_mentoring: {
      formal_mentoring_role: false,
      junior_coaching_described: false,
      onboarding_described: false,
      mentees_count_estimate: null,
    },
    raw_community: {
      open_source_maintainer: false,
      conference_organizer: false,
      community_names: [],
      stackoverflow_reputation_mentioned: false,
    },
    stage_confidence: 0.1,
    extraction_warnings: ["COMMUNICATION_EXTRACTION_FAILED_AFTER_RETRY"],
  };

  // Claude call
  const result = await callClaudeWithSchema<RawCommunicationOutput>(
    {
      prompt,
      systemPrompt: STAGE_8_COMMUNICATION_SYSTEM_PROMPT,
      maxTokens: 1024,
      temperature: 0.2,
    },
    isRawCommunicationOutput,
    rawDefaults,
    "COMMUNICATION",
  );

  // Pass 1: Normalize audience_scope_raw → AudienceScope
  const presentations: Presentation[] = result.data.raw_presentations.map((p) => ({
    title: p.title,
    event: p.event,
    year: validatePresentationYear(p.year),
    audience_scope: normalizeAudienceScope(p.audience_scope_raw),
    url: p.url,
  }));

  // Pass 2: Publication count from evidence (never from Claude)
  const publicationCount = evidence.publications.length;

  // Build signals object
  const signals: Omit<CommunicationSignals, "communication_tier" | "communication_score" | "publication_count"> = {
    presentations,
    technical_writing: result.data.raw_technical_writing,
    mentoring: result.data.raw_mentoring,
    community: result.data.raw_community,
  };

  // Pass 3: Compute communication_score
  const communicationScore = computeCommunicationScore(signals, publicationCount);

  // Pass 4: Compute communication_tier from score
  const communicationTier = computeCommunicationTier(communicationScore);

  // Calculate stage confidence
  let stageConfidence = baseConfidence;
  stageConfidence = Math.max(0, stageConfidence - result.confidence_penalty);
  stageConfidence = Math.min(1, stageConfidence);

  // Merge warnings
  const allWarnings = [
    ...result.data.extraction_warnings,
    ...result.warnings,
    ...penaltyWarnings,
  ];

  return {
    communication_signals: {
      ...signals,
      communication_tier: communicationTier,
      publication_count: publicationCount,
      communication_score: communicationScore,
    },
    stage_confidence: stageConfidence,
    extraction_warnings: allWarnings,
  };
}

// Normalize audience_scope_raw string to AudienceScope enum.
export function normalizeAudienceScope(raw: string | null): AudienceScope {
  if (!raw) return "internal";

  const s = raw.toLowerCase().trim();

  // Internal
  if (
    s.includes("internal") ||
    s.includes("company") ||
    s.includes("team") ||
    s.includes("all-hands") ||
    s.includes("all hands") ||
    s.includes("org") ||
    s.includes("department") ||
    s.includes("engineering") ||
    s.includes("stakeholder") ||
    s.includes("cross-functional") ||
    s.includes("cross functional")
  ) {
    return "internal";
  }

  // Local
  if (
    s.includes("local") ||
    s.includes("meetup") ||
    s.includes("city") ||
    s.includes("community") ||
    s.includes("user group") ||
    s.includes("study group") ||
    s.includes("workshop")
  ) {
    return "local";
  }

  // National
  if (
    s.includes("national") ||
    s.includes("country") ||
    s.includes("state") ||
    s.includes("regional") ||
    s.includes("pycon") &&
    !s.includes("international")
  ) {
    return "national";
  }

  // International
  if (
    s.includes("international") ||
    s.includes("global") ||
    s.includes("world") ||
    s.includes("neurips") ||
    s.includes("icml") ||
    s.includes("iclr") ||
    s.includes("kdd") ||
    s.includes("aaai") ||
    s.includes("ijcai") ||
    s.includes("cvpr") ||
    s.includes("acl") ||
    s.includes("emnlp") ||
    s.includes("naacl") ||
    s.includes("eccv") ||
    s.includes("iccv") ||
    s.includes("sigir") ||
    s.includes("www") ||
    s.includes("vldb") ||
    s.includes("sigmod") ||
    s.includes("osdi") ||
    s.includes("nsdi") ||
    s.includes("sosp") ||
    s.includes("eurosys") ||
    s.includes("usenix") ||
    s.includes("mlsys") ||
    s.includes("aisec") ||
    s.includes("conference") ||
    s.includes("summit") ||
    s.includes("symposium")
  ) {
    return "international";
  }

  // Default
  return "internal";
}

// Validate presentation year: 1950 ≤ year ≤ current_year + 1
function validatePresentationYear(year: number | null): number | null {
  if (year === null) return null;
  const currentYear = new Date().getFullYear();
  if (year < 1950 || year > currentYear + 1) return null;
  return year;
}

// Compute communication_score from signals.
export function computeCommunicationScore(
  signals: Omit<CommunicationSignals, "communication_tier" | "communication_score" | "publication_count">,
  publicationCount: number,
): number {
  let score = 0;

  // presentations.length > 0: +1
  if (signals.presentations.length > 0) {
    score += 1;
  }

  // national/international presentation: +1
  const hasNationalOrInternational = signals.presentations.some(
    (p) => p.audience_scope === "national" || p.audience_scope === "international"
  );
  if (hasNationalOrInternational) {
    score += 1;
  }

  // technical blog: +1
  if (signals.technical_writing.has_technical_blog) {
    score += 1;
  }

  // publication_count > 0: +1
  if (publicationCount > 0) {
    score += 1;
  }

  // open_source_maintainer: +1
  if (signals.community.open_source_maintainer) {
    score += 1;
  }

  // conference_organizer: +1
  if (signals.community.conference_organizer) {
    score += 1;
  }

  // formal_mentoring_role: +0.5
  if (signals.mentoring.formal_mentoring_role) {
    score += 0.5;
  }

  return score;
}

// Compute communication_tier from score.
export function computeCommunicationTier(score: number): CommunicationTier {
  if (score === 0) return "minimal";
  if (score <= 1.5) return "moderate";
  if (score <= 3.5) return "strong";
  return "exceptional";
}