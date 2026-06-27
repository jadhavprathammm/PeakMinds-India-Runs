// Ingestion adapter: wraps lib/extraction.ts and produces the Stage 0 input contract.
// This is the only file that imports from lib/extraction.ts.

import type { ExtractionResult } from "@/lib/extraction";
import type { PreflightInput, SourceFormat } from "@/engines/shared/types";

// Adapt an ExtractionResult (from lib/extraction.ts) into a PreflightInput
// for Stage 0 of the understanding pipeline.
export function adaptExtractionResult(
  result: ExtractionResult,
  fileName: string,
  ocrConfidence?: number,
  pageCount?: number,
): PreflightInput {
  // TODO: implement
  //   1. derive source_format from result.method and fileName extension
  //   2. set char_count from result.text.length
  //   3. pass through ocrConfidence and pageCount from extraction metadata
  void result; void fileName; void ocrConfidence; void pageCount;
  throw new Error("TODO: implement adaptExtractionResult");
}

// Map extraction method to SourceFormat enum value.
function mapMethodToFormat(
  method: ExtractionResult["method"],
  fileName: string,
): SourceFormat {
  // TODO: implement
  //   "native" + .txt → "txt"
  //   "mammoth" → "docx"
  //   "pdfjs" → "pdf"
  //   "ocr" + image extension → "image"
  //   "ocr" + .pdf → "pdf"
  void method; void fileName;
  return "txt";
}
