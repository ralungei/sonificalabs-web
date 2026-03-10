# Theme Token Migration

Design tokens defined in `globals.css` (@theme) and `lib/theme.ts`.
Migrate hardcoded z-index, shadows, and accent RGB values to use tokens.

## Tokens

| Token | CSS var | JS const | Value |
|-------|---------|----------|-------|
| z-sticky | `--z-sticky` | `Z.sticky` | 20 |
| z-dropdown | `--z-dropdown` | `Z.dropdown` | 50 |
| z-overlay | `--z-overlay` | `Z.overlay` | 55 |
| z-mobile-menu | `--z-mobile-menu` | `Z.mobileMenu` | 56 |
| z-editor | `--z-editor` | `Z.editor` | 60 |
| shadow-glow-sm | `--shadow-glow-sm` | - | `0 0 20px rgba(232,168,56,0.2)` |
| shadow-glow-md | `--shadow-glow-md` | - | `0 0 20px rgba(232,168,56,0.3)` |
| shadow-glow-lg | `--shadow-glow-lg` | - | `0 0 24px rgba(232,168,56,0.3)` |
| shadow-glow-button | `--shadow-glow-button` | - | `0 8px 32px rgba(232,168,56,0.25)` |
| shadow-depth-card | `--shadow-depth-card` | - | `0 8px 60px -12px rgba(0,0,0,0.5)` |
| shadow-depth-modal | `--shadow-depth-modal` | - | `0 16px 48px -12px rgba(0,0,0,0.6)` |
| shadow-depth-elevated | `--shadow-depth-elevated` | - | complex |
| accent-rgb | - | `ACCENT.rgb` | `232, 168, 56` |

## Migration per component

### components/

- [x] `Studio.tsx` — z-index (sticky, hover, playhead, snap), shadows, accent RGB in inline styles
- [x] `Navbar.tsx` — z-50 (x3) → z-dropdown, z-[55] → z-overlay, z-[56] → z-mobile-menu
- [x] `PromptForm.tsx` — z-50 (x2) → z-dropdown
- [x] `AudioPlayer.tsx` — accent RGB hex → ACCENT.dim/.base/.bright
- [x] `PipelineReveal.tsx` — (reviewed, all accent in Tailwind classes, no inline changes needed)
- [x] `JobStatus.tsx` — (reviewed, already uses CSS vars, no changes needed)
- [x] `TimelineEditor.tsx` — z-20 → z-sticky

### components/studio/

- [x] `MasterDialog.tsx` — z-50 → z-dropdown
- [x] `TransportBar.tsx` — (reviewed, accent in Tailwind classes only, no inline changes needed)
- [x] `TrackLane.tsx` — z-20 → z-sticky
- [x] `TimelineRuler.tsx` — z-20 → z-sticky
- [x] `WaveformCanvas.tsx` — (no z-index/shadow, skip)

### app/

- [x] `app/[locale]/page.tsx` — accent RGB in inline styles → ACCENT.rgb, z-[60] → z-editor
- [x] `app/[locale]/p/[id]/page.tsx` — z-[60] → z-editor
- [x] `app/[locale]/pricing/page.tsx` — (reviewed, all in Tailwind classes, no changes needed)
- [x] `app/[locale]/about/page.tsx` — (reviewed, all in Tailwind classes, no changes needed)
- [x] `app/[locale]/signin/page.tsx` — accent RGB in inline style → ACCENT.rgb
- [x] `app/[locale]/account/page.tsx` — z-50 → z-dropdown

## Rules

- Use CSS `var(--z-*)` in Tailwind classes: `z-[var(--z-dropdown)]`
- Use JS `Z.*` for inline `style={{ zIndex: Z.sticky }}`
- Use CSS `var(--shadow-*)` in Tailwind: `shadow-[var(--shadow-glow-md)]`
- Replace hardcoded `rgba(232,168,56,...)` with `ACCENT.rgb` from `lib/theme.ts`
- Minimum touch target: 44x44px on interactive elements
- Minimum text: `text-xs` (12px) for body content, `text-[10px]` only for technical UI (timecodes, badges)
