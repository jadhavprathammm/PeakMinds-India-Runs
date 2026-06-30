// Deterministic date parsing for Stage 4 (Experience).
// Accepts raw date strings exactly as Claude extracts them from resumes.
// Never throws — returns null for unparseable input.

export interface ParsedDate {
  year: number;
  month: number; // 1–12
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
  q1: 1, q2: 4, q3: 7, q4: 10,
};

export function parseDate(raw: string | null): ParsedDate | null {
  if (!raw || typeof raw !== "string") return null;

  const s = raw.trim().toLowerCase();
  if (!s) return null;

  // 1. ISO format "YYYY-MM" or "YYYY-MM-DD"
  const isoMatch = s.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    if (year >= 1960 && year <= 2030 && month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  // 2. "Month YYYY" or "Mon YYYY" (e.g., "Jan 2020", "January 2020")
  const monthYearMatch = s.match(/^([a-z]{3,9})\s+(\d{4})$/);
  if (monthYearMatch) {
    const monthStr = monthYearMatch[1];
    const year = parseInt(monthYearMatch[2], 10);
    const month = MONTH_MAP[monthStr];
    if (month && year >= 1960 && year <= 2030) {
      return { year, month };
    }
  }

  // 3. "YYYY" bare year
  const bareYearMatch = s.match(/^(\d{4})$/);
  if (bareYearMatch) {
    const year = parseInt(bareYearMatch[1], 10);
    if (year >= 1960 && year <= 2030) {
      return { year, month: 1 }; // default to January
    }
  }

  // 4. "Q3 2021" quarter format
  const quarterMatch = s.match(/^q([1-4])\s+(\d{4})$/);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1], 10);
    const year = parseInt(quarterMatch[2], 10);
    if (year >= 1960 && year <= 2030) {
      const month = (quarter - 1) * 3 + 1;
      return { year, month };
    }
  }

  // 5. "MM/YYYY" or "M/YYYY"
  const slashMatch = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10);
    const year = parseInt(slashMatch[2], 10);
    if (year >= 1960 && year <= 2030 && month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  return null;
}

// Compute duration in months between two parsed dates.
// If end is null (current role), uses the provided fallback (today).
export function computeDurationMonths(
  start: ParsedDate | null,
  end: ParsedDate | null,
  currentDate: ParsedDate,
): number {
  if (!start) return 0;

  const endDate = end ?? currentDate;
  const deltaYears = endDate.year - start.year;
  const deltaMonths = endDate.month - start.month;
  const totalMonths = deltaYears * 12 + deltaMonths;

  return Math.max(0, totalMonths);
}

// Return today's year and month for use as end date for current roles.
export function getCurrentDate(): ParsedDate {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// Month name → month number map. Exported for testing.
export { MONTH_MAP };