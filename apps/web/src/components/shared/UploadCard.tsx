"use client";

import { useCallback, useRef, useState } from "react";
import { SpinnerIcon, UploadIcon } from "./score-display";

export type UploadState = "idle" | "uploading" | "extracting" | "ready" | "error";

interface UploadCardProps {
  title: string;
  description: string;
  state: UploadState;
  filename: string;
  error: string;
  pasteValue: string;
  onFile: (f: File) => void;
  onPasteChange: (v: string) => void;
  onPasteSubmit: () => void;
  onReset: () => void;
  /** File input accept attribute. Defaults to document formats. */
  accept?: string;
  /** Short label of supported formats shown in the dropzone. */
  formatsLabel?: string;
  /** Whether the paste fallback is shown (datasets can disable it). */
  allowPaste?: boolean;
  /** Label shown during the "extracting" phase. */
  extractingLabel?: string;
}

export default function UploadCard({
  title, description, state, filename, error, pasteValue,
  onFile, onPasteChange, onPasteSubmit, onReset,
  accept = ".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp",
  formatsLabel = "PDF · DOCX · TXT · PNG · JPG",
  allowPaste = true,
  extractingLabel = "Extracting text…",
}: UploadCardProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div className="flex flex-col gap-5 rounded-card border border-border bg-surface/50 p-7 lg:p-8 h-full">
      {/* Header */}
      <div>
        <p className="text-2xl font-semibold text-foreground">{title}</p>
        <p className="mt-1.5 text-base leading-7 text-foreground/60">{description}</p>
      </div>

      {/* State area */}
      <div className="flex-1 flex flex-col gap-4">
        {state === "idle" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            aria-label={`Upload ${title} — click or drag and drop`}
            className={[
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-150",
              dragging
                ? "border-accent bg-accent/[0.04]"
                : "border-border hover:border-border-strong hover:bg-surface/40",
            ].join(" ")}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
              aria-hidden="true"
            />
            <UploadIcon />
            <div>
              <p className="text-[15px] font-semibold text-foreground">
                {dragging ? "Drop to upload" : "Drag & drop or browse"}
              </p>
              <p className="mt-0.5 text-[13px] text-muted">{formatsLabel}</p>
            </div>
          </div>
        )}

        {(state === "uploading" || state === "extracting") && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 p-5">
            <SpinnerIcon />
            <div>
              <p className="text-[15px] font-semibold text-foreground">
                {state === "uploading" ? "Uploading…" : extractingLabel}
              </p>
              <p className="mt-0.5 text-[13px] text-muted">{filename}</p>
            </div>
          </div>
        )}

        {state === "ready" && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent/[0.05] p-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Ready</p>
                <p className="text-[14px] font-medium text-foreground truncate">{filename}</p>
              </div>
            </div>
            <button
              onClick={onReset}
              className="shrink-0 text-[12px] text-muted hover:text-foreground transition-colors"
              aria-label="Remove file"
            >
              ✕
            </button>
          </div>
        )}

        {state === "error" && (
          <>
            <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3.5">
              <p className="text-[13.5px] leading-[1.6] text-red-400">{error}</p>
            </div>
            <button
              onClick={onReset}
              className="self-start text-[13px] font-medium text-accent hover:underline"
            >
              Try again
            </button>
          </>
        )}

        {/* Paste fallback — visible when idle or error */}
        {allowPaste && (state === "idle" || state === "error") && (
          <div className="flex flex-col gap-2">
            <label className="text-[12.5px] font-medium text-muted">Paste content instead</label>
            <textarea
              value={pasteValue}
              onChange={(e) => onPasteChange(e.target.value)}
              placeholder="Paste text here…"
              rows={4}
              className="w-full resize-y rounded-xl border border-border bg-surface/60 px-4 py-3 text-[13.5px] leading-[1.6] text-foreground placeholder:text-muted/40 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/25 transition-colors duration-150"
            />
            <button
              onClick={onPasteSubmit}
              disabled={pasteValue.trim().length < 30}
              className="self-start btn btn-sm btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Use Pasted Text
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
