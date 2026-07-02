// Team Intelligence — Module 3: Team DNA extraction engine.
//
// Input:  TeamDocument (aggregated text from Module 2)
// Output: TeamDNA (skills, domains, seniority, leadership, work-style, strengths,
//         gaps) — every signal carrying a confidence.
//
// ── Domain-agnostic by construction ──────────────────────────────────────────────
// The live matching engine (lib/matching.ts) recognises skills from a giant
// hardcoded, software-only dictionary (TECH_SKILLS). That is exactly what a
// cross-industry team engine must NOT do. Instead we discover signals from *how
// language is used*, which is invariant across industries:
//
//   1. Linguistic cues  — "experience with X", "proficient in X", "skills: …",
//      "led X", "thin on X". These phrasings recur identically in software,
//      finance, healthcare, legal, security, and data-science documents.
//   2. Acronym morphology — ALL-CAPS tokens (AWS, HIPAA, GAAP, SIEM, IFRS, HL7,
//      GDPR, SOC2) are strong competency signals in EVERY field, with zero
//      domain vocabulary encoded.
//   3. Statistical salience — frequency + spread across artifacts.
//
// The only fixed lexicons are cross-industry *structural markers* (seniority
// titles, leadership verbs, culture adjectives, gap phrasings) — not domain
// skills. A skill/domain is never matched against a known-terms list.
//
// ── Semantic (BGE-M3) seam ───────────────────────────────────────────────────────
// A `SemanticBackend` can be injected (mirrors Module 2's injectable extractor).
// When present, `deriveTeamDNAWithSemantics()` uses embeddings to merge
// near-duplicate phrases (e.g. "k8s" ≈ "Kubernetes") and lift confidence. When
// absent, the sync `deriveTeamDNA()` runs pure-lexical. Wiring BGE-M3 later means
// implementing this one interface — no changes to the extraction core.
//
// Never throws — unextractable signals become warnings + lowered confidence.

import type {
  TeamDocument,
  TeamDNA,
  TeamSignal,
  SenioritySignal,
  SeniorityBand,
} from "./types";

// ── Config ───────────────────────────────────────────────────────────────────────

export interface TeamDNAConfig {
  /** Confidence at/above which a skill or domain is promoted to a strength. */
  strength_confidence_threshold: number;
  /** Min members before seniority/overall confidence can exceed "low". */
  min_members_for_confidence: number;
  /** Max signals kept per category (top-N by confidence). */
  max_signals_per_category: number;
  /** Optional semantic backend (BGE-M3 etc.); null → pure lexical. */
  semantic: SemanticBackend | null;
  /** Cosine threshold for merging near-duplicate phrases when semantic is on. */
  semantic_merge_threshold: number;
}

export const DEFAULT_TEAM_DNA_CONFIG: TeamDNAConfig = {
  strength_confidence_threshold: 0.7,
  min_members_for_confidence: 2,
  max_signals_per_category: 25,
  semantic: null,
  semantic_merge_threshold: 0.82,
};

/**
 * Pluggable semantic backend. A BGE-M3 (or any) embedder implements `embed`.
 * Returns one vector per input, or null on failure (callers degrade to lexical).
 */
export interface SemanticBackend {
  name: string;
  embed(texts: string[]): Promise<number[][] | null>;
}

// ── Module-1 contract (kept) ─────────────────────────────────────────────────────

export type DeriveTeamDNA = (team: TeamDocument, config: TeamDNAConfig) => TeamDNA;

// ── Cross-industry structural lexicons (NOT domain vocab) ─────────────────────────

// Generic English + generic hiring noise. Filters extraction, not domain terms.
const STOP = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","by","from",
  "as","is","are","be","been","have","has","had","will","would","our","their","its",
  "we","you","they","it","this","that","these","those","who","which","what","when",
  "team","teams","member","members","strong","good","excellent","experience","skills",
  "skill","knowledge","work","working","years","year","role","across","using","use",
  "including","various","etc","new","other","well","also","both","more","most","some",
  "ability","proficient","proficiency","expertise","familiar","hands","background",
]);

// "<cue> X" → X is a competency. Domain-agnostic phrasings.
const SKILL_CUES = [
  "experience with","experience in","proficient in","proficiency in","skilled in",
  "expertise in","expert in","knowledge of","familiar with","working knowledge of",
  "strong in","strength in","specializing in","specialised in","specialized in",
  "background in","competent in","fluent in","certified in","trained in","versed in",
  "hands-on with","hands on with","deep knowledge of","well-versed in",
];

// "<cue> X" → team operates in domain X.
const DOMAIN_CUES = [
  "in the","within the","across the","industry","sector","domain","space","vertical",
  "market","field of","compliance","regulation","regulations","regulatory","standards",
];

// Seniority titles → band. Cross-industry (Senior Nurse, Senior Analyst, Senior Eng).
const SENIORITY_MARKERS: [string, SeniorityBand][] = [
  ["intern","entry"],["junior","entry"],["entry-level","entry"],["entry level","entry"],
  ["associate","entry"],["graduate","entry"],
  ["mid-level","mid"],["mid level","mid"],["intermediate","mid"],
  ["senior","senior"],["sr.","senior"],["sr ","senior"],["specialist","senior"],
  ["lead","lead"],["principal","lead"],["staff","lead"],["architect","lead"],
  ["head of","executive"],["director","executive"],["vp","executive"],
  ["vice president","executive"],["chief","executive"],["manager","executive"],
  ["executive","executive"],["partner","executive"],
];

// Leadership / ownership verbs+nouns. Domain-agnostic.
const LEADERSHIP_CUES = [
  "led","leads","leading","managed","manages","managing","mentored","mentoring",
  "supervised","supervising","directed","oversaw","overseeing","spearheaded",
  "coordinated","headed","owned ownership","owned","coached","guided","built and led",
  "cross-functional","stakeholder","stakeholders","strategy","strategic","roadmap",
];

// Work-style / culture markers. Broadly cross-industry.
const WORKSTYLE_CUES = [
  "agile","scrum","kanban","waterfall","remote","hybrid","on-site","onsite",
  "distributed","fast-paced","collaborative","collaboration","autonomous",
  "self-directed","data-driven","research-driven","customer-facing","client-facing",
  "on-call","pair programming","detail-oriented","process-oriented","cross-functional",
  "startup","enterprise","regulated","mission-driven","outcome-driven","ownership",
];

// Explicit deficit phrasings → the following span is a gap. Domain-agnostic.
const GAP_CUES = [
  "gap in","gaps in","lacking","lack of","lacks","missing","weak in","weak on",
  "thin on","light on","short on","no experience with","no experience in",
  "limited experience with","limited experience in","without","absence of",
  "shortage of","needs","need to add","looking to add","would benefit from",
  "hiring for","struggle with","struggling with","underrepresented in","no in-house",
];

// ── Text helpers ──────────────────────────────────────────────────────────────────

interface ArtifactText {
  filename: string;
  text: string;
}

function lower(s: string): string {
  return s.toLowerCase();
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Take the noun-phrase-ish span (≤ maxWords) following a matched cue.
 * Skips leading stopwords, stops at a trailing stopword (excluding it), and
 * never crosses a sentence boundary — keeps extracted labels clean.
 */
function spanAfter(text: string, startIdx: number, maxWords: number): string {
  const tail = text.slice(startIdx).replace(/^[\s:,\-–—]+/, "");
  const words: string[] = [];
  for (const raw of tail.split(/\s+/)) {
    const hasSentenceEnd = /[.!?]/.test(raw);
    const w = raw.replace(/[.,;:()"'`]+$/g, "");
    if (!w) break;
    if (STOP.has(lower(w))) {
      if (words.length > 0) break; // trailing stopword → stop, exclude it
      continue;                    // leading stopword → skip
    }
    words.push(w);
    if (hasSentenceEnd) break;     // include this word, then stop at sentence end
    if (words.length >= maxWords) break;
  }
  return words.join(" ").replace(/[.,;:]+$/g, "").trim();
}

// ── Signal accumulation ───────────────────────────────────────────────────────────

interface RawSignal {
  count: number;
  sources: Set<string>;
  byCue: boolean;    // captured via an explicit linguistic cue (strong)
  isAcronym: boolean;
  excerpt?: string;  // first verbatim sentence that produced this signal (provenance)
}

function bump(map: Map<string, RawSignal>, label: string, source: string, opts: { byCue?: boolean; isAcronym?: boolean; excerpt?: string } = {}) {
  const key = label.trim();
  if (!key) return;
  const cur = map.get(key) ?? { count: 0, sources: new Set<string>(), byCue: false, isAcronym: false };
  cur.count += 1;
  cur.sources.add(source);
  cur.byCue = cur.byCue || !!opts.byCue;
  cur.isAcronym = cur.isAcronym || !!opts.isAcronym;
  if (!cur.excerpt && opts.excerpt) cur.excerpt = opts.excerpt;
  map.set(key, cur);
}

/** Verbatim sentence containing `idx`, trimmed for display (never fabricated). */
function sentenceAround(text: string, idx: number, maxLen = 180): string {
  const start = Math.max(0, text.lastIndexOf(".", idx - 1) + 1);
  let end = text.indexOf(".", idx);
  if (end === -1) end = Math.min(text.length, idx + maxLen);
  const raw = text.slice(start, end + 1).replace(/\s+/g, " ").trim();
  return raw.length > maxLen ? raw.slice(0, maxLen - 1).trim() + "…" : raw;
}

/** Confidence for a discovered skill/domain from statistical + structural signals. */
function skillConfidence(s: RawSignal): number {
  const freqScore = 1 - Math.exp(-s.count / 2.5); // 1→0.33, 3→0.70, 6→0.91
  const cueBoost = s.byCue ? 0.2 : 0;
  const acronymBoost = s.isAcronym ? 0.1 : 0;
  const spreadBoost = Math.min(0.15, (s.sources.size - 1) * 0.08);
  return round2(clamp01(0.32 + freqScore * 0.62 + cueBoost + acronymBoost + spreadBoost));
}

function toSignals(map: Map<string, RawSignal>, maxN: number): TeamSignal[] {
  return [...map.entries()]
    .map(([label, s]) => ({
      label,
      confidence: skillConfidence(s),
      evidence_count: s.count,
      sources: [...s.sources],
      evidence: s.excerpt ? [s.excerpt] : undefined,
    }))
    .sort((a, b) => b.confidence - a.confidence || b.evidence_count - a.evidence_count)
    .slice(0, maxN);
}

// ── Extractors (each never throws; failures → warnings) ───────────────────────────

function extractSkills(arts: ArtifactText[], warnings: string[]): TeamSignal[] {
  const map = new Map<string, RawSignal>();
  try {
    for (const { filename, text } of arts) {
      const lc = lower(text);

      // 1) Cue-driven: "<cue> X, Y and Z"
      for (const cue of SKILL_CUES) {
        let from = 0;
        for (;;) {
          const idx = lc.indexOf(cue, from);
          if (idx === -1) break;
          from = idx + cue.length;
          const span = spanAfter(text, idx + cue.length, 4);
          const excerpt = sentenceAround(text, idx);
          // split short comma/and lists
          for (const part of span.split(/,|\band\b|\bor\b|\//i)) {
            const term = part.trim();
            if (term.length >= 2 && !STOP.has(lower(term))) {
              bump(map, term, filename, { byCue: true, excerpt });
            }
          }
        }
      }

      // 2) "skills: a, b, c" / "technologies: …" colon-lists (label-agnostic)
      for (const m of text.matchAll(/(?:skills?|technologies|tools|stack|competencies|expertise)\s*[:\-]\s*([^\n.]{3,140})/gi)) {
        for (const part of m[1].split(/[,;/|]|\band\b/i)) {
          const term = part.trim();
          if (term.length >= 2 && !STOP.has(lower(term))) bump(map, term, filename, { byCue: true });
        }
      }

      // 3) Acronyms — ALL-CAPS 2–6 chars (AWS, HIPAA, GAAP, SIEM, IFRS, HL7 …)
      for (const m of text.matchAll(/\b([A-Z][A-Z0-9]{1,5})\b/g)) {
        const a = m[1];
        if (/^\d+$/.test(a)) continue;
        bump(map, a, filename, { isAcronym: true });
      }
    }
  } catch (e) {
    warnings.push(`skill extraction degraded: ${errMsg(e)}`);
  }
  return toSignals(map, Infinity);
}

function extractDomains(arts: ArtifactText[], warnings: string[]): TeamSignal[] {
  const map = new Map<string, RawSignal>();
  try {
    for (const { filename, text } of arts) {
      const lc = lower(text);
      for (const cue of DOMAIN_CUES) {
        let from = 0;
        for (;;) {
          const idx = lc.indexOf(cue, from);
          if (idx === -1) break;
          from = idx + cue.length;
          // For trailing-noun cues ("compliance","industry") grab the word BEFORE;
          // for leading cues ("in the","field of") grab the span AFTER.
          const trailing = /compliance|regulation|standards|industry|sector/.test(cue);
          const term = trailing
            ? lastWordsBefore(text, idx, 2)
            : spanAfter(text, idx + cue.length, 3);
          const t = term.trim();
          if (t.length >= 3 && !STOP.has(lower(t))) bump(map, t, filename, { byCue: true });
        }
      }
    }
  } catch (e) {
    warnings.push(`domain extraction degraded: ${errMsg(e)}`);
  }
  return toSignals(map, Infinity);
}

function lastWordsBefore(text: string, idx: number, maxWords: number): string {
  const head = text.slice(0, idx).replace(/[\s:,\-–—]+$/, "");
  const words = head.split(/\s+/).slice(-maxWords).map((w) => w.replace(/[.,;:()"'`]+$/g, ""));
  return words.filter((w) => w && !STOP.has(lower(w))).join(" ");
}

function extractCueSignals(arts: ArtifactText[], cues: string[], warnings: string[], tag: string): TeamSignal[] {
  const map = new Map<string, RawSignal>();
  try {
    for (const { filename, text } of arts) {
      const lc = lower(text);
      for (const cue of cues) {
        let from = 0;
        for (;;) {
          const idx = lc.indexOf(cue, from);
          if (idx === -1) break;
          from = idx + cue.length;
          bump(map, cue, filename, { byCue: true });
        }
      }
    }
  } catch (e) {
    warnings.push(`${tag} extraction degraded: ${errMsg(e)}`);
  }
  return toSignals(map, Infinity);
}

function extractGaps(arts: ArtifactText[], warnings: string[]): TeamSignal[] {
  const map = new Map<string, RawSignal>();
  try {
    for (const { filename, text } of arts) {
      const lc = lower(text);
      for (const cue of GAP_CUES) {
        let from = 0;
        for (;;) {
          const idx = lc.indexOf(cue, from);
          if (idx === -1) break;
          from = idx + cue.length;
          const span = spanAfter(text, idx + cue.length, 3);
          const t = span.trim();
          if (t.length >= 2 && !STOP.has(lower(t))) bump(map, t, filename, { byCue: true, excerpt: sentenceAround(text, idx) });
        }
      }
    }
  } catch (e) {
    warnings.push(`gap extraction degraded: ${errMsg(e)}`);
  }
  // Gaps are explicit statements → confidence leans on cue presence, not frequency.
  return [...map.entries()]
    .map(([label, s]) => ({
      label,
      confidence: round2(clamp01(0.55 + Math.min(0.3, (s.count - 1) * 0.12) + Math.min(0.1, (s.sources.size - 1) * 0.05))),
      evidence_count: s.count,
      sources: [...s.sources],
      evidence: s.excerpt ? [s.excerpt] : undefined,
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

function extractSeniority(arts: ArtifactText[], memberCount: number, minMembers: number, warnings: string[]): SenioritySignal {
  const bandCounts = new Map<SeniorityBand, number>();
  let maxYears: number | null = null;
  try {
    for (const { text } of arts) {
      const lc = lower(text);
      for (const [marker, band] of SENIORITY_MARKERS) {
        let from = 0;
        for (;;) {
          const idx = lc.indexOf(marker, from);
          if (idx === -1) break;
          from = idx + marker.length;
          bandCounts.set(band, (bandCounts.get(band) ?? 0) + 1);
        }
      }
      for (const m of text.matchAll(/(\d{1,2})\+?\s*years?/gi)) {
        const y = parseInt(m[1], 10);
        if (!Number.isNaN(y)) maxYears = Math.max(maxYears ?? 0, y);
      }
    }
  } catch (e) {
    warnings.push(`seniority extraction degraded: ${errMsg(e)}`);
  }

  const total = [...bandCounts.values()].reduce((a, b) => a + b, 0);
  const distribution = [...bandCounts.entries()]
    .map(([band, c]) => ({ band, weight: round2(c / total) }))
    .sort((a, b) => b.weight - a.weight);

  const dominant_band: SeniorityBand = distribution[0]?.band ?? "unknown";
  // Confidence tempered by evidence volume and (if known) team size.
  let confidence = total === 0 ? 0 : clamp01(1 - Math.exp(-total / 3));
  if (memberCount > 0 && memberCount < minMembers) confidence *= 0.7;
  if (total === 0) warnings.push("no seniority signals detected");

  return {
    dominant_band,
    distribution: distribution.length ? distribution : [{ band: "unknown", weight: 1 }],
    max_years_experience: maxYears,
    confidence: round2(confidence),
  };
}

// ── Member-count estimate (best-effort, cross-industry) ───────────────────────────

function estimateMemberCount(doc: TeamDocument, arts: ArtifactText[]): number {
  const text = doc.raw_text ?? "";
  const m = text.match(/team of\s+(\d{1,3})/i) ?? text.match(/(\d{1,3})[\s-]*(?:person|member|people|engineers?|staff)\b/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n) && n > 0 && n < 1000) return n;
  }
  // Fall back to count of parsed resume-like artifacts (weak proxy).
  const resumeish = arts.filter((a) => /resume|cv|profile/i.test(a.filename)).length;
  return resumeish;
}

// ── Strengths (derived, not extracted) ────────────────────────────────────────────

function deriveStrengths(skills: TeamSignal[], domains: TeamSignal[], threshold: number, maxN: number): TeamSignal[] {
  return [...skills, ...domains]
    .filter((s) => s.confidence >= threshold && s.evidence_count >= 2)
    .sort((a, b) => (b.confidence * b.evidence_count) - (a.confidence * a.evidence_count))
    .slice(0, maxN);
}

// ── Public: lexical (sync) — honours the DeriveTeamDNA contract ───────────────────

export const deriveTeamDNA: DeriveTeamDNA = (team, config = DEFAULT_TEAM_DNA_CONFIG) => {
  const warnings: string[] = [];
  const arts: ArtifactText[] = (team.artifacts ?? [])
    .filter((a) => a.status === "parsed" && a.text.trim().length > 0)
    .map((a) => ({ filename: a.filename, text: a.text }));

  // Fall back to combined raw_text when no per-artifact text survived.
  if (arts.length === 0 && (team.raw_text ?? "").trim().length > 0) {
    arts.push({ filename: "combined", text: team.raw_text! });
  }
  if (arts.length === 0) warnings.push("no usable team text — DNA is empty");

  const maxN = config.max_signals_per_category;
  const member_count = estimateMemberCount(team, arts);

  const skills = extractSkills(arts, warnings).slice(0, maxN);
  const domains = extractDomains(arts, warnings).slice(0, maxN);
  const leadership_signals = extractCueSignals(arts, LEADERSHIP_CUES, warnings, "leadership").slice(0, maxN);
  const work_style_signals = extractCueSignals(arts, WORKSTYLE_CUES, warnings, "work-style").slice(0, maxN);
  const gaps = extractGaps(arts, warnings).slice(0, maxN);
  const seniority = extractSeniority(arts, member_count, config.min_members_for_confidence, warnings);
  const strengths = deriveStrengths(skills, domains, config.strength_confidence_threshold, maxN);

  const overall_confidence = computeOverall({ skills, domains, seniority, leadership_signals, arts });

  return {
    team_id: team.team_id,
    member_count,
    skills,
    domains,
    seniority,
    leadership_signals,
    work_style_signals,
    strengths,
    gaps,
    overall_confidence,
    extraction_backend: "lexical",
    derivation_warnings: warnings,
  };
};

function computeOverall(p: {
  skills: TeamSignal[]; domains: TeamSignal[]; seniority: SenioritySignal;
  leadership_signals: TeamSignal[]; arts: ArtifactText[];
}): number {
  if (p.arts.length === 0) return 0;
  const top = [...p.skills, ...p.domains].slice(0, 10);
  const meanTop = top.length ? top.reduce((s, x) => s + x.confidence, 0) / top.length : 0;
  const coverage = clamp01(
    (p.skills.length ? 0.4 : 0) +
    (p.domains.length ? 0.2 : 0) +
    (p.seniority.confidence > 0 ? 0.2 : 0) +
    (p.leadership_signals.length ? 0.2 : 0),
  );
  return round2(clamp01(meanTop * 0.6 + coverage * 0.4));
}

// ── Public: semantic (async) — BGE-M3 seam ────────────────────────────────────────
//
// Runs the lexical pass, then (if a backend is present) embeds the skill labels
// and greedily merges near-duplicates by cosine, summing evidence and keeping the
// higher confidence. Degrades to the lexical result if embeddings are unavailable.
export async function deriveTeamDNAWithSemantics(
  team: TeamDocument,
  config: TeamDNAConfig = DEFAULT_TEAM_DNA_CONFIG,
): Promise<TeamDNA> {
  const base = deriveTeamDNA(team, config);
  const backend = config.semantic;
  if (!backend || base.skills.length < 2) return base;

  try {
    const labels = base.skills.map((s) => s.label);
    const vectors = await backend.embed(labels);
    if (!vectors || vectors.length !== labels.length) {
      return { ...base, derivation_warnings: [...base.derivation_warnings, "semantic backend returned no vectors — using lexical DNA"] };
    }
    const merged = mergeBySimilarity(base.skills, vectors, config.semantic_merge_threshold);
    return {
      ...base,
      skills: merged.slice(0, config.max_signals_per_category),
      extraction_backend: "hybrid",
    };
  } catch (e) {
    return { ...base, derivation_warnings: [...base.derivation_warnings, `semantic refinement failed: ${errMsg(e)}`] };
  }
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function mergeBySimilarity(signals: TeamSignal[], vectors: number[][], threshold: number): TeamSignal[] {
  const used = new Array(signals.length).fill(false);
  const out: TeamSignal[] = [];
  for (let i = 0; i < signals.length; i++) {
    if (used[i]) continue;
    const label = signals[i].label;
    let confidence = signals[i].confidence;
    let evidence_count = signals[i].evidence_count;
    const sources = new Set(signals[i].sources);
    used[i] = true;
    for (let j = i + 1; j < signals.length; j++) {
      if (used[j]) continue;
      if (cosine(vectors[i], vectors[j]) >= threshold) {
        used[j] = true;
        evidence_count += signals[j].evidence_count;
        confidence = Math.max(confidence, signals[j].confidence);
        signals[j].sources.forEach((s) => sources.add(s));
      }
    }
    out.push({ label, confidence: round2(clamp01(confidence)), evidence_count, sources: [...sources] });
  }
  return out.sort((a, b) => b.confidence - a.confidence || b.evidence_count - a.evidence_count);
}

// ── util ──────────────────────────────────────────────────────────────────────────

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "unknown error";
}
