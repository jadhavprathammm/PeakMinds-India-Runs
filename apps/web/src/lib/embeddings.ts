// Server-only — import only from Node.js API routes (runtime = "nodejs").
// Lazy-loads Xenova/all-MiniLM-L6-v2 on first call and caches the pipeline in
// module scope. Concurrent requests share the same loading promise so the model
// is fetched exactly once even under parallel traffic.
// Returns null on any failure; callers fall back to keyword-only scoring.

const EMBEDDING_DIM = 384;

// Pipeline type is not narrowly exported from @huggingface/transformers — use unknown.
let _pipelinePromise: Promise<unknown> | null = null;

async function getPipeline(): Promise<unknown> {
  if (!_pipelinePromise) {
    _pipelinePromise = (async () => {
      const { pipeline } = await import("@huggingface/transformers");
      return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
        dtype: "fp32",
      });
    })();
  }
  return _pipelinePromise;
}

/**
 * Embed a batch of texts using all-MiniLM-L6-v2.
 * Returns an array of 384-dimensional L2-normalised vectors, one per input.
 * Returns null if the model is unavailable (no network on first run, OOM, etc.).
 */
export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  if (texts.length === 0) return [];
  try {
    const pipe = await getPipeline() as (input: string[], opts: Record<string, unknown>) => Promise<{ data: Float32Array; dims: number[] }>;
    const all: number[][] = [];
    const CHUNK = 32; // avoid single oversized batch
    for (let i = 0; i < texts.length; i += CHUNK) {
      const chunk = texts.slice(i, i + CHUNK);
      const out = await pipe(chunk, { pooling: "mean", normalize: true });
      // out.data: Float32Array, out.dims: [chunk.length, EMBEDDING_DIM]
      const data = out.data;
      for (let j = 0; j < chunk.length; j++) {
        all.push(
          Array.from(data.subarray(j * EMBEDDING_DIM, (j + 1) * EMBEDDING_DIM))
        );
      }
    }
    return all;
  } catch (err) {
    console.error("[embeddings] Model unavailable, falling back to keyword-only:", err);
    _pipelinePromise = null; // reset so next request retries
    return null;
  }
}

/**
 * Dot product of two L2-normalised vectors = cosine similarity.
 * Both vectors must have the same length (384).
 */
export function cosineSim(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * (b[i] ?? 0);
  return Math.max(-1, Math.min(1, s)); // clamp floating-point drift
}
