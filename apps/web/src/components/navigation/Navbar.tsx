"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MobileMenu from "./MobileMenu";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "About", href: "#about" },
];

// Framer Motion v12 requires cubic-bezier easing as a typed 4-tuple.
const easeOutQuart: [number, number, number, number] = [0.25, 1, 0.5, 1];

const linkContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.28 },
  },
};

const linkVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: easeOutQuart },
  },
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Scroll detection — glass effect activates after 20px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    // Set initial state in case page loads scrolled
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu when resizing to desktop width
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOutQuart }}
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "bg-surface/80 backdrop-blur-md border-b border-border"
          : "bg-transparent",
      ].join(" ")}
      aria-label="Main navigation"
    >
      <div className="container-page flex items-center justify-between h-16">
        {/* ── Logo / Wordmark ─────────────────────────────────────────────── */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="PeakMinds — back to top"
          className="group flex items-center gap-2 rounded-sm"
        >
          {/* Simple geometric mark — replace with SVG logo in a later sprint */}
          <span
            className="flex items-center justify-center w-7 h-7 rounded-md bg-accent text-[10px] font-bold text-accent-foreground tracking-tight select-none"
            aria-hidden="true"
          >
            PM
          </span>
          <span className="font-semibold text-[0.9375rem] tracking-tight text-foreground group-hover:text-foreground/80 transition-colors duration-[120ms]">
            PeakMinds
          </span>
        </a>

        {/* ── Desktop nav links ────────────────────────────────────────────── */}
        <motion.ul
          variants={linkContainerVariants}
          initial="hidden"
          animate="visible"
          className="hidden md:flex items-center gap-1"
          role="list"
        >
          {navLinks.map((link) => (
            <motion.li key={link.href} variants={linkVariants}>
              <a
                href={link.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors duration-[120ms]"
              >
                {link.label}
              </a>
            </motion.li>
          ))}
        </motion.ul>

        {/* ── Desktop action buttons ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4, ease: easeOutQuart }}
          className="hidden md:flex items-center gap-2"
        >
          <a href="#hackathon" className="btn btn-sm btn-ghost">
            Hackathon Submission
          </a>
          <a href="#demo" className="btn btn-sm btn-secondary">
            Try Demo
          </a>
          <a href="#get-started" className="btn btn-sm btn-primary">
            Get Started
          </a>
        </motion.div>

        {/* ── Mobile hamburger ─────────────────────────────────────────────── */}
        <motion.button
          ref={hamburgerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32, duration: 0.3 }}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors duration-[120ms]"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {menuOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.14, ease: easeOutQuart }}
              >
                <CloseIcon />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -45, opacity: 0 }}
                transition={{ duration: 0.14, ease: easeOutQuart }}
              >
                <HamburgerIcon />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Mobile menu panel ─────────────────────────────────────────────── */}
      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        navLinks={navLinks}
        triggerRef={hamburgerRef}
      />
    </motion.nav>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="14" height="1.5" rx="0.75" fill="currentColor" />
      <rect
        x="2"
        y="8.25"
        width="14"
        height="1.5"
        rx="0.75"
        fill="currentColor"
      />
      <rect
        x="2"
        y="12.5"
        width="14"
        height="1.5"
        rx="0.75"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
