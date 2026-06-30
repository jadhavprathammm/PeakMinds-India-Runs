// Prompt for Stage 4 — Experience Extraction.
// Claude receives: experience section + header section.
// Key rules: one object per role; preserve dates verbatim; no merging.

export const STAGE_4_EXPERIENCE_PROMPT = (experienceText: string, headerText: string) => `
Extract all work experience roles from the resume text below.

EXPERIENCE SECTION:
${experienceText}

HEADER SECTION (for current role context):
${headerText}

Output a JSON object with a "raw_roles" array. Each role object must have:
- title: string (job title exactly as written)
- company: string (company name exactly as written)
- start_date_raw: string | null (exact date string from resume, e.g., "Jan 2020", "2020-01", "January 2020")
- end_date_raw: string | null (exact date string, or "Present"/"Current" if current role)
- is_current: boolean (true ONLY if explicitly stated: "Present", "Current", "Ongoing", or no end date with current context)
- description: string (2-4 sentence summary of the role)
- key_responsibilities_raw: string[] (max 8 bullet points, verbatim from resume)

Rules:
- One object per listed position. Do NOT merge roles or invent roles.
- Preserve start_date_raw and end_date_raw EXACTLY as written — do not convert or compute.
- is_current = true ONLY when explicitly stated ("Present", "Current", "Ongoing") or strongly implied by header context.
- If dates are ambiguous, preserve the ambiguous string verbatim.
- key_responsibilities_raw: extract bullet points, max 8 items per role.
- Output valid JSON only. No markdown, no explanations.

Example output format:
{
  "raw_roles": [
    {
      "title": "Senior Machine Learning Engineer",
      "company": "TechCorp Inc.",
      "start_date_raw": "Jan 2020",
      "end_date_raw": "Present",
      "is_current": true,
      "description": "Leads ML platform team building recommendation systems at scale.",
      "key_responsibilities_raw": [
        "Architected end-to-end ML platform serving 10M+ predictions/day",
        "Led team of 8 ML engineers; mentored 15+ junior engineers",
        "Reduced model training time by 60% through distributed training optimization"
      ]
    }
  ]
}
`;

export const STAGE_4_EXPERIENCE_SYSTEM_PROMPT = `You are a structured data extraction assistant. Output only valid JSON.`;