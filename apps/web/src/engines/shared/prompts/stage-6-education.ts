// Prompt for Stage 6 — Education & Certifications Extraction.
// Claude receives: education section + header section.

export const STAGE_6_EDUCATION_SYSTEM_PROMPT = `You are a resume parsing assistant. Extract structured education and certification information from resume text. Output only valid JSON — no markdown, no explanation.`;

export const STAGE_6_EDUCATION_PROMPT = (educationText: string, headerText: string): string => `
Extract education entries, certifications, and spoken languages from the following resume sections.

EDUCATION SECTION:
${educationText}

HEADER SECTION:
${headerText}

Rules:
- Output null for any field you cannot find with high confidence. Never guess.
- Extract ALL education entries (degrees) — post-processing selects the highest.
- degree_label: verbatim (e.g., "B.Tech", "Master of Science", "PhD") — normalisation is post-processing
- graduation_year: 4-digit integer (1950–2030) or null
- is_ongoing: true ONLY if explicitly stated ("Present", "Current", "Expected 2025")
- For certifications: year = year obtained (not expiry year)
- Extract spoken languages from BOTH sections (e.g., "English (Native), Spanish (Fluent)")
- stage_confidence: overall confidence in this extraction (0.0–1.0)
- extraction_warnings: array of string warning codes (empty array if none)

Output this exact JSON structure:
{
  "raw_education": [
    {
      "degree_label": string | null,
      "field_of_study": string | null,
      "institution": string | null,
      "graduation_year": number | null,
      "is_ongoing": boolean
    }
  ],
  "raw_certifications": [
    {
      "name": string,
      "issuer": string | null,
      "year": number | null
    }
  ],
  "spoken_languages_raw": [
    {
      "language": string,
      "proficiency_raw": string | null
    }
  ],
  "stage_confidence": number,
  "extraction_warnings": string[]
}
`.trim();