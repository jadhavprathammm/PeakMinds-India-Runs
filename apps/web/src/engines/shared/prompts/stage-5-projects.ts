// Prompt for Stage 5 — Project Extraction.
// Claude receives: projects section + experience section.
// Key rules: one object per project; de-duplicate across sections.

export const STAGE_5_PROJECTS_PROMPT = `
TODO: Write Stage 5 project extraction prompt.

Target schema for each project:
  name, description, technologies[], domain, impact, complexity,
  production_grade, active_users_estimate, team_size, ownership_level,
  start_year, end_year, is_ongoing, url, source, source_company

Complexity levels: trivial | simple | moderate | complex | highly_complex

Rules:
  - A project has a beginning, an end (or ongoing status), and a deliverable
  - A responsibility is something done every day — NOT a project
  - source = "work" for projects found in the experience section
  - De-duplicate: if same project appears in both sections, extract ONCE
  - Do NOT assign source_role_index — computed in post-processing
  - Estimate complexity from description (single API = trivial; distributed pipeline = highly_complex)

Output: valid JSON with a raw_projects array.
`;
