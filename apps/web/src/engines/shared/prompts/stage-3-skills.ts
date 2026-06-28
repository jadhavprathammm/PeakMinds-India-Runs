// Prompt for Stage 3 — Skills Extraction.
// Claude receives: skills section + experience section + projects section.
// Key rules: err on inclusion; do not invent; flag uncertain skills.

export const STAGE_3_SKILLS_SYSTEM_PROMPT = `You are a resume parsing assistant. Extract structured skills information from resume text. Output only valid JSON — no markdown, no explanation.`;

export const STAGE_3_SKILLS_PROMPT = (skillsText: string, experienceText: string, projectsText: string): string => `
Extract skills from the following resume sections.

SKILLS SECTION:
${skillsText}

EXPERIENCE SECTION:
${experienceText}

PROJECTS SECTION:
${projectsText}

Rules:
- Output null for any field you cannot find with high confidence. Never guess.
- Err on the side of inclusion — better to over-extract than miss signals.
- Do NOT invent skills not present in the text.
- Place uncertain skills in an uncertain_skills array with likely_category.
- Do NOT normalise skill names — extract verbatim (e.g., "PyTorch", "pytorch", "Py Torch" as separate entries).
- Normalisation is post-processing.

Output this exact JSON structure:
{
  "technical_skills": string[],
  "tools": string[],
  "frameworks": string[],
  "cloud_platforms": string[],
  "databases": string[],
  "domain_keywords": string[],
  "uncertain_skills": [
    {
      "skill": string,
      "likely_category": "technical_skills" | "tools" | "frameworks" | "cloud_platforms" | "databases" | "domain_keywords"
    }
  ],
  "stage_confidence": number,
  "extraction_warnings": string[]
}
`.trim();