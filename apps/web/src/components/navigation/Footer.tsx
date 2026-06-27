import Link from "next/link";

const NAV_LINKS = [
  { label: "Architecture", href: "/architecture" },
  { label: "Top 100", href: "/top-100" },
  { label: "Candidate Review", href: "/candidate-review" },
  { label: "Recruiter Upload", href: "/recruiter-upload" },
  { label: "Why It Wins", href: "/why-peakminds" },
];

const GITHUB_URL = "https://github.com/jadhavprathammm/PeakMinds-India-Runs";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/20" aria-label="Site footer">
      <div className="container-page py-12 lg:py-14">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl transition-opacity duration-150 hover:opacity-75"
            >
              <span className="font-bold text-[1.3125rem] tracking-[-0.02em] text-foreground">
                PeakMinds
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-[14px] leading-[1.6] text-muted">
              Talent intelligence that ranks candidates by meaning, evidence, and intent — explainably.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-8 gap-y-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[14px] font-medium text-muted transition-colors duration-150 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] font-medium text-muted transition-colors duration-150 hover:text-foreground"
            >
              GitHub
            </a>
          </nav>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-[13px] text-faint">
            © {new Date().getFullYear()} PeakMinds — Talent Intelligence Platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
