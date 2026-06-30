// Prompt for Stage 8 — Communication Signals Extraction.
// Claude receives: full normalized_text (signals appear everywhere).
// Key rule: anti-hallucination — false/empty if signal not explicitly present.

export const STAGE_8_COMMUNICATION_PROMPT = (normalizedText: string) => `
Extract communication signals from the resume text below.

RESUME TEXT:
${normalizedText}

Output a JSON object with four signal categories:

1. raw_presentations[]: { title, event, year, audience_scope_raw, url }
   - Only extract explicitly described presentations, talks, or speaking engagements
   - audience_scope_raw: the exact audience description from the text (e.g., "company all-hands", "NeurIPS 2022", "local meetup", "internal team meeting")
   - Do NOT infer audience scope from event name — use what the resume explicitly states

2. raw_technical_writing: { has_technical_blog, blog_platform, blog_url, estimated_post_count, writing_topics[] }
   - has_technical_blog: true ONLY if explicitly mentions a technical blog, Medium, Substack, personal website with posts
   - blog_platform: platform name if mentioned (e.g., "Medium", "Substack", "WordPress", "GitHub Pages", "Dev.to")
   - blog_url: URL if provided
   - estimated_post_count: number if mentioned (e.g., "50+ posts", "wrote 12 articles")
   - writing_topics: topics explicitly mentioned (e.g., ["MLOps", "distributed systems", "Python"])

3. raw_mentoring: { formal_mentoring_role, junior_coaching_described, onboarding_described, mentees_count_estimate }
   - formal_mentoring_role: true ONLY if explicitly states "mentor", "mentoring program", "mentored X engineers"
   - junior_coaching_described: true if explicitly describes coaching/junior development activities
   - onboarding_described: true if explicitly describes onboarding new hires
   - mentees_count_estimate: number if mentioned (e.g., "mentored 5 engineers")

4. raw_community: { open_source_maintainer, conference_organizer, community_names[], stackoverflow_reputation_mentioned }
   - open_source_maintainer: true ONLY if explicitly states "maintainer", "core contributor", "project lead" for an OSS project
   - conference_organizer: true if organized a conference, meetup, or workshop
   - community_names: names of communities explicitly mentioned (e.g., "PyData", "MLOps Community", "Kubernetes SIG")
   - stackoverflow_reputation_mentioned: true if Stack Overflow reputation or activity explicitly mentioned

ANTI-HALLUCINATION RULES:
- If you cannot find DIRECT evidence of a signal, set it to false, empty array, or null
- Do NOT infer from general descriptions — only extract explicitly stated activities
- A candidate who "worked on open source" is NOT necessarily an open_source_maintainer
- A candidate who "helped junior team members" is NOT necessarily a formal_mentoring_role
- A candidate who "presented to team" is NOT necessarily a presentation with external audience

Output format:
{
  "raw_presentations": [
    {
      "title": "Scaling ML Systems",
      "event": "NeurIPS 2022 Workshop",
      "year": 2022,
      "audience_scope_raw": "international conference",
      "url": "https://example.com"
    }
  ],
  "raw_technical_writing": {
    "has_technical_blog": true,
    "blog_platform": "Medium",
    "blog_url": "https://medium.com/@user",
    "estimated_post_count": 25,
    "writing_topics": ["MLOps", "distributed systems"]
  },
  "raw_mentoring": {
    "formal_mentoring_role": true,
    "junior_coaching_described": true,
    "onboarding_described": false,
    "mentees_count_estimate": 8
  },
  "raw_community": {
    "open_source_maintainer": false,
    "conference_organizer": false,
    "community_names": ["MLOps Community"],
    "stackoverflow_reputation_mentioned": false
  }
}
`;

export const STAGE_8_COMMUNICATION_SYSTEM_PROMPT = `You are a structured data extraction assistant. Output only valid JSON.`;