// Stage 1 — Section Detection
// No Claude call. Regex + heuristic heading detection.
// Partitions normalized_text into named sections consumed by all downstream stages.

import type {
  PreflightOutput,
  SectionDetectionOutput,
  SectionMap,
} from "@/engines/shared/types/stage-outputs";

// Canonical section header names (case-insensitive, fuzzy-matched).
// Each entry maps a canonical key to its known surface forms.
export const CANONICAL_SECTION_NAMES: Record<keyof Omit<SectionMap, "other">, string[]> = {
  header: [],  // Detected by position (top of doc), not by keyword
  objective_summary: [
    "summary",
    "professional summary",
    "objective",
    "career objective",
    "profile",
    "professional profile",
    "about me",
    "about",
    "overview",
    "executive summary",
  ],
  experience: [
    "work experience",
    "professional experience",
    "employment history",
    "career history",
    "experience",
    "work history",
    "relevant experience",
    "internship",
    "internships",
  ],
  skills: [
    "skills",
    "technical skills",
    "core competencies",
    "competencies",
    "technologies",
    "expertise",
    "technical expertise",
    "tools",
    "tools & technologies",
    "key skills",
    "skills & expertise",
  ],
  projects: [
    "projects",
    "personal projects",
    "side projects",
    "open source",
    "open-source",
    "portfolio",
    "key projects",
    "academic projects",
    "notable projects",
  ],
  education: [
    "education",
    "academic background",
    "academic qualifications",
    "qualifications",
    "educational background",
    "academics",
  ],
  publications: [
    "publications",
    "research",
    "papers",
    "articles",
    "research papers",
    "journal articles",
    "conference papers",
    "research & publications",
  ],
  awards: [
    "awards",
    "achievements",
    "honors",
    "honours",
    "recognition",
    "awards & recognition",
    "awards & achievements",
    "accomplishments",
    "certifications",
    "certificates",
    "licenses & certifications",
  ],
  languages: [
    "languages",
    "spoken languages",
    "language proficiency",
    "linguistic skills",
  ],
};

// Build a flat lookup: normalized surface form → canonical key
const SURFACE_TO_KEY: Map<string, keyof Omit<SectionMap, "other">> = new Map();
for (const [key, surfaces] of Object.entries(CANONICAL_SECTION_NAMES) as Array<
  [keyof Omit<SectionMap, "other">, string[]]
>) {
  for (const surface of surfaces) {
    SURFACE_TO_KEY.set(surface.toLowerCase().trim(), key);
  }
}

// Critical sections that contribute to confidence penalty when missing
const CRITICAL_SECTIONS: Array<keyof SectionMap> = ["experience", "skills"];

// Run Stage 1.
// Three-pass algorithm:
//   Pass 1 — Heading detection (all-caps lines, lines followed by ---/===,
//             lines matching canonical names)
//   Pass 2 — Boundary assignment (text between headers → earlier header's section)
//   Pass 3 — Confidence computation
//
// Failure modes:
//   No sections detected → treat full text as "experience"; add warning NO_SECTIONS_DETECTED
//   section_confidence < 0.3 → all sections receive full text; confidence penalty downstream
export function runStage1Sections(preflight: PreflightOutput): SectionDetectionOutput {
  const text = preflight.normalized_text;

  // Pass 1: Detect headings
  const headings = detectHeadings(text);

  // No sections detected — fallback: full text → experience
  if (headings.length === 0) {
    const fallbackMap: SectionMap = {
      header: null,
      objective_summary: null,
      experience: text,
      skills: null,
      projects: null,
      education: null,
      publications: null,
      awards: null,
      languages: null,
      other: [],
    };
    return {
      section_map: fallbackMap,
      detected_section_count: 0,
      missing_critical_sections: CRITICAL_SECTIONS.slice(),
      section_confidence: 0.2,  // Clamped minimum
    };
  }

  // Pass 2: Boundary assignment
  const lines = text.split("\n");
  const { sectionMap, ambiguousBoundaryCount } = assignBoundaries(text, lines, headings);

  // Pass 3: Confidence computation
  const sectionConfidence = computeSectionConfidence(sectionMap, ambiguousBoundaryCount);

  // If confidence < 0.3 — all sections receive full text
  const finalMap =
    sectionConfidence < 0.3
      ? floodFillAllSections(text, sectionMap)
      : sectionMap;

  const detectedSectionCount = Object.entries(finalMap)
    .filter(([k, v]) => k !== "other" && v !== null)
    .length;

  const missingCritical = CRITICAL_SECTIONS.filter(
    (k) => finalMap[k as keyof SectionMap] === null,
  );

  return {
    section_map: finalMap,
    detected_section_count: detectedSectionCount,
    missing_critical_sections: missingCritical,
    section_confidence: sectionConfidence,
  };
}

// Pass 1: Detect heading lines using heuristics.
// Returns list of { line, startIndex, canonicalKey } sorted by startIndex.
function detectHeadings(
  text: string,
): Array<{ line: string; startIndex: number; canonicalKey: keyof SectionMap | null }> {
  const lines = text.split("\n");
  const results: Array<{ line: string; startIndex: number; canonicalKey: keyof SectionMap | null }> = [];
  let pos = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Only consider reasonably short lines as potential headings
    if (trimmed.length === 0 || trimmed.length > 80) {
      pos += line.length + 1;
      continue;
    }

    let isHeading = false;
    let canonicalKey: keyof SectionMap | null = null;

    // Heuristic 1: All-caps line (min 3 chars, not just an abbreviation artifact)
    if (trimmed.length >= 3 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
      isHeading = true;
    }

    // Heuristic 2: Line followed by a "---" or "===" underline
    if (!isHeading && i + 1 < lines.length) {
      const nextTrimmed = lines[i + 1].trim();
      if (/^[-=]{3,}$/.test(nextTrimmed)) {
        isHeading = true;
      }
    }

    // Heuristic 3: Fuzzy match against canonical section names
    const normalized = trimmed.toLowerCase().replace(/[:\-–—]+$/, "").trim();
    const mappedKey = SURFACE_TO_KEY.get(normalized);
    if (mappedKey !== undefined) {
      isHeading = true;
      canonicalKey = mappedKey;
    }

    // If heading detected but no canonical key yet, try to derive from all-caps/underlined text
    if (isHeading && canonicalKey === null) {
      const fallbackKey = SURFACE_TO_KEY.get(trimmed.toLowerCase().replace(/[:\-–—]+$/, "").trim());
      canonicalKey = fallbackKey ?? null;
    }

    if (isHeading) {
      results.push({ line: trimmed, startIndex: pos, canonicalKey });
    }

    pos += line.length + 1;  // +1 for the \n
  }

  return results;
}

// Pass 2: Assign text boundaries between detected headings to section slots.
function assignBoundaries(
  text: string,
  lines: string[],
  headings: Array<{ line: string; startIndex: number; canonicalKey: keyof SectionMap | null }>,
): { sectionMap: SectionMap; ambiguousBoundaryCount: number } {
  const sectionMap: SectionMap = {
    header: null,
    objective_summary: null,
    experience: null,
    skills: null,
    projects: null,
    education: null,
    publications: null,
    awards: null,
    languages: null,
    other: [],
  };

  let ambiguousBoundaryCount = 0;

  // Extract the document header: everything before the first heading
  if (headings[0].startIndex > 0) {
    sectionMap.header = text.slice(0, headings[0].startIndex).trim() || null;
  }

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextStart = i + 1 < headings.length ? headings[i + 1].startIndex : text.length;

    // The content of this section is the text after the heading line up to the next heading
    // Skip past the heading line itself
    const headingEndInText = heading.startIndex + heading.line.length;
    const sectionContent = text.slice(headingEndInText, nextStart).trim();

    if (!sectionContent) continue;

    const key = heading.canonicalKey;

    if (key === null) {
      // Ambiguous heading — push to "other"
      sectionMap.other.push(sectionContent);
      ambiguousBoundaryCount++;
      continue;
    }

    if (key === "header") {
      sectionMap.header = sectionMap.header
        ? sectionMap.header + "\n" + sectionContent
        : sectionContent;
    } else {
      const sm = sectionMap as unknown as Record<string, string | null>;
      if (sm[key] !== null && sm[key] !== undefined) {
        sm[key] = sm[key] + "\n\n" + sectionContent;
        ambiguousBoundaryCount++;
      } else {
        sm[key] = sectionContent;
      }
    }
  }

  void lines;
  return { sectionMap, ambiguousBoundaryCount };
}

// When confidence is too low, copy full text to every null section slot.
function floodFillAllSections(text: string, existing: SectionMap): SectionMap {
  return {
    header: existing.header,
    objective_summary: existing.objective_summary ?? text,
    experience: existing.experience ?? text,
    skills: existing.skills ?? text,
    projects: existing.projects ?? text,
    education: existing.education ?? text,
    publications: existing.publications ?? text,
    awards: existing.awards ?? text,
    languages: existing.languages ?? text,
    other: existing.other,
  };
}

// Pass 3: Compute section_confidence from detected sections.
// Base = 1.0; subtract per missing critical section, ambiguous boundary.
function computeSectionConfidence(
  sectionMap: SectionMap,
  ambiguousBoundaryCount: number,
): number {
  let confidence = 1.0;

  for (const key of CRITICAL_SECTIONS) {
    if (sectionMap[key as keyof SectionMap] === null) {
      confidence -= 0.1;
    }
  }

  confidence -= ambiguousBoundaryCount * 0.05;

  return Math.max(0.2, confidence);
}
