// Text normalisation utilities for Stage 0 (Pre-flight).
// All functions are pure — no side effects, no Claude calls.

// Cleaning pass 1: Convert to UTF-8, replace smart quotes, em-dashes,
// non-breaking spaces with ASCII equivalents.
export function encodeNormalize(text: string): string {
  return text
    .replace(/‘|’/g, "'")   // ' '
    .replace(/“|”/g, '"')   // " "
    .replace(/–|—/g, "-")   // – —
    .replace(/ /g, " ")          // non-breaking space
    .replace(/•/g, "-")          // bullet •
    .replace(/…/g, "...")        // ellipsis …
    .replace(/·/g, "-")          // middle dot ·
    .replace(/[​-‍﻿]/g, ""); // zero-width chars
}

// Cleaning pass 2: Reduce 3+ blank lines to 2, strip trailing whitespace per line.
export function collapseWhitespace(text: string): string {
  // Strip trailing whitespace from each line
  const lines = text.split("\n").map((l) => l.trimEnd());
  // Collapse 3+ consecutive blank lines to 2
  const result: string[] = [];
  let blankRun = 0;
  for (const line of lines) {
    if (line === "") {
      blankRun++;
      if (blankRun <= 2) result.push(line);
    } else {
      blankRun = 0;
      result.push(line);
    }
  }
  return result.join("\n");
}

// Cleaning pass 3: Strip page numbers ("Page 1 of 3"), header/footer repeats,
// watermarks.
export function removeArtefacts(text: string): string {
  return text
    // "Page N of M" variants
    .replace(/\bpage\s+\d+\s+of\s+\d+\b/gi, "")
    .replace(/\bpage\s+\d+\b/gi, "")
    .replace(/\b\d+\s*\/\s*\d+\b(?=\s*$)/gm, "") // "1/3" at end of line
    // Common watermarks
    .replace(/\bconfidential\b/gi, "")
    .replace(/\bdraft\b(?=\s*$)/gim, "")
    // Repeating horizontal rules that are pure punctuation
    .replace(/^[-=_*]{4,}\s*$/gm, "")
    // CV/Resume header keywords that repeat on each page
    .replace(/^curriculum vitae\s*$/gim, "")
    .replace(/^resume\s*$/gim, "")
    // Trailing lone digits (page numbers at bottom of pages)
    .replace(/^\s*\d{1,3}\s*$/gm, "");
}

// Cleaning pass 4: Apply OCR substitutions for image-sourced documents.
// l→1 in numeric contexts, O→0, rn→m.
export function ocrCorrect(text: string): string {
  return text
    // rn → m (common OCR artifact in words like "rn" misread for "m")
    .replace(/\brn([a-z])/g, "m$1")
    // O → 0 between digits: e.g. "2O19" → "2019"
    .replace(/(\d)O(\d)/g, "$10$2")
    // l → 1 between digits: e.g. "2l18" → "2118"
    .replace(/(\d)l(\d)/g, "$11$2")
    // l at start of a number-like token: "l00" → "100"
    .replace(/\bl(\d{2,})/g, "1$1")
    // I → 1 between digits
    .replace(/(\d)I(\d)/g, "$11$2");
}

// Cleaning pass 5: Standardise line endings to \n.
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

// Compute ratio of alphabetic characters to all non-whitespace characters.
// Below 0.35 → document is too corrupted to process.
export function computeLetterRatio(text: string): number {
  const nonWs = text.replace(/\s/g, "");
  if (nonWs.length === 0) return 0;
  const letters = nonWs.replace(/[^a-zA-Z]/g, "");
  return letters.length / nonWs.length;
}

// Estimate word count from normalized text.
export function estimateWordCount(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

// Estimate average line length from normalized text.
export function estimateAvgLineLength(text: string): number {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return 0;
  const total = lines.reduce((sum, l) => sum + l.length, 0);
  return total / lines.length;
}

// Common canonical section headers used for structured-section detection.
const SECTION_HEADER_PATTERNS = [
  /\bwork experience\b/i,
  /\bprofessional experience\b/i,
  /\bemployment history\b/i,
  /\bcareer history\b/i,
  /\bexperience\b/i,
  /\bskills\b/i,
  /\btechnical skills\b/i,
  /\bcore competencies\b/i,
  /\btechnologies\b/i,
  /\bprojects\b/i,
  /\beducation\b/i,
  /\bacademic background\b/i,
  /\bqualifications\b/i,
  /\bpublications\b/i,
  /\bawards\b/i,
  /\bachievements\b/i,
  /\blanguages\b/i,
  /\bsummary\b/i,
  /\bobjective\b/i,
  /\bprofile\b/i,
  /\babout me\b/i,
];

// Heuristic: detect if text has structured resume sections.
// Returns true if at least 2 canonical section headers are found.
export function hasStructuredSections(text: string): boolean {
  const lines = text.split("\n");
  let matchCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    // Only consider short lines that look like headings (not prose)
    if (trimmed.length === 0 || trimmed.length > 60) continue;
    for (const pattern of SECTION_HEADER_PATTERNS) {
      if (pattern.test(trimmed)) {
        matchCount++;
        break;
      }
    }
    if (matchCount >= 2) return true;
  }
  return false;
}

// Common English function words used for lightweight language detection.
const ENGLISH_MARKERS = new Set([
  "the", "and", "of", "to", "in", "a", "is", "that", "for", "with",
  "on", "at", "by", "an", "be", "or", "as", "from", "was", "are",
  "have", "has", "had", "been", "will", "would", "could", "should",
  "experience", "skills", "education", "work", "role", "team", "project",
  "developed", "managed", "led", "built", "responsible", "using",
]);

// Detect the language of the text.
// Returns { language: ISO-639-1 code, confidence: 0-1 }.
// Fallback: { language: "en", confidence: 0 } when detection fails.
export function detectLanguage(text: string): { language: string; confidence: number } {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (words.length < 10) return { language: "en", confidence: 0 };

  const sample = words.slice(0, 200);
  const matches = sample.filter((w) => ENGLISH_MARKERS.has(w)).length;
  const ratio = matches / sample.length;

  // ratio >= 0.12 strongly suggests English (resume text has many proper nouns/tech terms)
  if (ratio >= 0.12) return { language: "en", confidence: Math.min(1, ratio * 5) };

  // Heuristic checks for other common scripts
  const hasNonLatin = /[Ѐ-ӿ一-鿿؀-ۿऀ-ॿ]/.test(text);
  if (hasNonLatin) return { language: "unknown", confidence: 0.7 };

  // Low English marker ratio but Latin script — ambiguous, still guess English
  return { language: "en", confidence: Math.max(0, ratio * 4) };
}
