// Team Intelligence — Module 2: Upload + Parser layer.
//
// Turns one OR MANY uploaded team artifacts (PDF / DOCX / TXT — charters, manager
// notes, team summaries, member resumes) into a SINGLE aggregated TeamDocument
// with combined text, a per-file artifact list, and team metadata.
//
// Design decisions:
//   • Multi-file from the start: the public entry point takes `teamFiles: File[]`.
//   • Graceful degradation: if one file fails, the rest still parse; a warning is
//     recorded and the parser NEVER throws (mirrors the live engine invariant).
//   • Reuses the project's existing extraction stack rather than adding a Python
//     service. lib/extraction.ts already wraps pdfjs-dist (the PyMuPDF equivalent)
//     and mammoth (the python-docx equivalent) plus a native TXT reader. That
//     module is DO_NOT_TOUCH — we import from it, never modify it.
//   • The extractor is injectable (`options.extractor`) so this layer is unit-
//     testable without a browser/DOM and stays decoupled from the concrete backend.
//
// No embeddings, no Team DNA, no scoring, no UI here — output only.

import type {
  TeamDocument,
  TeamArtifact,
  TeamMemberRef,
  TeamSourceFormat,
  ArtifactSourceType,
  ArtifactStatus,
} from "./types";
import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";

// ── Original Module-1 text/profile contract (still honoured) ─────────────────────

/** Raw input for the synchronous text/profile path (no file IO). */
export interface TeamParserInput {
  /** Raw file text (charter/description) OR null when profiles are supplied. */
  raw_text: string | null;
  /** Pre-parsed candidate profiles, when the caller already has them. */
  profiles: CandidateProfile[] | null;
  /** Hint for how to interpret the input; parser may auto-detect. */
  declared_format: TeamSourceFormat;
  /** Optional labels carried into TeamDocument.metadata. */
  team_name: string | null;
  target_role: string | null;
}

export type ParseTeamDocument = (input: TeamParserInput) => TeamDocument;
export type ParseTeamMember = (raw: string, index: number) => TeamMemberRef;

// ── Multi-file upload contract ───────────────────────────────────────────────────

/** Text extracted from a single file by an extractor. */
export interface ExtractedFileText {
  text: string;
  /** Extraction method label (native / pdfjs / mammoth / ocr …). */
  method: string;
  warnings: string[];
}

/** Pluggable per-file extractor. Defaults to lib/extraction.ts. */
export type FileTextExtractor = (file: File) => Promise<ExtractedFileText>;

export interface ParseTeamFilesOptions {
  /** Explicit team id; auto-generated when omitted. */
  team_id?: string;
  team_name?: string | null;
  org_unit?: string | null;
  target_role?: string | null;
  source_label?: string | null;
  /** Inject a custom extractor (tests / server); defaults to the project stack. */
  extractor?: FileTextExtractor;
}

// ── Supported types ──────────────────────────────────────────────────────────────

const SUPPORTED: Record<string, ArtifactSourceType> = {
  pdf: "pdf",
  docx: "docx",
  txt: "txt",
};

function detectSourceType(filename: string): ArtifactSourceType {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return SUPPORTED[ext] ?? "unknown";
}

// ── Id helpers ───────────────────────────────────────────────────────────────────

function makeId(prefix: string): string {
  const rand =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`;
}

// ── Default extractor (lazy-imports the DO_NOT_TOUCH extraction module) ───────────

const defaultExtractor: FileTextExtractor = async (file) => {
  const { extractFromFile } = await import("@/lib/extraction");
  const result = await extractFromFile(file);
  return {
    text: result.text,
    method: result.method,
    warnings: result.warnings ?? [],
  };
};

// ── Single-file parse (never throws) ─────────────────────────────────────────────

async function parseOneFile(
  file: File,
  extractor: FileTextExtractor,
): Promise<TeamArtifact> {
  const source_type = detectSourceType(file.name);
  const base = {
    artifact_id: makeId("art"),
    filename: file.name,
    source_type,
    size_bytes: file.size,
  };

  if (source_type === "unknown") {
    return {
      ...base,
      extracted_characters: 0,
      extraction_method: null,
      status: "unsupported" as ArtifactStatus,
      text: "",
      parse_warnings: [
        `Unsupported file type for "${file.name}". Supported: PDF, DOCX, TXT.`,
      ],
    };
  }

  try {
    const { text, method, warnings } = await extractor(file);
    const trimmed = text.trim();
    const status: ArtifactStatus = trimmed.length > 0 ? "parsed" : "empty";
    const parse_warnings = [...warnings];
    if (status === "empty") {
      parse_warnings.push(`No usable text extracted from "${file.name}".`);
    }
    return {
      ...base,
      extracted_characters: trimmed.length,
      extraction_method: method,
      status,
      text: trimmed,
      parse_warnings,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown extraction error.";
    return {
      ...base,
      extracted_characters: 0,
      extraction_method: null,
      status: "failed",
      text: "",
      parse_warnings: [`Failed to parse "${file.name}": ${message}`],
    };
  }
}

// ── Aggregation ──────────────────────────────────────────────────────────────────

// Joins per-artifact text into one document with clear source boundaries so a
// later stage (Team DNA / member segmentation) can still tell files apart.
function combineText(artifacts: TeamArtifact[]): string {
  return artifacts
    .filter((a) => a.status === "parsed" && a.text.length > 0)
    .map((a) => `# Source: ${a.filename}\n${a.text}`)
    .join("\n\n---\n\n");
}

/**
 * Public entry point: parse and aggregate many uploaded team files into one
 * TeamDocument. Async (extraction is async). Never throws — per-file failures
 * become warnings and the run continues.
 */
export async function parseTeamFiles(
  teamFiles: File[],
  options: ParseTeamFilesOptions = {},
): Promise<TeamDocument> {
  const extractor = options.extractor ?? defaultExtractor;
  const team_id = options.team_id ?? makeId("team");

  const warnings: string[] = [];
  if (teamFiles.length === 0) {
    warnings.push("No team files were provided.");
  }

  // Parse every file independently; a rejection in one never aborts the others.
  const settled = await Promise.allSettled(
    teamFiles.map((f) => parseOneFile(f, extractor)),
  );

  const artifacts: TeamArtifact[] = settled.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    // parseOneFile is designed never to reject, but guard defensively.
    const name = teamFiles[i]?.name ?? `file_${i}`;
    return {
      artifact_id: makeId("art"),
      filename: name,
      source_type: detectSourceType(name),
      size_bytes: teamFiles[i]?.size ?? 0,
      extracted_characters: 0,
      extraction_method: null,
      status: "failed",
      text: "",
      parse_warnings: [`Unexpected failure parsing "${name}".`],
    };
  });

  // Roll per-artifact warnings up to the document level for a single view.
  for (const a of artifacts) {
    for (const w of a.parse_warnings) warnings.push(`[${a.filename}] ${w}`);
  }

  const parsedCount = artifacts.filter((a) => a.status === "parsed").length;
  if (teamFiles.length > 0 && parsedCount === 0) {
    warnings.push("No files could be parsed — TeamDocument has no usable text.");
  }

  const combined = combineText(artifacts);

  return {
    team_id,
    source_format: "document_bundle",
    raw_text: combined.length > 0 ? combined : null,
    artifacts,
    members: [], // member segmentation is deferred to the understanding/DNA stage
    metadata: {
      team_name: options.team_name ?? null,
      org_unit: options.org_unit ?? null,
      target_role: options.target_role ?? null,
      source_label: options.source_label ?? null,
    },
    parse_warnings: warnings,
  };
}

// ── Module-1 synchronous text/profile path (no file IO) ──────────────────────────
//
// Honours the original ParseTeamDocument contract for callers that already hold
// text or pre-parsed profiles (e.g. profile_bundle). Never throws.
export const parseTeamDocument: ParseTeamDocument = (input) => {
  const team_id = makeId("team");
  const warnings: string[] = [];

  if (input.profiles && input.profiles.length > 0) {
    const members: TeamMemberRef[] = input.profiles.map((profile, i) => ({
      member_id: `m_${i}`,
      name: profile.candidate_name,
      raw_text: "",
      profile,
    }));
    return {
      team_id,
      source_format: "profile_bundle",
      raw_text: null,
      artifacts: [],
      members,
      metadata: {
        team_name: input.team_name,
        org_unit: null,
        target_role: input.target_role,
        source_label: null,
      },
      parse_warnings: warnings,
    };
  }

  const text = (input.raw_text ?? "").trim();
  if (text.length === 0) warnings.push("No raw text or profiles supplied.");

  const artifacts: TeamArtifact[] =
    text.length > 0
      ? [
          {
            artifact_id: makeId("art"),
            filename: "inline-text",
            source_type: "txt",
            size_bytes: text.length,
            extracted_characters: text.length,
            extraction_method: "native",
            status: "parsed",
            text,
            parse_warnings: [],
          },
        ]
      : [];

  return {
    team_id,
    source_format:
      input.declared_format === "unknown" ? "team_description" : input.declared_format,
    raw_text: text.length > 0 ? text : null,
    artifacts,
    members: [],
    metadata: {
      team_name: input.team_name,
      org_unit: null,
      target_role: input.target_role,
      source_label: null,
    },
    parse_warnings: warnings,
  };
};
