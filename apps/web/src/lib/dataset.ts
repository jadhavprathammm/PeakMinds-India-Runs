// Browser-only candidate-dataset parser for the recruiter workflow.
// Supports CSV (native) and XLSX (lazy-loaded SheetJS). Maps loosely-named
// columns to a normalized candidate shape and handles missing columns
// gracefully.

export interface DatasetCandidate {
  name: string;
  resume: string;
  skills: string;
  experience: string;
}

export interface DatasetParseResult {
  candidates: DatasetCandidate[];
  rowCount: number;
  warnings: string[];
}

export class DatasetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatasetError";
  }
}

// Column header synonyms → canonical field.
const COLUMN_MAP: Record<keyof DatasetCandidate, string[]> = {
  name: ["name", "candidate", "candidate name", "full name", "fullname", "applicant"],
  resume: ["resume", "cv", "resume text", "profile", "summary", "bio", "about", "description"],
  skills: ["skills", "skill", "skillset", "technologies", "tech", "expertise", "competencies"],
  experience: ["experience", "exp", "years", "years of experience", "yoe", "work experience", "seniority"],
};

// Field check order. Content fields are matched before "name" so a header like
// "Candidate Skills" maps to skills (not name via the "candidate" synonym).
const FIELD_ORDER: (keyof DatasetCandidate)[] = ["experience", "skills", "resume", "name"];

function canonicalize(header: string): keyof DatasetCandidate | null {
  // Normalize: lowercase, strip punctuation/parentheses, collapse whitespace.
  // "Experience (Years)" -> "experience years"; "Key Skills" -> "key skills".
  const norm = header.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!norm) return null;
  const tokens = new Set(norm.split(" "));

  // Pass 1 — exact match on the normalized header (most precise).
  for (const field of FIELD_ORDER) {
    if (COLUMN_MAP[field].some((syn) => syn === norm)) return field;
  }
  // Pass 2 — tolerant match for real-world headers with extra words/punctuation.
  // Multi-word synonyms must appear as a substring; single-word synonyms must
  // appear as a whole token (avoids "exp" matching inside "expertise", etc.).
  for (const field of FIELD_ORDER) {
    for (const syn of COLUMN_MAP[field]) {
      if (syn.includes(" ")) {
        if (norm.includes(syn)) return field;
      } else if (tokens.has(syn)) {
        return field;
      }
    }
  }
  return null;
}

// Maps a header row to canonical field → column index.
function buildHeaderIndex(headers: string[]): {
  index: Partial<Record<keyof DatasetCandidate, number>>;
  warnings: string[];
} {
  const index: Partial<Record<keyof DatasetCandidate, number>> = {};
  headers.forEach((h, i) => {
    const field = canonicalize(h);
    if (field && index[field] === undefined) index[field] = i;
  });

  const warnings: string[] = [];
  (["name", "resume", "skills", "experience"] as const).forEach((f) => {
    if (index[f] === undefined) warnings.push(`Column "${f}" not found — that field will be blank.`);
  });
  return { index, warnings };
}

function rowsToCandidates(
  rows: string[][],
  headerIndex: Partial<Record<keyof DatasetCandidate, number>>
): DatasetCandidate[] {
  const get = (row: string[], field: keyof DatasetCandidate): string => {
    const i = headerIndex[field];
    return i === undefined ? "" : (row[i] ?? "").toString().trim();
  };

  return rows
    .map((row, n) => {
      const name = get(row, "name") || `Candidate ${n + 1}`;
      const skills = get(row, "skills");
      const experience = get(row, "experience");
      // Resume falls back to skills + experience when no dedicated column.
      let resume = get(row, "resume");
      if (!resume) resume = [skills, experience].filter(Boolean).join(". ");
      return { name, resume, skills, experience };
    })
    .filter((c) => c.resume.length > 0 || c.skills.length > 0);
}

// ── CSV (native, RFC-4180-ish) ──────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\r") { /* skip */ }
      else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

async function parseCSVFile(file: File): Promise<DatasetParseResult> {
  const text = await file.text();
  const matrix = parseCSV(text);
  if (matrix.length < 2) throw new DatasetError("This CSV has no data rows. Add at least one candidate.");
  const [headers, ...dataRows] = matrix;
  const { index, warnings } = buildHeaderIndex(headers);
  const candidates = rowsToCandidates(dataRows, index);
  if (candidates.length === 0) throw new DatasetError("No usable candidate rows were found in this file.");
  return { candidates, rowCount: dataRows.length, warnings };
}

// ── XLSX (lazy-loaded SheetJS) ───────────────────────────────────────────────────

async function parseXLSXFile(file: File): Promise<DatasetParseResult> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new DatasetError("This spreadsheet has no readable sheet.");

  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false, defval: "" });
  if (matrix.length < 2) throw new DatasetError("This spreadsheet has no data rows. Add at least one candidate.");

  const headers = (matrix[0] as unknown[]).map((h) => String(h ?? ""));
  const dataRows = matrix.slice(1).map((r) => (r as unknown[]).map((c) => String(c ?? "")));
  const { index, warnings } = buildHeaderIndex(headers);
  const candidates = rowsToCandidates(dataRows, index);
  if (candidates.length === 0) throw new DatasetError("No usable candidate rows were found in this file.");
  return { candidates, rowCount: dataRows.length, warnings };
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function parseDataset(file: File): Promise<DatasetParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "csv") return parseCSVFile(file);
  if (ext === "xlsx" || ext === "xls") return parseXLSXFile(file);
  throw new DatasetError("Unsupported dataset format. Please upload a CSV or XLSX file.");
}
