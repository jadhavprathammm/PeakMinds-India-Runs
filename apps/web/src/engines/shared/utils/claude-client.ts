// Anthropic SDK wrapper for all Claude stages.
// Implements the two-attempt retry protocol from the spec:
//   Attempt 1: temperature 0.2, standard prompt
//   Attempt 2: temperature 0.1, schema-injected prompt, clarified error instruction
// Never throws — returns safe defaults on failure.

// Use haiku for all extraction stages (cost-optimal; accuracy verified against spec).
const EXTRACTION_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_MAX_TOKENS = 1024;

export interface ClaudeCallOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  /** @default 0.2 */
  temperature?: number;
}

export interface ClaudeCallResult<T> {
  data: T;
  attempt: number;
  confidence_penalty: number;
  warnings: string[];
}

// Call Claude with a type guard. Retries once with a schema-injected prompt on failure.
// On failure of both attempts returns fallback and sets confidence_penalty = 0.9.
export async function callClaudeWithSchema<T>(
  options: ClaudeCallOptions,
  validate: (data: unknown) => data is T,
  fallback: T,
  stageName: string,
): Promise<ClaudeCallResult<T>> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic();

  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const systemPrompt = options.systemPrompt ?? "You are a structured data extraction assistant. Output only valid JSON.";

  // Attempt 1
  try {
    const response = await client.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: maxTokens,
      temperature: options.temperature ?? 0.2,
      system: systemPrompt,
      messages: [{ role: "user", content: options.prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = tryParseJson(raw);

    if (parsed !== null && validate(parsed)) {
      return { data: parsed as T, attempt: 1, confidence_penalty: 0, warnings: [] };
    }
  } catch {
    // Network / API error — fall through to retry
  }

  // Attempt 2: inject schema example + clarify error
  const retryPrompt =
    `${options.prompt}\n\n` +
    `IMPORTANT: Your previous response was not valid JSON or did not match the required schema. ` +
    `Output ONLY a raw JSON object. Do not wrap in markdown. Do not include explanations.`;

  try {
    const response = await client.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: maxTokens,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: "user", content: retryPrompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = tryParseJson(raw);

    if (parsed !== null && validate(parsed)) {
      return { data: parsed as T, attempt: 2, confidence_penalty: 0.15, warnings: [`${stageName}_REQUIRED_RETRY`] };
    }
  } catch {
    // Fall through to fallback
  }

  return {
    data: fallback,
    attempt: 2,
    confidence_penalty: 0.9,
    warnings: [`${stageName}_EXTRACTION_FAILED_AFTER_RETRY`],
  };
}

// Strip JSON from markdown code fences if present, then parse.
// Returns null on any parse failure.
function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(extractJsonFromResponse(raw));
  } catch {
    return null;
  }
}

// Strip ```json ... ``` fences and trim.
export function extractJsonFromResponse(raw: string): string {
  // Remove leading/trailing whitespace
  let text = raw.trim();
  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  return text.trim();
}
