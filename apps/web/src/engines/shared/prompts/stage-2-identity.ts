// Prompt for Stage 2 — Identity Extraction.
// Claude receives: section_map.header + section_map.objective_summary
// Key rules: null-over-guess; stated YoE only; no date computation.

export const STAGE_2_IDENTITY_SYSTEM_PROMPT = `You are a resume parsing assistant. Extract structured identity information from resume text. Output only valid JSON — no markdown, no explanation.`;

export const STAGE_2_IDENTITY_PROMPT = (headerText: string): string => `
Extract identity fields from the following resume header/summary text.

TEXT:
${headerText}

Rules:
- Output null for any field you cannot find with high confidence. Never guess.
- Extract years_experience ONLY from explicit statements like "8 years of experience" or "10+ years". Do NOT compute from date ranges.
- contact_email must match a valid email format (user@domain.tld) or null.
- candidate_name: the person's full name, max 200 chars.
- current_title: their most recent or stated job title.
- current_company: their most recent or stated employer.
- location: city, state/country as stated. Null if not found.
- spoken_languages_raw: raw text mentioning languages spoken (e.g. "English, Spanish"). Null if not found.
- field_confidence: 0.0–1.0 per field (1.0 = certain, 0.0 = guessed).
- stage_confidence: overall confidence in this extraction (0.0–1.0).
- extraction_warnings: array of string warning codes (empty array if none).

Output this exact JSON structure:
{
  "candidate_name": string | null,
  "current_title": string | null,
  "current_company": string | null,
  "years_experience": number | null,
  "location": string | null,
  "contact_email": string | null,
  "spoken_languages_raw": string | null,
  "stage_confidence": number,
  "field_confidence": {
    "candidate_name": number,
    "current_title": number,
    "current_company": number,
    "years_experience": number,
    "location": number,
    "contact_email": number
  },
  "extraction_warnings": string[]
}
`.trim();
