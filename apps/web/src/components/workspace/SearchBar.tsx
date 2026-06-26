"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle"
        aria-hidden="true"
      >
        <SearchIcon />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search candidates, skills or companies..."
        aria-label="Search candidates, skills or companies"
        className="w-full rounded-input border border-border bg-surface/60 py-4 pl-12 pr-28 text-[18px] text-foreground placeholder:text-subtle outline-none transition-colors duration-[250ms] focus:border-accent/50 focus:bg-surface"
      />
      {/* Ctrl K visual hint — decorative, non-functional */}
      <span
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1"
        aria-hidden="true"
      >
        <kbd className="inline-flex h-5 items-center rounded border border-border bg-surface-elevated px-1.5 text-[10px] font-medium text-faint">
          Ctrl
        </kbd>
        <kbd className="inline-flex h-5 items-center rounded border border-border bg-surface-elevated px-1.5 text-[10px] font-medium text-faint">
          K
        </kbd>
      </span>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="5.5" />
      <path d="M12 12l3.5 3.5" />
    </svg>
  );
}
