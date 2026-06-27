import { NextRequest, NextResponse } from "next/server";
import {
  extractJdTerms,
  scoreResumeAgainstTerms,
  capTerm,
  type RankedCandidate,
} from "@/lib/matching";
import { embedTexts, cosineSim } from "@/lib/embeddings";

export const runtime = "nodejs";

interface IncomingCandidate {
  name?: string;
  resume?: string;
  skills?: string;
  experience?: string;
}

function recruiterNote(
  name: string,
  verdict: string,
  matched: string[],
  missing: string[]
): string {
  const strong = matched.slice(0, 2).map(capTerm).join(", ");
  const weak = missing.slice(0, 2).map(capTerm).join(", ");
  if (verdict === "Strong Match")
    return `Strong alignment${strong ? ` on ${strong}` : ""}. Recommend fast-tracking to interview.`;
  if (verdict === "Interview Recommended")
    return `Solid fit${strong ? ` on ${strong}` : ""}${weak ? `; verify ${weak}` : ""}.`;
  if (verdict === "Borderline")
    return `Partial match${weak ? `; key gaps in ${weak}` : ""}. Review before shortlisting.`;
  return `Limited alignment${weak ? `; missing ${weak}` : ""}. Likely not competitive for this role.`;
}

/**
 * Extract resume sentences most topically relevant to the JD.
 * Used to explain the semantic score component — shown in the candidate drawer.
 * Fast lexical approach (no extra embeddings needed).
 */
function getSemanticEvidence(resume: string, jdTerms: string[]): string[] {
  const sentences = resume
    .split(/[.\n!?•\-*]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length < 200);

  const jdSet = new Set(
    jdTerms.flatMap((t) => [t, ...t.split(/\s+/)])
  );

  const scored = sentences.map((s) => {
    const words = s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
    const hits = words.filter(
      (w) => w.length > 3 && (jdSet.has(w) || jdTerms.some((t) => w.includes(t) || t.includes(w)))
    ).length;
    return { s, hits };
  });

  return scored
    .filter(({ hits }) => hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
    .map(({ s }) => s);
}

export async function POST(req: NextRequest) {
  let jd: string;
  let candidates: IncomingCandidate[];

  try {
    const body = await req.json();
    jd = typeof body.jd === "string" ? body.jd.trim() : "";
    candidates = Array.isArray(body.candidates) ? body.candidates : [];
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (jd.length < 50)
    return NextResponse.json({ error: "Job description is too short." }, { status: 400 });
  if (candidates.length === 0)
    return NextResponse.json({ error: "No candidates provided." }, { status: 400 });

  const jdTerms = extractJdTerms(jd);

  // Build a single text string per candidate for both scoring and embedding.
  const haystacks = candidates.map((c) =>
    [c.resume, c.skills, c.experience].filter(Boolean).join(". ")
  );

  // ── Semantic scoring ─────────────────────────────────────────────────────────
  // Use the extracted JD terms (not the raw JD text) as the embedding input so the
  // representation is focused on required skills, not posting boilerplate.
  const jdForEmbed = jdTerms.join(" ");

  let jdEmbedding: number[] | undefined;
  const resumeEmbeddings: (number[] | undefined)[] = haystacks.map(() => undefined);

  try {
    const allTexts = [jdForEmbed, ...haystacks];
    const embeddings = await embedTexts(allTexts);
    if (embeddings && embeddings.length === allTexts.length) {
      jdEmbedding = embeddings[0];
      for (let i = 0; i < haystacks.length; i++) {
        resumeEmbeddings[i] = embeddings[i + 1];
      }
    }
  } catch {
    // Graceful fallback: scoring without semantic component still works.
    console.error("[rank-candidates] Embedding failed, using keyword-only scoring.");
  }

  // ── Score each candidate ─────────────────────────────────────────────────────
  const scored = candidates.map((c, i) => {
    const name = (c.name ?? "").toString().trim() || "Unnamed candidate";
    const experience = (c.experience ?? "").toString().trim();
    const haystack = haystacks[i];

    const semanticSim =
      jdEmbedding && resumeEmbeddings[i]
        ? cosineSim(jdEmbedding, resumeEmbeddings[i]!)
        : undefined;

    const { score, matched, missing, verdict } = scoreResumeAgainstTerms(
      haystack,
      jdTerms,
      semanticSim,
    );

    const semanticEvidence = getSemanticEvidence(haystack, jdTerms);

    return {
      name,
      score,
      experience,
      verdict,
      matched,
      missing,
      note: recruiterNote(name, verdict, matched, missing),
      semanticEvidence: semanticEvidence.length > 0 ? semanticEvidence : undefined,
    };
  });

  // Deterministic order: score DESC, then name ASC.
  scored.sort((a, b) => (b.score - a.score) || a.name.localeCompare(b.name));

  const ranked: RankedCandidate[] = scored.map((c, i) => ({ rank: i + 1, ...c }));

  const qualified = ranked.filter((c) => c.score >= 60).length;
  const avgScore = ranked.length
    ? Math.round(ranked.reduce((s, c) => s + c.score, 0) / ranked.length)
    : 0;

  return NextResponse.json({
    ranked,
    summary: {
      total: ranked.length,
      qualified,
      avgScore,
      topCandidate: ranked[0]?.name ?? "—",
      semanticEnabled: jdEmbedding !== undefined,
    },
  });
}
