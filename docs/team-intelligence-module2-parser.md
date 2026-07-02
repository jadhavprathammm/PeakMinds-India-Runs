# Team Intelligence — Module 2: Upload + Parser Layer

Implements the **Team Upload → Team Parser** layer of the Team Intelligence engine.
Turns one or many uploaded team files into a single aggregated `TeamDocument` that is
ready for Team DNA generation. No embeddings, no DNA, no scoring, no UI.

## Files touched (all inside `src/engines/team-intelligence/`, isolated)

| File | Change |
|------|--------|
| `parser.ts` | **Implemented** — multi-file parse + aggregation + graceful degradation |
| `types.ts`  | Extended contract — added `TeamArtifact`, artifact enums, `artifacts[]` on `TeamDocument`, `document_bundle` source format |
| `index.ts`  | Barrel — exports `parseTeamFiles`, `parseTeamDocument`, and the new types |

**Untouched (as required):** `lib/matching.ts`, `lib/embeddings.ts`,
`app/api/rank-candidates/route.ts`, `app/api/analyze/route.ts`. `lib/extraction.ts`
is imported (read-only) but never modified.

## Key design decisions

1. **Multi-file from the start.** The public entry point takes `teamFiles: File[]`
   (not a single `teamFile`). One aggregated `TeamDocument` is produced regardless of
   file count.

2. **Reuse the project's real extractors — no Python.** This is a Next.js/TypeScript
   app with no Python runtime. The brief's "PyMuPDF / python-docx" map onto the stack
   already present in `lib/extraction.ts`:
   - **PDF** → `pdfjs-dist` (with OCR fallback via `tesseract.js`) — the PyMuPDF equivalent
   - **DOCX** → `mammoth` — the python-docx equivalent
   - **TXT** → native `File.text()`

   Introducing a separate Python/PyMuPDF service would violate the "completely isolated
   engine" goal and duplicate working extraction. We reuse instead.

3. **Injectable extractor.** `parseTeamFiles(files, { extractor })` accepts a custom
   `FileTextExtractor`. Default lazily imports `lib/extraction.ts`. This keeps the parser
   unit-testable without a browser/DOM and decoupled from the concrete backend.

4. **Graceful degradation (never throws).** Each file is parsed independently via
   `Promise.allSettled`. A failure becomes a `failed`/`unsupported`/`empty` artifact plus
   a warning; remaining files still parse. If *every* file fails, `raw_text` is `null` and
   the reason is in `parse_warnings` — still no throw.

5. **Source-boundaried combined text.** `raw_text` joins successfully-parsed artifacts with
   `# Source: <filename>` headers and `---` separators, so a later stage can still tell
   files apart (e.g. member segmentation from resume files).

## Contract additions

```ts
type ArtifactSourceType = "pdf" | "docx" | "txt" | "unknown";
type ArtifactStatus     = "parsed" | "empty" | "unsupported" | "failed";

interface TeamArtifact {
  artifact_id: string;
  filename: string;
  source_type: ArtifactSourceType;
  size_bytes: number;
  extracted_characters: number;
  extraction_method: string | null;   // native | pdfjs | mammoth | ocr
  status: ArtifactStatus;
  text: string;                        // this file's extracted text
  parse_warnings: string[];
}

// TeamDocument gained:  artifacts: TeamArtifact[]
//   raw_text is now the COMBINED text across parsed artifacts.
//   source_format gained "document_bundle".
```

## Public API

```ts
import { parseTeamFiles } from "@/engines/team-intelligence";

const doc = await parseTeamFiles(teamFiles, {
  team_name: "Payments Platform",
  target_role: "Senior Backend Engineer",
  // extractor?: FileTextExtractor   // optional override (tests/server)
});
```

`parseTeamDocument(input)` (synchronous) still honours the Module-1 text/profile contract
for callers that already hold raw text or pre-parsed `CandidateProfile[]`.

## Data flow

```
teamFiles: File[]  (PDF / DOCX / TXT)
      │
      ▼  parseTeamFiles()
  ┌──────────────────────────────────────────────┐
  │ for each file  (Promise.allSettled):          │
  │   detectSourceType(name)                       │
  │   ├─ unsupported → artifact{status:unsupported}│
  │   └─ extractor(file)  ── try/catch ──          │
  │        ├─ ok    → artifact{status:parsed|empty}│
  │        └─ throw → artifact{status:failed}      │
  └──────────────────────────────────────────────┘
      │  artifacts: TeamArtifact[]
      ▼  combineText() + roll up warnings
  TeamDocument {
    source_format: "document_bundle",
    raw_text: <combined>,   artifacts[],
    members: [],  metadata,  parse_warnings[]
  }
      │
      ▼  (Module 3) Team DNA generation  ← next
```

## Example output

Given `EngineeringCharter.pdf`, `ManagerNotes.docx`, `TechLeadResume.pdf` (the last one
simulating an unreadable PDF), the parser yields:

```jsonc
{
  "team_id": "team_…",
  "source_format": "document_bundle",
  "raw_text": "# Source: EngineeringCharter.pdf\nCharter: we own the payments platform…\n\n---\n\n# Source: ManagerNotes.docx\nNotes: team of 6, strong on Go/Kafka, thin on ML.",
  "artifacts": [
    { "filename": "EngineeringCharter.pdf", "source_type": "pdf",  "status": "parsed",
      "extracted_characters": 64, "extraction_method": "pdfjs",  "parse_warnings": [] },
    { "filename": "ManagerNotes.docx",      "source_type": "docx", "status": "parsed",
      "extracted_characters": 49, "extraction_method": "mammoth", "parse_warnings": [] },
    { "filename": "TechLeadResume.pdf",     "source_type": "pdf",  "status": "failed",
      "extracted_characters": 0,  "extraction_method": null,
      "parse_warnings": ["Failed to parse \"TechLeadResume.pdf\": We couldn't reliably read this PDF."] }
  ],
  "members": [],
  "metadata": { "team_name": "Payments Platform", "target_role": "Senior Backend Engineer", "org_unit": null, "source_label": null },
  "parse_warnings": ["[TechLeadResume.pdf] Failed to parse \"TechLeadResume.pdf\": We couldn't reliably read this PDF."]
}
```

**Result:** 2 parsed, 1 failed, 0 thrown — one aggregated `TeamDocument` ready for Team DNA.
```
```
