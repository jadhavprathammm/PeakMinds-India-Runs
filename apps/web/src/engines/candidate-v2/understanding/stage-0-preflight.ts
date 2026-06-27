// Stage 0 — Pre-flight & Normalization
// No Claude call. Pure deterministic text cleaning.
// Aborts pipeline on unrecoverable document quality issues.

import type { PreflightInput, PreflightOutput } from "@/engines/shared/types/stage-outputs";
import {
  encodeNormalize,
  collapseWhitespace,
  removeArtefacts,
  ocrCorrect,
  normalizeLineEndings,
  computeLetterRatio,
  estimateWordCount,
  estimateAvgLineLength,
  hasStructuredSections,
  detectLanguage,
} from "@/engines/shared/utils/text-utils";

// Pipeline error thrown when a document is unrecoverable.
// The pipeline catches this and returns a safe error response.
export class PreflightError extends Error {
  constructor(
    public readonly code:
      | "DOCUMENT_TOO_CORRUPTED"
      | "DOCUMENT_TOO_SHORT"
      | "OCR_CONFIDENCE_TOO_LOW",
    message: string,
  ) {
    super(message);
    this.name = "PreflightError";
  }
}

// Run Stage 0.
// Applies five cleaning passes in order:
//   1. Encoding normalisation
//   2. Whitespace collapse
//   3. Artefact removal
//   4. OCR correction (if source_format === "image")
//   5. Line normalisation
//
// Failure modes (abort):
//   ocr_confidence < 0.25         → throw PreflightError("OCR_CONFIDENCE_TOO_LOW") — checked from input
//   char_count < 150 (post-clean) → throw PreflightError("DOCUMENT_TOO_SHORT")
//   letter_ratio < 0.35           → throw PreflightError("DOCUMENT_TOO_CORRUPTED")
//
// Warning-only (continue):
//   char_count > 100_000          → truncate + log "DOCUMENT_TRUNCATED"
//   detected_language !== "en"    → log "NON_ENGLISH_RESUME"
export function runStage0Preflight(input: PreflightInput): PreflightOutput {
  const log: string[] = [];

  // Check OCR confidence from input metadata before any cleaning
  if (
    input.ocr_confidence !== undefined &&
    input.ocr_confidence !== null &&
    input.ocr_confidence < 0.25
  ) {
    throw new PreflightError(
      "OCR_CONFIDENCE_TOO_LOW",
      `OCR confidence ${input.ocr_confidence} is below minimum threshold 0.25`,
    );
  }

  // Pass 1 — Encoding normalisation
  let text = encodeNormalize(input.raw_text);
  log.push("pass1:encoding_normalize");

  // Pass 2 — Whitespace collapse
  text = collapseWhitespace(text);
  log.push("pass2:whitespace_collapse");

  // Pass 3 — Artefact removal
  text = removeArtefacts(text);
  log.push("pass3:artefact_removal");

  // Pass 4 — OCR correction (only for image-sourced documents)
  if (input.source_format === "image") {
    text = ocrCorrect(text);
    log.push("pass4:ocr_correct");
  } else {
    log.push("pass4:ocr_skipped");
  }

  // Pass 5 — Line normalisation
  text = normalizeLineEndings(text);
  log.push("pass5:line_normalize");

  // Truncate oversized documents before quality checks
  if (text.length > 100_000) {
    text = text.slice(0, 100_000);
    log.push("warning:DOCUMENT_TRUNCATED");
  }

  // Failure: document too short after cleaning
  if (text.length < 150) {
    throw new PreflightError(
      "DOCUMENT_TOO_SHORT",
      `Document has only ${text.length} characters after cleaning (minimum: 150)`,
    );
  }

  // Compute quality signals
  const letterRatio = computeLetterRatio(text);
  const wordCount = estimateWordCount(text);
  const avgLineLength = estimateAvgLineLength(text);
  const structuredSections = hasStructuredSections(text);
  const lineCount = text.split("\n").length;
  // ~200 words per minute reading speed
  const readingTimeMinutes = wordCount / 200;

  // Detect encoding issues: presence of replacement char or high non-ASCII ratio
  const encodingIssuesDetected =
    text.includes("�") ||
    (text.replace(/[^\x00-\x7F]/g, "").length / Math.max(text.length, 1) < 0.8 &&
      text.replace(/[^\x00-\x7F]/g, "").length / Math.max(text.length, 1) < 0.6);

  // Detect OCR artefacts: runs of garbled chars, l/O substitutions in numeric context
  const ocrArtefactsDetected =
    input.source_format === "image" &&
    /(\d[lOI]\d|[lOI]\d{2,})/.test(text);

  // Failure: too few letter characters → corrupted / binary / garbled
  if (letterRatio < 0.35) {
    throw new PreflightError(
      "DOCUMENT_TOO_CORRUPTED",
      `Letter ratio ${letterRatio.toFixed(3)} is below minimum threshold 0.35`,
    );
  }

  // Language detection — warning only, pipeline continues
  const langResult = detectLanguage(text);
  if (langResult.language !== "en") {
    log.push("warning:NON_ENGLISH_RESUME");
  }

  const documentQuality = computeDocumentQuality(letterRatio, wordCount, structuredSections);

  return {
    normalized_text: text,
    char_count: text.length,
    word_count: wordCount,
    line_count: lineCount,
    detected_language: langResult.language,
    language_confidence: langResult.confidence,
    document_quality: documentQuality,
    quality_signals: {
      letter_ratio: letterRatio,
      avg_line_length: avgLineLength,
      has_structured_sections: structuredSections,
      estimated_reading_time_minutes: readingTimeMinutes,
      encoding_issues_detected: encodingIssuesDetected,
      ocr_artefacts_detected: ocrArtefactsDetected,
    },
    normalization_log: log,
  };
}

// Derive document_quality label from computed signals.
function computeDocumentQuality(
  letterRatio: number,
  wordCount: number,
  structuredSections: boolean,
): PreflightOutput["document_quality"] {
  if (letterRatio >= 0.75 && wordCount >= 300 && structuredSections) {
    return "excellent";
  }
  if (letterRatio >= 0.70 && wordCount >= 200 && structuredSections) {
    return "good";
  }
  if (letterRatio >= 0.50 && wordCount >= 80) {
    return "acceptable";
  }
  return "poor";
}
