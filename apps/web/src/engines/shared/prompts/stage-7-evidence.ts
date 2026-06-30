// Prompt for Stage 7 — Evidence Extraction.
// Claude receives: full normalized_text (evidence appears everywhere).
// Key rule: verbatim quotes only — never paraphrase claims.

export const STAGE_7_EVIDENCE_PROMPT = (normalizedText: string) => `
Extract all evidence from the resume text below.

RESUME TEXT:
${normalizedText}

Output a JSON object with five evidence arrays:

1. quantified_achievements[]: { claim, metric, approximate_source_role_company }
   - claim: COPY VERBATIM from the text — do NOT paraphrase, summarise, or rewrite
   - metric: the specific measurable value (percentage, ratio, user count, time, accuracy)
   - ONLY extract statements with a specific measurable value
   - Do NOT extract "improved performance" — only "improved latency by 40%"
   - Do NOT extract "reduced costs" — only "reduced costs by 30%"
   - approximate_source_role_company: company name where this achievement likely occurred (for role matching)

2. production_deployments[]: string[]
   - Statements describing a deployed system serving real users or production traffic
   - Include system name, scale, technology if mentioned
   - Do NOT include academic projects, demos, prototypes, or internal tools not in production
   - Each entry should be a verbatim sentence or paragraph from the resume

3. open_source_contributions[]: { project_name, contribution_type, url }
   - contribution_type: "creator" | "maintainer" | "contributor"
   - Only explicit OSS mentions with URLs
   - creator = founded/started the project
   - maintainer = has commit access, reviews PRs, manages releases
   - contributor = submitted PRs, issues, minor contributions

4. awards_and_recognition[]: string[]
   - Any award, honor, fellowship, scholarship, recognition, "Employee of the Year", etc.
   - Verbatim from text

5. publications[]: { title, venue, year }
   - Papers, conference proceedings, journals, preprints (arXiv), workshop papers
   - venue: conference/journal name (e.g., "NeurIPS 2022", "ICML", "arXiv")
   - year: publication year if mentioned

Anti-hallucination rules:
- If you cannot find evidence of a type, return an empty array.
- Do NOT invent achievements, deployments, or publications.
- Do NOT extract generic statements without specific metrics.
- Verbatim claims only — no paraphrasing.

Output format:
{
  "quantified_achievements": [
    {
      "claim": "Reduced model training time by 60% through distributed training optimization",
      "metric": "60%",
      "approximate_source_role_company": "TechCorp Inc."
    }
  ],
  "production_deployments": [
    "Deployed 12+ models to production with automated CI/CD pipelines serving 10M+ predictions/day"
  ],
  "open_source_contributions": [
    {
      "project_name": "ML Pipeline Library",
      "contribution_type": "maintainer",
      "url": "https://github.com/example/ml-pipeline"
    }
  ],
  "awards_and_recognition": [
    "Google Cloud Professional ML Engineer (2022)"
  ],
  "publications": [
    {
      "title": "Efficient Distributed Training for Large Language Models",
      "venue": "NeurIPS 2022",
      "year": 2022
    }
  ]
}
`;

export const STAGE_7_EVIDENCE_SYSTEM_PROMPT = `You are a structured data extraction assistant. Output only valid JSON.`;