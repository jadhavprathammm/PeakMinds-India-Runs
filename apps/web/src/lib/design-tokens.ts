/**
 * PeakMinds — Design Tokens (TypeScript mirror)
 *
 * The CSS in `src/styles/tokens.css` is the source of truth for styling.
 * This module mirrors the values that are useful from JS/TS — primarily for
 * animation (e.g. framer-motion durations/easings) and any inline calculations
 * in future component sprints. Keep in sync with tokens.css.
 */

export const colors = {
  accent: "#ff4d8d",
  accentHover: "#ff66a0",
  accentPressed: "#e63e7b",
  accentForeground: "#0a0a0a",
  background: "#0a0a0a",
  surface: "#111111",
  surfaceHover: "#161616",
  surfaceElevated: "#1a1a1a",
  foreground: "#fafafa",
  muted: "#a1a1aa",
  subtle: "#71717a",
  faint: "#52525b",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.14)",
} as const;

export const radius = {
  sm: 8,
  md: 12,
  input: 12,
  button: 16,
  card: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.4)",
  md: "0 4px 12px rgba(0, 0, 0, 0.35)",
  card: "0 1px 3px rgba(0, 0, 0, 0.4), 0 12px 32px rgba(0, 0, 0, 0.28)",
  elevated: "0 16px 48px rgba(0, 0, 0, 0.5)",
  accent: "0 8px 28px rgba(255, 77, 141, 0.25)",
} as const;

export const container = {
  narrow: 768,
  page: 1200,
  wide: 1440,
} as const;

export const spacing = {
  gutter: "1.5rem",
  block: "3rem",
  section: "6rem",
  sectionLg: "8rem",
} as const;

export const buttonSizes = {
  sm: "2.25rem",
  md: "2.75rem",
  lg: "3.25rem",
} as const;

/** Animation durations in milliseconds. */
export const durations = {
  fast: 120,
  base: 200,
  slow: 320,
  slower: 500,
} as const;

export const easings = {
  outQuart: [0.25, 1, 0.5, 1],
  inOutSoft: [0.4, 0, 0.2, 1],
} as const;

export const tokens = {
  colors,
  radius,
  shadows,
  container,
  spacing,
  buttonSizes,
  durations,
  easings,
} as const;

export type DesignTokens = typeof tokens;
