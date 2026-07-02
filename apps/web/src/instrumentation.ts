// Next.js startup hook (runs once when the server process boots, before any
// request is served). We use it to pre-warm the embedding pipeline so the
// ~90 MB all-MiniLM-L6-v2 download happens at boot — not on the first
// recruiter/candidate request, where it would otherwise time out on a cold
// start and silently fall back to keyword-only scoring.
//
// On a persistent Node host (`next start`), the warmed pipeline is cached in
// module scope (see lib/embeddings.ts) and reused by every subsequent request.
// If the warmup fails it is swallowed — the route still degrades gracefully to
// keyword-only, exactly as before. No scoring logic changes.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { embedTexts } = await import("@/lib/embeddings");
    // One tiny embedding forces model load + cache population at boot.
    await embedTexts(["warmup"]).catch(() => {});
  }
}
