// Deterministic JD ↔ resume matching engine.
// Shared by /api/analyze (single-candidate) and /api/rank-candidates (batch).
//
// Three scoring layers, stacked and additive:
//   1. Exact keyword match   – term literal substring present in resume text
//   2. Lemmatised match      – stem-stripped form catches morphological variants
//                              (organize / organizing / organization → same stem)
//   3. Semantic bonus        – cosine(jd_embedding, resume_embedding) via MiniLM
//      Passed in by the caller; undefined = keyword-only fallback (safe + fast).
//
// Score formula:
//   keywordScore  = (exact / N) × 100  +  (lemmaOnly / N) × 50
//   semanticBonus = max(0, (cosine − 0.40) / 0.60) × 40   [0 … 40 extra points]
//   final         = clamp(28, 88, round(keywordScore + semanticBonus))

// ── Stop words ──────────────────────────────────────────────────────────────────

const STOP = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with",
  "by","from","as","is","was","are","be","been","have","has","had","will",
  "would","could","should","may","might","must","do","did","does","not",
  "this","that","these","those","we","you","they","it","our","their","its",
  "what","which","who","how","when","where","why","all","any","such","into",
  "through","during","including","while","role","position","job","candidate",
  "team","company","work","ability","skills","skill","experience","required",
  "preferred","good","strong","excellent","well","knowledge","understanding",
  "able","also","each","about","both","more","most","over","under","above",
  "below","some","other","new","high","level","years","year",
  // Document-structure words that leak into JD skill terms
  "requirements","requirement","responsibilities","responsibility",
  "qualifications","qualification","overview","compensation","benefits",
  "description","summary","objective","mission","culture","vision",
]);

// ── Entity blocklist ─────────────────────────────────────────────────────────────
// Well-known company names and generic corporate tokens to exclude from JD skill
// terms so candidates are never penalised for not listing an employer name.

const ENTITY_BLOCKLIST = new Set([
  // Big tech
  "google","microsoft","amazon","apple","meta","facebook","netflix",
  "twitter","linkedin","salesforce","oracle","ibm","intel","nvidia",
  "adobe","atlassian","slack","zoom","dropbox","stripe","openai",
  // Indian IT
  "infosys","wipro","tcs","hcl","cognizant","accenture",
  "capgemini","mindtree","mphasis","genpact","deloitte","mckinsey",
  "techinfosys","technovate","techinnovate",
  // Corporate-suffix tokens that leach through as "skills"
  "technologies","solutions","consulting","services","systems","ventures",
  "incorporated","corporation","limited","private",
]);

// ── Heuristic NER: mid-sentence capitalised words ───────────────────────────────
// Words that appear capitalised in the middle of a sentence (preceded by a
// lowercase letter, comma, colon, or parenthesis + whitespace) are very likely
// proper nouns (org names, locations). Strip them from JD skill terms.

function extractEntityWords(text: string): Set<string> {
  const entities = new Set<string>();
  const re = /(?<=[a-z,;:(]\s)([A-Z][a-zA-Z]{2,})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    entities.add(m[1].toLowerCase());
  }
  return entities;
}

// ── Stemmer ──────────────────────────────────────────────────────────────────────
// Conservative suffix-stripping lemmatiser. Runs a single pass (no recursion).
// Minimum stem length: 4 characters. Catches the most common English inflections
// relevant to professional skills (management/managing, analysis/analytical, etc.).

function stemWord(w: string): string {
  const rules: [string, string][] = [
    ["ization","ize"], ["isation","ize"], ["ations","ate"], ["ation","ate"],
    ["ments",""],      ["ment",""],       ["nesses",""],    ["ness",""],
    ["ities",""],      ["ity",""],        ["ings",""],      ["ing",""],
    ["ated",""],       ["ered",""],       ["ied","y"],
    ["eed","ee"],      ["ed",""],
    ["iers","y"],      ["ier","y"],       ["ers",""],       ["ors",""],
    ["er",""],         ["or",""],
    ["ical",""],       ["ics","ic"],      ["ies","y"],
    ["izes",""],       ["ize",""],        ["ises",""],      ["ise",""],
    ["tly","t"],       ["ally",""],       ["ly",""],
    ["al",""],         ["ant",""],        ["ent",""],
    ["ist",""],        ["ism",""],        ["ful",""],       ["ous",""],
    ["ive",""],        ["able",""],       ["ible",""],
    ["s",""],
  ];
  for (const [suffix, replacement] of rules) {
    if (w.endsWith(suffix)) {
      const stem = w.slice(0, w.length - suffix.length) + replacement;
      if (stem.length >= 4) return stem;
    }
  }
  return w;
}

/** Stem → frequency map for resume text (used for lemmatised matching). */
function stemFreq(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  for (const w of words) {
    const s = stemWord(w);
    freq.set(s, (freq.get(s) ?? 0) + 1);
  }
  return freq;
}

// ── Term frequency ───────────────────────────────────────────────────────────────

export function termFrequency(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-\+\#\.\/]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return freq;
}

// ── JD term extraction ───────────────────────────────────────────────────────────

/** Top-N salient skill terms from a JD, with entity filtering applied. */
export function extractJdTerms(jd: string, limit = 25): string[] {
  const entityWords = extractEntityWords(jd);
  const jdFreq = termFrequency(jd);
  return [...jdFreq.entries()]
    .filter(([t]) => !entityWords.has(t) && !ENTITY_BLOCKLIST.has(t))
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .slice(0, limit);
}

// ── Match result ─────────────────────────────────────────────────────────────────

export interface MatchResult {
  score: number;
  matched: string[];   // exact + lemma matched JD terms → shown as Strengths
  missing: string[];   // unmatched JD terms → shown as Gaps
  verdict: string;
}

export function verdictFor(score: number): string {
  if (score >= 75) return "Strong Match";
  if (score >= 60) return "Interview Recommended";
  if (score >= 44) return "Borderline";
  return "Not Yet Competitive";
}

// ── Scoring ──────────────────────────────────────────────────────────────────────

const SEM_THRESHOLD  = 0.40; // cosine below this → no semantic bonus
const SEM_SCALE      = 0.60; // effective cosine range: [0.40, 1.0]
const SEM_MAX_BOOST  = 40;   // max points added on top of keyword score

function computeScore(
  exactCount: number,
  lemmaCount: number,
  total: number,
  semanticSim?: number,
): number {
  const N = Math.max(total, 1);
  const keywordScore = (exactCount / N) * 100 + (lemmaCount / N) * 50;
  let semanticBonus = 0;
  if (semanticSim !== undefined) {
    const norm = Math.max(0, (semanticSim - SEM_THRESHOLD) / SEM_SCALE);
    semanticBonus = norm * SEM_MAX_BOOST;
  }
  return Math.min(88, Math.max(28, Math.round(keywordScore + semanticBonus)));
}

/**
 * Score a resume against pre-extracted JD terms.
 * Reuses the same term list across a batch for consistent ranking.
 *
 * @param resume     Combined resume + skills + experience text
 * @param jdTerms    Output of extractJdTerms()
 * @param semanticSim Optional cosine similarity from the embedding model (0–1).
 *                    When provided, adds up to 40 bonus points for conceptual alignment.
 *                    When omitted, falls back to keyword-only scoring (legacy behaviour).
 */
export function scoreResumeAgainstTerms(
  resume: string,
  jdTerms: string[],
  semanticSim?: number,
): MatchResult {
  const resumeLower = resume.toLowerCase();
  const resumeStems = stemFreq(resume);

  const exactMatched: string[] = [];
  const lemmaOnlyMatched: string[] = [];
  const missing: string[] = [];

  for (const term of jdTerms) {
    if (resumeLower.includes(term)) {
      exactMatched.push(term);
    } else {
      const termStem = stemWord(term);
      if (resumeStems.has(termStem)) {
        lemmaOnlyMatched.push(term);
      } else {
        missing.push(term);
      }
    }
  }

  const score = computeScore(
    exactMatched.length,
    lemmaOnlyMatched.length,
    jdTerms.length,
    semanticSim,
  );

  return {
    score,
    matched: [...exactMatched, ...lemmaOnlyMatched],
    missing,
    verdict: verdictFor(score),
  };
}

/** Convenience: extract terms then score (single-candidate path, no embeddings). */
export function scoreCandidateAgainstJd(jd: string, resume: string): MatchResult {
  return scoreResumeAgainstTerms(resume, extractJdTerms(jd));
}

/** Title-case a single matched/missing term for display. */
export function capTerm(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");
}

// ── Batch ranking ──────────────────────────────────────────────────────────────

export interface RankedCandidate {
  rank: number;
  name: string;
  score: number;
  experience: string;
  verdict: string;
  matched: string[];            // JD terms confirmed present (exact or lemma)
  missing: string[];            // JD terms absent
  note: string;                 // one-line recruiter summary
  semanticEvidence?: string[];  // resume sentences that drove the semantic score
}
