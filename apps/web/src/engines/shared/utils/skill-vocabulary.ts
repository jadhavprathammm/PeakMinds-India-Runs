// Canonical skill normalisation vocabulary for Stages 3 and 5.
// Maps all known surface forms to a single canonical string.
// "scikit learn", "Sci-Kit Learn", "sklearn" → "scikit-learn"

// Raw form → canonical form.
// Keys should be lower-cased; normalizeSkill() lower-cases before lookup.
export const SKILL_VOCABULARY: Record<string, string> = {
  // TODO: populate with ML/data/cloud vocabulary
  // ML frameworks
  // "sklearn": "scikit-learn",
  // "scikit learn": "scikit-learn",
  // "sci-kit learn": "scikit-learn",
  // "tensorflow 2": "tensorflow",
  // "tf": "tensorflow",
  // etc.
};

// Map a raw skill string to its canonical form.
// Returns the canonical string if found; returns the trimmed input otherwise.
export function normalizeSkill(raw: string): string {
  // TODO: implement
  //   1. trim and lower-case raw
  //   2. lookup in SKILL_VOCABULARY
  //   3. return canonical if found, else return trimmed raw
  throw new Error("TODO: implement normalizeSkill");
}

// Remove skills that appear in more than one category.
// A skill may only belong to one category; first occurrence wins.
export function deduplicateAcrossCategories(
  categories: Record<string, string[]>
): Record<string, string[]> {
  // TODO: implement
  //   1. collect all seen skills
  //   2. for each category, filter out already-seen skills
  throw new Error("TODO: implement deduplicateAcrossCategories");
}

// Filter out noise: strings below 2 chars, pure numbers, stopword-only strings.
export function filterNoiseSkills(skills: string[]): string[] {
  // TODO: implement
  throw new Error("TODO: implement filterNoiseSkills");
}
