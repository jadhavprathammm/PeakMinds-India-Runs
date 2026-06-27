// Deterministic date parsing for Stage 4 (Experience).
// Accepts raw date strings exactly as Claude extracts them from resumes.
// Never throws — returns null for unparseable input.

export interface ParsedDate {
  year: number;
  month: number; // 1–12
}

// Parse a raw date string from a resume into a normalized { year, month }.
// Handles: "Jan 2019", "2019-01", "January 2019", "2019", "Q3 2021"
// Valid year range: [1960, 2030]. Returns null if out of range or unparseable.
export function parseDate(raw: string | null): ParsedDate | null {
  // TODO: implement
  //   1. return null if raw is null or empty
  //   2. try ISO format "YYYY-MM" → direct parse
  //   3. try "Month YYYY" / "Mon YYYY" → map month name to 1-12
  //   4. try bare "YYYY" → year only, default month to 1
  //   5. validate year in [1960, 2030]
  //   6. return null for anything unrecognised
  void raw;
  return null;
}

// Compute duration in months between two parsed dates.
// If end is null (current role), uses the provided fallback (today).
export function computeDurationMonths(
  start: ParsedDate | null,
  end: ParsedDate | null,
  currentDate: ParsedDate,
): number {
  // TODO: implement
  //   delta = (end ?? currentDate) - start
  //   months = delta.year * 12 + delta.month
  //   return Math.max(0, months)
  void start; void end; void currentDate;
  return 0;
}

// Return today's year and month for use as end date for current roles.
export function getCurrentDate(): ParsedDate {
  // TODO: implement using new Date()
  throw new Error("TODO: implement getCurrentDate");
}

// Month name → month number map. Exported for testing.
export const MONTH_MAP: Record<string, number> = {
  // TODO: populate jan→1 through dec→12, full names and abbreviations
};
