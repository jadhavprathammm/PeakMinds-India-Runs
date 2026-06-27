// Prompt for Stage 8 — Communication Signals Extraction.
// Claude receives: full normalized_text (signals appear everywhere).
// Key rule: anti-hallucination — false/empty if signal not explicitly present.

export const STAGE_8_COMMUNICATION_PROMPT = `
TODO: Write Stage 8 communication signals extraction prompt.

Extract five signal types:

1. raw_presentations[]: { title, event, year, audience_scope_raw, url }
   - Only extract explicitly described presentations or talks

2. raw_technical_writing: { has_technical_blog, blog_platform, blog_url, estimated_post_count, writing_topics[] }

3. raw_mentoring: { formal_mentoring_role, junior_coaching_described, onboarding_described, mentees_count_estimate }

4. raw_community: { open_source_maintainer, conference_organizer, community_names[], stackoverflow_reputation_mentioned }

ANTI-HALLUCINATION RULE:
  If you cannot find DIRECT evidence of a signal, set it to false or an empty array.
  Do NOT infer from general descriptions — only extract explicitly stated activities.
  A candidate who "worked on open source" is NOT necessarily an open_source_maintainer.

Output: valid JSON matching the communication output schema.
`;
