// Prompt for Stage 3 — Skills Extraction.
// Claude receives: skills section + experience section + projects section.
// Key rules: err on inclusion; do not invent; flag uncertain skills.

export const STAGE_3_SKILLS_PROMPT = `
TODO: Write Stage 3 skills extraction prompt.

Six category definitions to include:
  technical_skills: core ML/data/software skills (algorithms, languages)
  tools: standalone tools and software (IDEs, data tools, CLI tools)
  frameworks: libraries and frameworks (PyTorch, Django, React)
  cloud_platforms: AWS, GCP, Azure, and managed cloud services
  databases: SQL and NoSQL databases, vector stores
  domain_keywords: domain/business knowledge keywords (NLP, RecSys, A/B testing)

Rules:
  - Err on the side of inclusion — better to over-extract than miss signals
  - Do NOT invent skills not present in the text
  - Place uncertain skills in an uncertain_skills array with likely_category
  - Do NOT normalise skill names — extract verbatim

Output: valid JSON matching the SkillsRawExtraction schema.
`;
