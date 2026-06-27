// Prompt for Stage 6 — Education & Certifications Extraction.
// Claude receives: education section + header section.

export const STAGE_6_EDUCATION_PROMPT = `
TODO: Write Stage 6 education and certifications extraction prompt.

Extract two arrays:
  raw_education[]: degree_label, field_of_study, institution, graduation_year, is_ongoing
  raw_certifications[]: name, issuer, year

Also extract:
  spoken_languages_raw[]: language, proficiency_raw

Rules:
  - Extract degree_label verbatim (e.g. "B.Tech", "Master of Science") — normalisation is post-processing
  - graduation_year must be a 4-digit integer or null
  - For certifications: year is the year obtained, not the expiry year
  - Extract spoken languages from the education section AND header

Output: valid JSON matching the raw_education and raw_certifications schema.
`;
