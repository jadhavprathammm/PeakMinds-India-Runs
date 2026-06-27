// Prompt for Stage 7 — Evidence Extraction.
// Claude receives: full normalized_text (evidence appears everywhere).
// Key rule: verbatim quotes only — never paraphrase claims.

export const STAGE_7_EVIDENCE_PROMPT = `
TODO: Write Stage 7 evidence extraction prompt.

Extract five evidence types:

1. quantified_achievements[]: { claim, metric, domain, approximate_source_role_company }
   - claim: COPY VERBATIM from the text — do NOT paraphrase or summarise
   - metric: the specific measurable value (percentage, ratio, user count, time)
   - ONLY extract statements with a specific measurable value
   - Do NOT extract "improved performance" — only "improved latency by 40%"

2. production_deployments[]: string[]
   - Statements describing a deployed system serving real users or production traffic
   - Include system name, scale, technology if mentioned
   - Do NOT include academic projects, demos, or prototypes

3. open_source[]: { project_name, contribution_type, url }
   - contribution_type: creator | maintainer | contributor

4. awards[]: string[]

5. publications[]: { title, venue, year }

Anti-hallucination: if you cannot find evidence of a type, return an empty array.

Output: valid JSON with the five evidence arrays.
`;
