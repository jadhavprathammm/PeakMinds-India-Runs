// Prompt for Stage 4 — Experience Extraction.
// Claude receives: experience section + header section.
// Key rules: one object per role; preserve dates verbatim; no merging.

export const STAGE_4_EXPERIENCE_PROMPT = `
TODO: Write Stage 4 experience extraction prompt.

Target schema for each role:
  title, company, start_date_raw, end_date_raw, is_current,
  description, key_responsibilities_raw (max 8 bullets)

Rules:
  - Preserve start_date_raw and end_date_raw EXACTLY as written — do not convert or compute
  - is_current = true ONLY when explicitly stated ("Present", "current", no end date)
  - Do NOT invent roles or merge roles — one object per listed position
  - key_responsibilities_raw: bullet list, max 8 items per role
  - If dates are ambiguous, preserve the ambiguous string verbatim

Output: valid JSON with a raw_roles array matching the RawRole schema.
`;
