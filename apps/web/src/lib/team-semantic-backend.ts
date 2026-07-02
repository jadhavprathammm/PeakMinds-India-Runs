// Client-side SemanticBackend for the Team Intelligence orchestrator.
//
// The orchestrator already batches [teamText, ...candidateTexts] into a single
// `embed()` call, so this makes exactly ONE network round-trip per run. It posts
// to /api/team-embed (which reuses the shared MiniLM model server-side) and
// returns one vector per input. Any failure → null, and the orchestrator falls
// back to lexical scoring with a "reduced signal" note. No new model, no new deps.

import type { SemanticBackend } from "@/engines/team-intelligence";

export const httpSemanticBackend: SemanticBackend = {
  name: "minilm-http",
  async embed(texts: string[]): Promise<number[][] | null> {
    if (texts.length === 0) return [];
    try {
      const res = await fetch("/api/team-embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { vectors: number[][] | null };
      return data.vectors ?? null;
    } catch {
      return null; // network/parse failure → degrade to lexical
    }
  },
};
