"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface NavLink {
  label: string;
  href: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLink[];
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

// Framer Motion v12 requires cubic-bezier easing as a typed 4-tuple.
const easeOutQuart: [number, number, number, number] = [0.25, 1, 0.5, 1];
const easeInOutSoft: [number, number, number, number] = [0.4, 0, 0.2, 1];

const panelVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: easeOutQuart,
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.16, ease: easeInOutSoft },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: easeOutQuart },
  },
  exit: { opacity: 0, y: -4 },
};

export default function MobileMenu({
  isOpen,
  onClose,
  navLinks,
  triggerRef,
}: MobileMenuProps) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Focus first link on open; return focus to hamburger on close.
  useEffect(() => {
    if (isOpen) {
      // Delay to let the animation frame paint first
      const id = setTimeout(() => firstLinkRef.current?.focus(), 60);
      document.body.style.overflow = "hidden";
      return () => clearTimeout(id);
    } else {
      document.body.style.overflow = "";
      triggerRef.current?.focus();
    }
  }, [isOpen, triggerRef]);

  // Escape closes the menu
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Clean up scroll lock on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute top-full left-0 right-0 border-b border-border bg-surface/95 backdrop-blur-md"
        >
          <div className="container-page py-4 flex flex-col gap-1">
            {/* Nav links */}
            {navLinks.map((link, i) => (
              <motion.a
                key={link.href}
                ref={i === 0 ? firstLinkRef : undefined}
                href={link.href}
                variants={itemVariants}
                onClick={onClose}
                className="flex items-center px-3 py-3 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors duration-150"
              >
                {link.label}
              </motion.a>
            ))}

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="my-2 border-t border-border"
            />

            {/* Action buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-2 pb-2"
            >
              <Link
                href="/architecture"
                onClick={onClose}
                className="btn btn-md btn-secondary w-full"
              >
                Architecture
              </Link>
              <Link
                href="/top-100"
                onClick={onClose}
                className="btn btn-md btn-primary w-full"
              >
                View Rankings
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
