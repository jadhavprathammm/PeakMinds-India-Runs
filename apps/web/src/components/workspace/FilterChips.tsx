"use client";

interface Props {
  chips: string[];
  active: string | null;
  onToggle: (chip: string) => void;
}

export default function FilterChips({ chips, active, onToggle }: Props) {
  return (
    <div
      role="group"
      aria-label="Filter candidates"
      className="flex flex-wrap gap-2.5"
    >
      {chips.map((chip) => {
        const isActive = active === chip;
        return (
          <button
            key={chip}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(chip)}
            className={[
              "rounded-full border px-4 py-2 text-[16px] font-medium transition-all duration-[250ms]",
              isActive
                ? "border-accent/60 bg-accent/15 text-accent"
                : "border-border bg-surface/40 text-muted hover:border-border-strong hover:text-foreground",
            ].join(" ")}
          >
            {chip}
          </button>
        );
      })}
    </div>
  );
}
