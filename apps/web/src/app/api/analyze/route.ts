import { NextRequest, NextResponse } from "next/server";
import { isValidAnalysisOutput, type AnalysisOutput } from "@/lib/analysis-types";
import { extractJdTerms, scoreResumeAgainstTerms, capTerm } from "@/lib/matching";

export const runtime = "nodejs";

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildPrompt(jd: string, resume: string): string {
  return `You are an expert talent intelligence system. Work in two steps internally:

STEP 1 — Extract a structured profile from the JOB DESCRIPTION (the "jd_profile").
STEP 2 — Evaluate the RESUME against that jd_profile and produce the analysis.

Return ONLY a single valid JSON object with this exact schema — no markdown, no explanation:

{
  "overall_match_score": <integer 0-100>,
  "analysis_summary": "<2-3 sentence executive summary>",
  "jd_profile": {
    "role_title": "<title, or '' if unclear>",
    "seniority": "<e.g. Junior|Mid|Senior|Lead|'' if unclear>",
    "years_required": "<e.g. '5+ years' or '' if unstated>",
    "technical_skills": ["<skill>"],
    "tools": ["<tool>"],
    "frameworks": ["<framework>"],
    "domain_knowledge": ["<domain>"],
    "leadership_requirements": ["<requirement>"],
    "nice_to_have_skills": ["<skill>"]
  },
  "strength_analysis": [
    { "title": "<strength title>", "description": "<why this is a strength for this specific JD>" }
  ],
  "gap_analysis": [
    { "title": "<gap title>", "severity": "<High|Medium|Low>", "description": "<why this matters for this JD>" }
  ],
  "recruiter_perspective": {
    "verdict": "<Strong Match|Interview Recommended|Borderline|Not Yet Competitive>",
    "positives": ["<specific observation>"],
    "concerns": ["<specific concern>"]
  },
  "improvement_roadmap": {
    "immediate": ["<action>"],
    "seven_day": ["<action>"],
    "thirty_day": ["<action>"]
  }
}

Rules:
- jd_profile: extract only what the JD states; use "" or [] when a field is absent. Never invent requirements.
- strength_analysis: 3-5 items, evidence-backed, specific to this JD
- gap_analysis: 3-5 items, role-specific, not generic
- recruiter_perspective.positives: 2-4 items
- recruiter_perspective.concerns: 2-4 items
- improvement_roadmap: 3-4 actions each tier, specific and actionable
- Works for ANY role: ML, Software, Product, Design, Data, DevOps, Finance, non-tech, etc.

JOB DESCRIPTION:
${jd.slice(0, 3000)}

RESUME:
${resume.slice(0, 4000)}`;
}

// ── Claude call ───────────────────────────────────────────────────────────────

async function callClaude(jd: string, resume: string): Promise<AnalysisOutput> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: buildPrompt(jd, resume) }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected content type from Claude");

  // Strip potential markdown fences
  const raw = block.text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const parsed: unknown = JSON.parse(raw);
  if (!isValidAnalysisOutput(parsed)) throw new Error("Schema mismatch in Claude response");
  return parsed;
}

// ── Weak English words that pollute strength/gap explanations ───────────────────
const WEAK_STRENGTH_WORDS = new Set([
  "working", "better", "highly", "across", "applications", "developers",
  "product", "designing", "building", "creating", "improve", "improving",
  "enhance", "enhancing", "optimize", "optimizing", "scale", "scaling",
  "manage", "managing", "lead", "leading", "drive", "driving", "deliver",
  "delivering", "support", "supporting", "collaborate", "collaborating",
  "communicate", "communicating", "analyze", "analyzing", "design", "develop",
  "implement", "implementing", "build", "building", "create", "creating",
  "develop", "developing", "maintain", "maintaining", "monitor", "monitoring",
  "troubleshoot", "troubleshooting", "debug", "debugging", "test", "testing",
  "deploy", "deploying", "release", "releasing", "ship", "shipping",
  // Additional weak words from extraction
  "user", "mobile", "experiences", "showing", "managers", "interfaces",
  "products", "conducting", "component", "libraries", "portfolio",
  "showing", "end-to-end", "managers", "interfaces", "products",
  "senior", "designer", "expert", "strong", "nice", "motion", "tokens",
  "usability", "testing", "mockups", "maintaining", "implementation",
  "conducting", "usability", "mockups", "maintaining", "implementation",
  "motion", "tokens", "senior", "designer", "expert", "strong", "nice",
  "motion", "tokens", "years", "years", "years", "years"
]);

// ── Deterministic fallback (no API key) ───────────────────────────────────────

function deterministicFallback(jd: string, resume: string): AnalysisOutput {
  const jdTerms = extractJdTerms(jd);
  const { score, matched, missing, verdict } = scoreResumeAgainstTerms(resume, jdTerms);
  const cap = capTerm;

  // Filter out weak English words from matched/missing before generating explanations
  const filteredMatched = matched.filter((t) => !WEAK_STRENGTH_WORDS.has(t.toLowerCase()));
  const filteredMissing = missing.filter((t) => !WEAK_STRENGTH_WORDS.has(t.toLowerCase()));

  return {
    overall_match_score: score,
    analysis_summary: `This resume matches approximately ${score}% of the key requirements extracted from the job description. ${filteredMatched.length > 0 ? `Strong alignment on ${filteredMatched.slice(0, 3).map(cap).join(", ")}. ` : ""}${filteredMissing.length > 0 ? `Key gaps include ${filteredMissing.slice(0, 3).map(cap).join(", ")}.` : ""}`,
    strength_analysis: filteredMatched.slice(0, 4).map((t) => ({
      title: cap(t),
      description: `Your resume demonstrates ${t}, which is a key requirement in this role. This alignment strengthens your application.`,
    })),
    gap_analysis: filteredMissing.slice(0, 4).map((t, i) => ({
      title: cap(t),
      severity: (i === 0 ? "High" : i === 1 ? "High" : i === 2 ? "Medium" : "Low") as "High" | "Medium" | "Low",
      description: `The job description emphasises ${t}, which is not clearly demonstrated in your resume. Adding concrete examples would strengthen your candidacy.`,
    })),
    recruiter_perspective: {
      verdict,
      positives: filteredMatched.slice(0, 3).map((t) => `Resume demonstrates ${t} — a requirement explicitly stated in the JD`),
      concerns: filteredMissing.slice(0, 3).map((t) => `No clear evidence of ${t}, which appears in the job requirements`),
    },
    improvement_roadmap: {
      immediate: [
        ...filteredMissing.slice(0, 2).map((t) => `Add specific examples of your ${t} experience to your resume`),
        "Quantify your achievements with measurable outcomes (%, impact, users, revenue)",
      ].slice(0, 3),
      seven_day: [
        "Tailor your resume summary to reflect the specific language of this role",
        "Add a skills section that mirrors the key technologies in the job description",
        ...filteredMissing.slice(2, 4).map((t) => `Document any experience with ${t}, even if indirect`),
      ].slice(0, 3),
      thirty_day: [
        "Complete a project or course that addresses your key skill gaps",
        "Update your LinkedIn profile to align with this role's requirements",
        "Engage with communities or open-source projects in this domain",
      ],
    },
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let jd: string, resume: string;

  try {
    const body = await req.json();
    jd = typeof body.jd === "string" ? body.jd.trim() : "";
    resume = typeof body.resume === "string" ? body.resume.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (jd.length < 50)
    return NextResponse.json({ error: "Job description is too short." }, { status: 400 });
  if (resume.length < 50)
    return NextResponse.json({ error: "Resume text is too short." }, { status: 400 });

  // Use Claude if API key is available; otherwise deterministic fallback.
  // The Claude call is attempted twice (validation retry-once) before
  // gracefully degrading to the deterministic engine.
  if (process.env.ANTHROPIC_API_KEY) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await callClaude(jd, resume);
        return NextResponse.json(result);
      } catch (err) {
        console.error(`[analyze] Claude attempt ${attempt}/2 failed:`, err);
      }
    }
    // Both attempts failed (network or schema) — graceful deterministic fallback
    return NextResponse.json(deterministicFallback(jd, resume));
  }

  return NextResponse.json(deterministicFallback(jd, resume));
}
