// Prompt for Stage 13 — Archetype Classification.
// Claude receives: structured summary signals only — NEVER raw resume text.
// Key constraint: differentiators must reference specific signals, not generic statements.

export const STAGE_13_ARCHETYPE_PROMPT = `
TODO: Write Stage 13 archetype classification prompt.

Include the full definitions of all 8 archetypes:
  builder      — ships production systems end-to-end; ownership and deployment signals
  researcher   — publications, academic depth, research roles
  operator     — MLOps, infra, reliability; deployment tooling signals
  generalist   — breadth across multiple domains; no single deep specialization
  specialist   — deep in one area (NLP, CV, RecSys, IR); high domain concentration
  leader       — management experience, people leadership, cross-functional coordination
  founder      — startup or founding-team signals; product ownership, broad scope
  transitioner — career changer; first family differs significantly from current

Ask Claude to:
  - Select primary_archetype (required) and secondary_archetype (optional)
  - Provide confidence 0.0–1.0 and a one-sentence evidence_summary
  - List archetype_strengths (max 3) and archetype_watch_areas (max 3)
  - Provide key_differentiators (max 3)

DIFFERENTIATOR ANTI-PATTERN:
  Do NOT write "Strong Python skills" for a Senior ML Engineer.
  Every Senior ML Engineer has Python. A differentiator must be specific to THIS candidate
  and reference a specific signal from the input summary.

Output: valid JSON matching the ArchetypeOutput schema.
`;
