# Team Intelligence — Module 3: Team DNA Extraction Engine

Turns a `TeamDocument` (aggregated text from Module 2) into a structured, confidence-bearing
`TeamDNA` — the team's signature across skills, domains, seniority, leadership, work-style,
strengths, and gaps. **Domain-agnostic, no candidate/compatibility/contribution scoring.**

## Files touched (all inside `src/engines/team-intelligence/`)

| File | Change |
|------|--------|
| `team-dna.ts` | **Implemented** — full lexical extraction + BGE-M3 semantic seam |
| `types.ts` | Schema evolved — `TeamDNA` is now signal-based with per-signal confidence |
| `index.ts` | Barrel — exports `deriveTeamDNA`, `deriveTeamDNAWithSemantics`, new types |

**Untouched:** `matching.ts`, `lib/embeddings.ts`, `rank-candidates/route.ts`, `analyze/route.ts`
(verified 0-diff).

## Public API

```ts
import { deriveTeamDNA, deriveTeamDNAWithSemantics, DEFAULT_TEAM_DNA_CONFIG } from "@/engines/team-intelligence";

const dna = deriveTeamDNA(teamDocument, DEFAULT_TEAM_DNA_CONFIG);            // sync, lexical
const dna2 = await deriveTeamDNAWithSemantics(teamDocument, {               // async, BGE-M3
  ...DEFAULT_TEAM_DNA_CONFIG, semantic: bgeM3Backend,
});
```

`deriveTeamDNA` honours the Module-1 `DeriveTeamDNA` contract `(team, config) => TeamDNA`.

## TeamDNA schema (evolved)

The Module-1 `TeamDNA` assumed parsed member *profiles*. The parser instead produces aggregated
*text* (`members: []` deferred), so the schema is now **text-derived and signal-based**, with a
confidence on every signal — satisfying the `{ skill, confidence }` requirement:

```ts
interface TeamSignal { label: string; confidence: number; evidence_count: number; sources: string[]; }

interface TeamDNA {
  team_id: string;
  member_count: number;               // best-effort; 0 when unknown
  skills: TeamSignal[];
  domains: TeamSignal[];
  seniority: SenioritySignal;         // dominant_band + distribution + max_years + confidence
  leadership_signals: TeamSignal[];
  work_style_signals: TeamSignal[];
  strengths: TeamSignal[];            // derived (high-confidence, well-covered)
  gaps: TeamSignal[];                 // explicit deficits ("thin on X")
  overall_confidence: number;         // 0–1
  extraction_backend: "lexical" | "semantic" | "hybrid";
  derivation_warnings: string[];
}
```

## How domain-agnostic extraction works (the core idea)

The live `matching.ts` recognises skills from a **hardcoded, software-only dictionary**
(`TECH_SKILLS`). That approach cannot generalise to finance, healthcare, legal, etc. Team DNA
instead discovers signals from **how language is used**, which is invariant across industries:

1. **Linguistic cues.** `"experience with X"`, `"proficient in X"`, `"skills: …"`, `"led X"`,
   `"thin on X"`. These phrasings are identical whether X is *Kubernetes*, *derivatives pricing*,
   *HIPAA compliance*, or *contract law*. The captured span becomes a candidate signal.
2. **Acronym morphology.** ALL-CAPS 2–6-char tokens (`AWS`, `HIPAA`, `GAAP`, `SIEM`, `IFRS`,
   `HL7`, `GDPR`) are strong competency markers in *every* field — with **zero domain vocabulary
   encoded**.
3. **Statistical salience.** Frequency + spread across artifacts drive confidence.

The only fixed lexicons are **cross-industry structural markers** — seniority titles
(*senior/lead/director*), leadership verbs (*led/managed/mentored*), culture adjectives
(*agile/remote/research-driven*), and gap phrasings (*lacking/thin on*). These describe **grammar
and org structure**, not any industry's skills. A skill or domain is **never matched against a
known-terms list**.

> Verified on four industries with the *same code*: Healthcare (`FHIR, HIPAA, HL7`), Finance
> (`GAAP, IFRS, SOX, derivatives pricing`), Legal (`GDPR, contract law, NDA`), Security
> (`SIEM, Splunk, SOC, MITRE ATT&CK`) — plus correct gaps (`machine learning`, `cloud
> infrastructure`, `patent litigation`, `cloud security`).

## Confidence model

Each skill/domain confidence blends statistical + structural evidence (all 0–1):

```
freqScore   = 1 − exp(−count / 2.5)          # 1→0.33, 3→0.70, 6→0.91
cueBoost    = +0.20 if captured via a linguistic cue
acronymBoost= +0.10 if ALL-CAPS acronym
spreadBoost = +0.08 per extra source artifact (cap 0.15)
confidence  = clamp01(0.32 + freqScore*0.62 + boosts)
```

- **Gaps** are *explicit statements*, so their confidence leans on cue presence (base 0.55) not
  frequency.
- **Seniority** confidence scales with marker volume `1 − exp(−total/3)`, tempered when the known
  team size is below `min_members_for_confidence`.
- **`overall_confidence`** = mean of top-10 signal confidences (0.6) + category coverage (0.4).

## Semantic (BGE-M3) integration — prepared, not required

A `SemanticBackend` interface is the single seam for embeddings:

```ts
interface SemanticBackend { name: string; embed(texts: string[]): Promise<number[][] | null>; }
```

- **Injected via config** (`config.semantic`), exactly like Module 2's injectable extractor —
  keeps the engine decoupled and testable, and never imports the DO_NOT_TOUCH `lib/embeddings.ts`.
- `deriveTeamDNAWithSemantics()` runs the lexical pass, then embeds skill labels and **greedily
  merges near-duplicates** by cosine (`k8s` ≈ `Kubernetes`), summing evidence and keeping the
  higher confidence → `extraction_backend: "hybrid"`.
- Wiring real BGE-M3 later = implement `embed()` once; the extraction core is untouched. If the
  backend returns null / throws, the result degrades to the lexical DNA with a warning.

## Graceful degradation (never throws)

- Each extractor is wrapped in try/catch; a failure records a `derivation_warnings` entry and
  yields an empty category — other categories still populate.
- Empty/whitespace documents → `overall_confidence: 0`, warnings, empty signals, **no throw**
  (verified).
- Semantic failures fall back to lexical output.

## Data flow

```
TeamDocument (raw_text + artifacts[])
      │
      ▼  deriveTeamDNA()  (per parsed artifact, provenance preserved)
  ┌──────────────────────────────────────────────────────────┐
  │ extractSkills   ← cues + colon-lists + ACRONYMS           │
  │ extractDomains  ← domain cues (industry/sector/compliance)│
  │ extractSeniority← title markers + "N years"               │
  │ extractCueSignals(leadership) / (work-style)              │
  │ extractGaps     ← deficit cues ("thin on X")              │
  │ estimateMemberCount ← "team of N" / resume-ish artifacts  │
  │ deriveStrengths ← high-confidence, well-covered signals   │
  └──────────────────────────────────────────────────────────┘
      │  TeamDNA (every signal has confidence)
      ▼  [optional] deriveTeamDNAWithSemantics() → merge dupes → "hybrid"
   TeamDNA  →  (Module 4+) Compatibility & Contribution scoring
```

## Example output (Healthcare, 2 files)

```jsonc
{
  "team_id": "Healthcare",
  "member_count": 6,
  "skills": [
    { "label": "FHIR",  "confidence": 1.0,  "evidence_count": 3, "sources": ["Charter.txt","ManagerNotes.txt"] },
    { "label": "HIPAA", "confidence": 1.0,  "evidence_count": 3, "sources": ["Charter.txt","ManagerNotes.txt"] },
    { "label": "HL7",   "confidence": 1.0,  "evidence_count": 2, "sources": ["Charter.txt","ManagerNotes.txt"] },
    { "label": "EPIC",  "confidence": 0.62, "evidence_count": 1, "sources": ["ManagerNotes.txt"] }
  ],
  "domains": [ { "label": "healthcare industry", "confidence": 0.72, "evidence_count": 1, "sources": ["Charter.txt"] } ],
  "seniority": { "dominant_band": "senior", "max_years_experience": 8, "confidence": 0.28, "distribution": [ { "band": "senior", "weight": 1 } ] },
  "leadership_signals": [ { "label": "led", "confidence": 0.62, "evidence_count": 1, "sources": ["ManagerNotes.txt"] } ],
  "strengths": [ { "label": "FHIR", "confidence": 1.0, "evidence_count": 3, "sources": ["Charter.txt","ManagerNotes.txt"] } ],
  "gaps": [
    { "label": "machine learning", "confidence": 0.55, "evidence_count": 1, "sources": ["Charter.txt"] },
    { "label": "data science",     "confidence": 0.55, "evidence_count": 1, "sources": ["ManagerNotes.txt"] }
  ],
  "overall_confidence": 0.88,
  "extraction_backend": "lexical",
  "derivation_warnings": []
}
```

**Result:** arbitrary team documents from any industry → a structured `TeamDNA` with confidences,
ready for Compatibility and Contribution analysis.
```
```
