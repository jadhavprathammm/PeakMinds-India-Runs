"use client";

import { useEffect } from "react";

/**
 * Guarantees the landing page always opens at the hero (scroll position 0)
 * when navigated to without a hash — e.g. via the logo or any "Back to
 * PeakMinds" link. Browser/Next scroll restoration is disabled so returning
 * from /top-100, /architecture, or /why-peakminds never lands on Results.
 */
export default function ScrollReset() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Opt out of automatic scroll restoration entirely.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Only force the top when there is no in-page anchor to honor.
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, []);

  return null;
}
