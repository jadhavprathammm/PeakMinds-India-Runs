// Prompt for Stage 13 — Archetype Classification.
// Claude receives: structured summary signals only — NEVER raw resume text.
// Key constraint: differentiators must reference specific signals, not generic statements.

export const STAGE_13_ARCHETYPE_PROMPT = (signals: string) => `
Classify this candidate into ONE primary archetype from the 8 canonical types below.
Input is a JSON summary of derived signals — no raw resume text is provided.

ARCHETYPES:
1. builder        — Ships production ML systems, owns pipelines end-to-end, strong ownership signals
2. researcher     — Publishes papers, advances ML methods, deep pre-LLM or theoretical expertise
3. operator       — Runs ML in production, focuses on reliability, monitoring, MLOps, scaling
4. generalist     — Broad ML + software skills, no deep specialization, adapts to any domain
5. specialist     — Deep expertise in ONE domain (NLP, CV, RecSys, etc.), narrow but deep
6. leader         — Manages ML teams, sets strategy, hires, cross-functional leadership
7. founder        — Entrepreneurial, builds products/companies, ships from scratch, high agency
8. transitioner   — Career pivot into ML from adjacent field (SWE, data eng, research, etc.)

SIGNALS:
${signals}

RULES:
- Choose the SINGLE best fit. If genuinely ambiguous between two, set secondary_archetype.
- Base decision on SIGNALS, not title. A "Senior ML Engineer" who only does research → researcher.
- Builder requires: shipped_to_production=true AND owned_full_pipeline=true
- Researcher requires: publication_count >= 2 OR has_pre_llm_depth=true
- Operator requires: strong MLOps/production signals, moderate ML depth
- Leader requires: managed_teams=true AND seniority >= senior
- Founder requires: entrepreneurial signals (startup experience, ownership, 0-to-1 products)
- Transitioner requires: is_career_changer=true AND role_family changed meaningfully
- Specialist requires: domain_keywords >= 5 in ONE domain, low role diversity
- Generalist is the default when no other archetype clearly dominates

OUTPUT: Valid JSON only. No markdown, no explanation.
{
  "primary_archetype": "<one of 8>",
  "secondary_archetype": "<one of 8 or null>",
  "confidence": <0.0-1.0>,
  "evidence_summary": "<2-3 sentences citing specific signals>",
  "archetype_strengths": ["<strength1>", "<strength2>"],
  "archetype_watch_areas": ["<watch1>", "<watch2>"],
  "key_differentiators": ["<specific differentiator 1>", "<specific differentiator 2>"]
}
`;

export const STAGE_13_ARCHETYPE_SYSTEM_PROMPT = `You are a structured data extraction assistant. Output only valid JSON.`;