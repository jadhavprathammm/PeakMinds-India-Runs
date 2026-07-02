import { NextRequest, NextResponse } from "next/server";
import { embedTexts } from "@/lib/embeddings";

// Thin server proxy so the (client-side) Team Intelligence pipeline can reuse the
// existing MiniLM embedding utility for its semantic axis. Imports embedTexts —
// never modifies it. On any failure returns { vectors: null } so the caller
// degrades to lexical scoring rather than erroring.

export const runtime = "nodejs";

const MAX_TEXTS = 300; // guardrail: one team + up to ~299 candidate vectors per call

export async function POST(req: NextRequest) {
  let texts: string[];
  try {
    const body = await req.json();
    texts = Array.isArray(body.texts) ? body.texts.filter((x: unknown): x is string => typeof x === "string") : [];
  } catch {
    return NextResponse.json({ vectors: null, error: "Invalid request body." }, { status: 400 });
  }

  if (texts.length === 0) return NextResponse.json({ vectors: [] });
  if (texts.length > MAX_TEXTS)
    return NextResponse.json({ vectors: null, error: `Too many texts (max ${MAX_TEXTS}).` }, { status: 413 });

  try {
    const vectors = await embedTexts(texts);
    return NextResponse.json({ vectors }); // vectors may be null → caller degrades
  } catch (err) {
    console.error("[team-embed] embedding failed:", err);
    return NextResponse.json({ vectors: null });
  }
}
