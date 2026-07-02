"use client";

import { useCallback, useRef, useState } from "react";
import { UploadIcon } from "@/components/shared/score-display";

// Multi-file upload card for Team Intelligence documents (PDF/DOCX/TXT).
// Purpose-built alongside UploadCard (which is single-file) so the JD/CSV cards
// are left completely untouched — zero regression risk. Reuses the same visual
// vocabulary to stay consistent with the existing upload UI.

const ACCEPT = ".pdf,.docx,.txt";
const ALLOWED_EXT = ["pdf", "docx", "txt"];

function extOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export default function TeamUploadCard({
  files,
  onAdd,
  onRemove,
  onClear,
}: {
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const incoming = Array.from(list);
      const ok = incoming.filter((f) => ALLOWED_EXT.includes(extOf(f.name)));
      const bad = incoming.filter((f) => !ALLOWED_EXT.includes(extOf(f.name)));
      setRejected(bad.map((f) => f.name));
      if (ok.length) onAdd(ok);
    },
    [onAdd],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      accept(e.dataTransfer.files);
    },
    [accept],
  );

  return (
    <div className="flex flex-col gap-5 rounded-card border border-border bg-surface/50 p-7 lg:p-8">
      <div>
        <p className="text-2xl font-semibold text-foreground">
          Team Intelligence <span className="text-foreground/40 text-lg font-normal">(Optional)</span>
        </p>
        <p className="mt-1.5 text-base leading-7 text-foreground/60">
          Upload team documentation to evaluate candidate compatibility and contribution.
        </p>
      </div>

      {/* Dropzone (always available for adding more files) */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        aria-label="Upload team documents — click or drag and drop"
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-150",
          dragging ? "border-accent bg-accent/[0.04]" : "border-border hover:border-border-strong hover:bg-surface/40",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => { accept(e.target.files); e.currentTarget.value = ""; }}
          aria-hidden="true"
        />
        <UploadIcon />
        <div>
          <p className="text-[15px] font-semibold text-foreground">
            {dragging ? "Drop to upload" : "Drag & drop or browse — multiple files"}
          </p>
          <p className="mt-0.5 text-[13px] text-muted">PDF · DOCX · TXT · charters, notes, resumes</p>
        </div>
      </div>

      {/* Rejected (unsupported) files */}
      {rejected.length > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3">
          <p className="text-[12.5px] text-amber-200/80">
            Skipped unsupported file{rejected.length > 1 ? "s" : ""}: {rejected.join(", ")}. Use PDF, DOCX, or TXT.
          </p>
        </div>
      )}

      {/* Uploaded file list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              {files.length} document{files.length > 1 ? "s" : ""} ready
            </p>
            <button onClick={onClear} className="text-[12px] text-muted hover:text-foreground transition-colors">
              Clear all
            </button>
          </div>
          <ul className="flex flex-col gap-2">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent/[0.05] px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <p className="text-[14px] font-medium text-foreground truncate">{f.name}</p>
                </div>
                <button
                  onClick={() => onRemove(i)}
                  className="shrink-0 text-[12px] text-muted hover:text-foreground transition-colors"
                  aria-label={`Remove ${f.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
