// URL validation utilities.
// Shared by Stage 7 (OSS contributions) and Stage 5 (project URLs).

export function validateUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    // Only allow http/https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}