// Prompt for Stage 5 — Project Extraction.
// Claude receives: projects section + experience section.
// Key rules: one object per project; de-duplicate across sections.

export const STAGE_5_PROJECTS_PROMPT = (projectsText: string, experienceText: string) => `
Extract all projects from the resume text below.

PROJECTS SECTION:
${projectsText}

EXPERIENCE SECTION (for work projects):
${experienceText}

Output a JSON object with a "raw_projects" array. Each project object must have:
- name: string (project name exactly as written)
- description: string (2-4 sentence summary)
- technologies: string[] (all technologies, frameworks, tools mentioned)
- domain: string | null (problem domain: NLP, CV, RecSys, MLOps, etc.)
- impact: string | null (raw impact text with metrics if any)
- complexity: "trivial" | "simple" | "moderate" | "complex" | "highly_complex"
- production_grade: boolean (true if deployed to production, serving users, or live)
- active_users_estimate: number | null (estimated active users if mentioned)
- team_size: number | null (team size if mentioned)
- ownership_level: "unknown" | "contributor" | "owner" | "lead" | "solo"
- start_year: number | null
- end_year: number | null
- is_ongoing: boolean
- url: string | null (project URL if mentioned)
- source: "personal" | "work" | "open_source" | "academic"
- source_company: string | null (company where project was done, for work projects)

Rules:
- A project has a beginning, an end (or ongoing status), and a deliverable.
- A responsibility is something done every day — NOT a project.
- source = "work" for projects found in the experience section.
- source = "personal" for side projects, hackathons, portfolio.
- source = "open_source" for OSS contributions.
- source = "academic" for research projects, thesis, coursework.
- De-duplicate: if same project appears in both sections, extract ONCE (prefer richer description).
- Do NOT assign source_role_index — computed in post-processing.
- Estimate complexity from description:
  * trivial: single API call, wrapper, config change, <50 lines
  * simple: single model, single pipeline, 1-2 technologies
  * moderate: multi-stage pipeline, 3-5 technologies, some distributed
  * complex: distributed system, real-time, multi-model, 5+ technologies
  * highly_complex: custom infrastructure, novel architecture, research-grade, 10+ technologies
- production_grade = true if: deployed to production, serving users, live, launched, or work project with complexity >= moderate
- ownership_level:
  * "solo" if team_size === 1
  * "owner" if you owned the project end-to-end
  * "lead" if you led the project but had team
  * "contributor" if you contributed to a larger project
  * "unknown" if unclear
- If dates are ambiguous, preserve null for start_year/end_year.
- is_ongoing = true if project is current or no end date with present context.

Example output format:
{
  "raw_projects": [
    {
      "name": "Real-time Fraud Detection System",
      "description": "End-to-end ML system detecting fraudulent transactions in <50ms. Deployed on GCP with Kubernetes, monitoring via Prometheus/Grafana.",
      "technologies": ["PyTorch", "Kafka", "Redis", "PostgreSQL", "Kubernetes", "GCP"],
      "domain": "Fraud Detection",
      "impact": "Reduced fraud losses by 35%, processing 10M transactions/day",
      "complexity": "complex",
      "production_grade": true,
      "active_users_estimate": 10000000,
      "team_size": 5,
      "ownership_level": "lead",
      "start_year": 2021,
      "end_year": null,
      "is_ongoing": true,
      "url": "https://github.com/example/fraud-detection",
      "source": "work",
      "source_company": "TechCorp Inc."
    }
  ]
}
`;

export const STAGE_5_PROJECTS_SYSTEM_PROMPT = `You are a structured data extraction assistant. Output only valid JSON.`;