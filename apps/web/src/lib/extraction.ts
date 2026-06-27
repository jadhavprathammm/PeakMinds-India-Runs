// Browser-only document and image extraction module.
// All functions must be called from "use client" components only.

export type ExtractionResult = {
  text: string;
  method: "native" | "pdfjs" | "ocr" | "mammoth";
  warnings?: string[];
};

const MIN_CHARS = 100;

// ── Public entry point ────────────────────────────────────────────────────────

export async function extractFromFile(file: File): Promise<ExtractionResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "txt") return extractTXT(file);
  if (ext === "docx") return extractDOCX(file);
  if (ext === "pdf") return extractPDF(file);
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return extractImage(file);

  throw new ExtractionError(
    "This file type is not supported. Please use PDF, DOCX, TXT, PNG, JPG, or WEBP."
  );
}

// ── TXT ───────────────────────────────────────────────────────────────────────

async function extractTXT(file: File): Promise<ExtractionResult> {
  const text = await file.text();
  const normalized = normalize(text);
  validateExtracted(normalized, "TXT");
  return { text: normalized, method: "native" };
}

// ── DOCX ──────────────────────────────────────────────────────────────────────

async function extractDOCX(file: File): Promise<ExtractionResult> {
  const buffer = await file.arrayBuffer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth = (await import("mammoth")) as any;
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  const text = normalize(result?.value ?? "");
  validateExtracted(text, "DOCX");
  return { text, method: "mammoth" };
}

// ── PDF ───────────────────────────────────────────────────────────────────────

async function extractPDF(file: File): Promise<ExtractionResult> {
  const buffer = await file.arrayBuffer();

  // Primary: PDF.js text extraction
  let text = "";
  try {
    text = await extractPDFWithPDFJS(buffer);
  } catch {
    // pdfjs failed — fall through to OCR
  }

  if (isUsableText(text)) {
    return { text, method: "pdfjs" };
  }

  // Fallback: OCR the PDF pages (render via pdfjs → canvas → tesseract)
  try {
    const ocrText = await ocrPDF(file, buffer);
    if (isUsableText(ocrText)) {
      return { text: ocrText, method: "ocr", warnings: ["Text extracted via OCR — quality may vary."] };
    }
  } catch {
    // OCR also failed
  }

  throw new ExtractionError(
    "We couldn't reliably read this PDF. Try another version or paste the content manually."
  );
}

async function extractPDFWithPDFJS(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Use locally-served worker to avoid CDN dependency
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str?: string; hasEOL?: boolean }>;
    const pageText = items
      .map((item) => {
        const s = item.str ?? "";
        return item.hasEOL ? s + "\n" : s + " ";
      })
      .join("")
      .replace(/[ \t]+/g, " ");
    pageTexts.push(pageText);
  }

  return normalize(pageTexts.join("\n"));
}

// Renders PDF pages to canvas and OCRs them (for image-only/scanned PDFs)
async function ocrPDF(file: File, buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pageCount = Math.min(pdf.numPages, 4); // OCR first 4 pages max
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    // @ts-expect-error pdfjs-dist v6 RenderParameters typing mismatch with canvas context
    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) continue;

    const imageFile = new File([blob], `page-${pageNum}.png`, { type: "image/png" });
    const result = await runOCR(imageFile);
    pageTexts.push(result.text);
  }

  return normalize(pageTexts.join("\n"));
}

// ── Images ────────────────────────────────────────────────────────────────────

async function extractImage(file: File): Promise<ExtractionResult> {
  const result = await runOCR(file);
  return { ...result, method: "ocr" };
}

async function runOCR(file: File): Promise<{ text: string }> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(file);
    if (data.confidence < 25) {
      throw new ExtractionError(
        "We couldn't read enough text from this image. Try a higher-quality image or paste the content manually."
      );
    }
    return { text: normalize(data.text) };
  } finally {
    await worker.terminate();
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Heuristic: flags output that is mostly symbols / mojibake / corrupted.
// Letters must make up a reasonable share of non-whitespace characters.
function looksCorrupted(text: string): boolean {
  const nonSpace = text.replace(/\s/g, "");
  if (nonSpace.length === 0) return true;
  const letters = (text.match(/[a-zA-Z]/g) ?? []).length;
  return letters / nonSpace.length < 0.4;
}

// Non-throwing usability check used by the PDF flow to decide on OCR fallback.
function isUsableText(text: string): boolean {
  return text.length >= MIN_CHARS && !looksCorrupted(text);
}

// Shared validation for terminal text-based extraction (TXT/DOCX).
// Throws a user-friendly ExtractionError when output is too short or corrupted.
function validateExtracted(text: string, kind: "DOCX" | "TXT"): void {
  const minChars = kind === "TXT" ? 10 : MIN_CHARS;
  if (text.length < minChars) {
    throw new ExtractionError("No readable content was found.");
  }
  if (looksCorrupted(text)) {
    throw new ExtractionError(
      `We couldn't reliably read this ${kind}. Try another version or paste the content manually.`
    );
  }
}

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}
