// Prompt for Stage 9 — Career Preferences Extraction.
// Claude receives: objective_summary + header + first 300 chars of full text.
// Key rule: null-or-extract — never infer from context.

export const STAGE_9_PREFERENCES_PROMPT = `
TODO: Write Stage 9 career preferences extraction prompt.

Extract only what is DIRECTLY STATED:
  desired_roles[], preferred_domains[], preferred_locations[],
  relocation_willingness_raw, work_mode_raw, industry_preferences[],
  employment_status_raw, open_to_work_raw,
  compensation_raw: { amount_raw, currency_raw, period_raw },
  start_date_raw, work_auth_raw

NULL-OR-EXTRACT RULE:
  If the candidate does not explicitly mention salary expectations,
  set expected_compensation to null.
  If they do not mention relocation, set relocation_willingness to null.
  NEVER infer preferences from context or work history.

Most resumes will yield a mostly-null output — this is correct.

Output: valid JSON matching the raw_preferences schema.
`;
