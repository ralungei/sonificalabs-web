/**
 * Design tokens available in JS/TS.
 * CSS tokens live in globals.css @theme — keep both in sync.
 */

/* ── Z-Index scale ──────────────────────────── */
export const Z = {
  sticky: 20,       // sticky columns in timeline
  dropdown: 50,     // dropdowns, navbar
  overlay: 55,      // backdrop overlays
  mobileMenu: 56,   // mobile side panel
  editor: 60,       // fullscreen editor
} as const;

/* ── Touch targets ──────────────────────────── */
export const TOUCH_MIN = 44; // px — Apple HIG minimum

/* ── Transition durations (ms) ──────────────── */
export const DURATION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

/* ── Accent color (for inline styles / canvas) ─ */
export const ACCENT = {
  base: "#0d9488",
  bright: "#14b8a6",
  dim: "#115e56",
  rgb: "13, 148, 136",
} as const;
