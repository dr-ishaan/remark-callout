/**
 * Built-in callout type definitions — 67 types.
 *
 * Icons are 24x24 viewBox, stroke-based (Lucide style), using `currentColor`
 * so they inherit the callout's color from CSS.
 *
 * Colors use oklch components (L, C, H) — see callout.css for usage.
 *
 * Color families:
 *   Blue      → H ~250  (note, info, example, abstract, update, figure, ...)
 *   Green     → H ~155  (tip, hint, success, check, done, ...)
 *   Purple    → H ~300  (important, quote, cite, definition, aside, ...)
 *   Amber     → H ~80   (warning, attention, todo, correction, draft, ...)
 *   Orange    → H ~55   (question, help, faq, further-reading, discussion, ...)
 *   Red       → H ~25   (caution, danger, error, failure, bug, ...)
 *   Cyan      → H ~195  (security, accessibility, ...)
 *   Teal      → H ~180  (best-practice, milestone, scalability, ...)
 *   Pink      → H ~345  (trivia, ux-insight, ...)
 *   Indigo    → H ~270  (deep-dive, ...)
 *   Gray      → C ~0.02 (shortcut, environment, hardware, ...)
 *   Silver    → C ~0.01 (licensing, ...)
 */

import type { CalloutTypeConfig } from './types.js';

// ─── SVG Icon Templates ─────────────────────────────────────────────────────
// Each is a complete <svg> string with stroke="currentColor" and fill="none".

const svg = (paths: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const ICONS = {
  // ── Core icons (types 1–28) ───────────────────────────────────────────

  /** Circle with "i" — note, info */
  infoCircle: svg(
    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
  ),
  /** Lightbulb — tip, hint */
  lightbulb: svg(
    '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>'
  ),
  /** Exclamation in circle — important */
  exclamationCircle: svg(
    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
  ),
  /** Triangle with "!" — warning, attention */
  triangleAlert: svg(
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
  ),
  /** Hand / stop — caution */
  hand: svg(
    '<path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>'
  ),
  /** Lightning bolt — danger */
  zap: svg(
    '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'
  ),
  /** Checkmark in circle — success, check, done */
  checkCircle: svg(
    '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'
  ),
  /** Question mark in circle — question, help, faq */
  helpCircle: svg(
    '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
  ),
  /** Quotation marks — quote, cite */
  quote: svg(
    '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>'
  ),
  /** Bug/insect — bug */
  bug: svg(
    '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3 3 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>'
  ),
  /** Code brackets — example */
  code: svg(
    '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'
  ),
  /** Checkbox — todo */
  checkbox: svg(
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/>'
  ),
  /** Clipboard — abstract, summary, tldr */
  clipboard: svg(
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>'
  ),
  /** Pencil — correction, draft */
  pencil: svg(
    '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>'
  ),
  /** Arrow refresh — update */
  refreshCw: svg(
    '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'
  ),
  /** Image frame — figure */
  image: svg(
    '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'
  ),
  /** Open book — further-reading, bibliography */
  bookOpen: svg(
    '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'
  ),
  /** Shield with check — prerequisite */
  shieldCheck: svg(
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>'
  ),
  /** Dumbbell — exercise */
  dumbbell: svg(
    '<path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/>'
  ),
  /** Clock — timeline */
  clock: svg(
    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
  ),
  /** Megaphone — announcement */
  megaphone: svg(
    '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>'
  ),
  /** Globe — translation */
  globe: svg(
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>'
  ),
  /** Chat bubbles — discussion */
  messageCircle: svg(
    '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'
  ),
  /** Sidebar panel — aside, sidernote */
  panelRight: svg(
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>'
  ),
  /** Book / dictionary — definition */
  book: svg(
    '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>'
  ),

  // ── Extended icons (types 29–67) ───────────────────────────────────────

  /** Padlock — security, privacy, vulnerability, auth */
  lock: svg(
    '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/>'
  ),
  /** Star — best-practice, recommendation, pro-tip */
  star: svg(
    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
  ),
  /** Trash can — deprecation, deprecated, obsolete, legacy */
  trash2: svg(
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>'
  ),
  /** Graduation cap — theorem, lemma, proof, corollary, axiom */
  graduationCap: svg(
    '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 10 3 12 0v-5"/>'
  ),
  /** Sparkles — trivia, fun-fact, easter-egg */
  sparkles: svg(
    '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>'
  ),
  /** Keyboard — shortcut, hotkey, keybind */
  keyboard: svg(
    '<rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/>'
  ),
  /** Play circle — media, video, audio, podcast, demo */
  playCircle: svg(
    '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>'
  ),
  /** Scale — disclaimer, legal, terms, policy */
  scale: svg(
    '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>'
  ),
  /** Microscope — deep-dive, advanced, technical, details */
  microscope: svg(
    '<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>'
  ),
  /** Rocket — changelog, release, version, new */
  rocket: svg(
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>'
  ),
  /** Download arrow — download, file, asset, resource */
  download: svg(
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'
  ),
  /** Tags — glossary, terms, vocabulary */
  tags: svg(
    '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>'
  ),
  /** Circle X — anti-pattern, pitfall, avoid, bad-practice */
  xCircle: svg(
    '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'
  ),
  /** Balance scales — trade-off, pros-cons, compromise, rationale */
  balance: svg(
    '<line x1="12" y1="3" x2="12" y2="21"/><path d="M4 8H2v4h4"/><path d="M20 8h-2v4h4"/><path d="M4 12c0 2 1.5 3 3 3s3-1 3-3"/><path d="M20 12c0 2-1.5 3-3 3s-3-1-3-3"/><path d="M12 3l-2-2"/><path d="M12 3l2-2"/>'
  ),
  /** Blocks / boxes — architecture, design, structure, system */
  blocks: svg(
    '<rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"/>'
  ),
  /** Badge check — compliance, audit, gdpr, regulatory */
  badgeCheck: svg(
    '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>'
  ),
  /** Eye — accessibility, a11y, inclusion */
  eye: svg(
    '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'
  ),
  /** Gear / settings — environment, config, setup, infrastructure */
  settings: svg(
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'
  ),
  /** Gauge / activity — performance, benchmark, optimization, latency */
  gauge: svg(
    '<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"/><path d="M12 6v6l4 2"/>'
  ),
  /** Activity / pulse — monitoring, telemetry, logs, metrics, alert */
  activity: svg(
    '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>'
  ),
  /** Flask — experimental, beta, alpha, preview, incubator */
  flaskConical: svg(
    '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/>'
  ),
  /** Arrow right circle — migration, upgrade, breaking-change, legacy-move */
  arrowRightCircle: svg(
    '<circle cx="12" cy="12" r="10"/><polyline points="12 16 16 12 12 8"/><line x1="8" y1="12" x2="16" y2="12"/>'
  ),
  /** Wrench — troubleshooting, debug, triage, error-fix */
  wrench: svg(
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'
  ),
  /** Brain — ai-model, llm, prompt, weights, training */
  brain: svg(
    '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>'
  ),
  /** Database — dataset, data, telemetry, inputs */
  database: svg(
    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>'
  ),
  /** Target / crosshair — edge-case, outlier, anomaly, exception */
  target: svg(
    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'
  ),
  /** Flag — milestone, roadmap, epic, sprint-goal, deadline */
  flag: svg(
    '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'
  ),
  /** Dollar / coins — cost, budget, spend, finops, bill */
  dollarSign: svg(
    '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'
  ),
  /** Cloud upload — backup, dr, disaster-recovery, snapshot */
  cloudUpload: svg(
    '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/>'
  ),
  /** Octagon X / ban — blocker, impediment, stuck, dependency */
  octagonX: svg(
    '<path d="m2.5 6.1 4.6-4.6a2 2 0 0 1 2.8 0l5.6 5.6a2 2 0 0 1 0 2.8l-4.6 4.6a2 2 0 0 1-2.8 0L2.5 9a2 2 0 0 1 0-2.9Z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'
  ),
  /** User with search — ux-insight, persona, user-story, feedback */
  userSearch: svg(
    '<circle cx="11" cy="11" r="4"/><path d="M21 21l-4.35-4.35"/><path d="M11 7a3 3 0 0 0-3-3 3 3 0 0 0-2.24 1"/><path d="M18 11a2 2 0 0 1 0 4"/>'
  ),
  /** Clipboard check — test-case, qa, test-spec, validation */
  clipboardCheck: svg(
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>'
  ),
  /** Plug / cable — api-endpoint, route, uri, webhook, graphql */
  plug: svg(
    '<path d="M12 22v-5"/><path d="M9 7V2"/><path d="M15 7V2"/><path d="M6 13V8h12v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4Z"/>'
  ),
  /** Scroll — lore, worldbuilding, flavor-text, history */
  scrollText: svg(
    '<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/>'
  ),
  /** CPU / microchip — hardware, iot, pinout, schematic, specs */
  cpu: svg(
    '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>'
  ),
  /** Copyright — licensing, oss, copyright, eula, terms */
  copyright: svg(
    '<circle cx="12" cy="12" r="10"/><path d="M14.83 14.83a4 4 0 1 1 0-5.66"/>'
  ),
  /** Expanding arrows — scalability, capacity, limits, quotas, load */
  maximize: svg(
    '<path d="m15 3 6 6-6 6"/><path d="m9 21-6-6 6-6"/><line x1="21" y1="9" x2="3" y2="15"/>'
  ),
  /** Glasses / scan — review, pr, peer-review, approval, signoff */
  scanEye: svg(
    '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="M3 12h1"/><path d="M20 12h1"/><path d="M12 3v1"/><path d="M12 20v1"/>'
  ),
  /** Git branch / workflow — ci-cd, pipeline, build, deploy, github-actions */
  gitBranch: svg(
    '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>'
  ),

  // ── Additional unique icons (types 68+) — Lucide-style ──────────────────

  /** infoSerif — Lucide-style stroke icon */
  infoSerif: svg(
    '<circle cx="12" cy="12" r="10"/><path d="M11 16v-4"/><path d="M11 8h.01"/><path d="M13 8h2"/>'
  ),

  /** clipboardCheckIcon — Lucide-style stroke icon */
  clipboardCheckIcon: svg(
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 12 2 2 4-4"/><path d="M8 16h.01"/>'
  ),

  /** messageSquare — Lucide-style stroke icon */
  messageSquare: svg(
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
  ),

  /** sigma — Lucide-style stroke icon */
  sigma: svg(
    '<path d="M18 7V4H6l6 8-6 8h12v-3"/>'
  ),

  /** checkSquare — Lucide-style stroke icon */
  checkSquare: svg(
    '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
  ),

  /** arrowDownCircle — Lucide-style stroke icon */
  arrowDownCircle: svg(
    '<circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/>'
  ),

  /** diamond — Lucide-style stroke icon */
  diamond: svg(
    '<path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z"/>'
  ),

  /** penTool — Lucide-style stroke icon */
  penTool: svg(
    '<path d="m15 5 4 4"/><path d="M13.5 6.5l4 4"/><path d="M21 2l-3.5 3.5"/><path d="M18 5l3 3-9 9-3-3z"/><path d="M11 13l-7 7 3 3 7-7"/><circle cx="9" cy="15" r="1.5"/>'
  ),

  /** layers — Lucide-style stroke icon */
  layers: svg(
    '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>'
  ),

  /** network — Lucide-style stroke icon */
  network: svg(
    '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>'
  ),

  /** gitFork — Lucide-style stroke icon */
  gitFork: svg(
    '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/>'
  ),

  /** link — Lucide-style stroke icon */
  link: svg(
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'
  ),

  /** radio — Lucide-style stroke icon */
  radio: svg(
    '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>'
  ),

  /** project — Lucide-style stroke icon */
  project: svg(
    '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M7 13h4"/>'
  ),

  /** table — Lucide-style stroke icon */
  table: svg(
    '<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>'
  ),

  /** activityPulse — Lucide-style stroke icon */
  activityPulse: svg(
    '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'
  ),

  /** logIn — Lucide-style stroke icon */
  logIn: svg(
    '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>'
  ),

  /** fileText — Lucide-style stroke icon */
  fileText: svg(
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>'
  ),

  /** package — Lucide-style stroke icon */
  package: svg(
    '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'
  ),

  /** trendingUp — Lucide-style stroke icon */
  trendingUp: svg(
    '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'
  ),

  /** alertTriangleBolt — Lucide-style stroke icon */
  alertTriangleBolt: svg(
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/><polyline points="13 11 11 11 12 12 11 13 13 13"/>'
  ),

  /** archive — Lucide-style stroke icon */
  archive: svg(
    '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>'
  ),

  /** shieldAlert — Lucide-style stroke icon */
  shieldAlert: svg(
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
  ),

  /** rotateCcw — Lucide-style stroke icon */
  rotateCcw: svg(
    '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'
  ),

  /** camera — Lucide-style stroke icon */
  camera: svg(
    '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'
  ),

  /** keyRound — Lucide-style stroke icon */
  keyRound: svg(
    '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>'
  ),

  /** check — Lucide-style stroke icon */
  check: svg(
    '<polyline points="20 6 9 17 4 12"/>'
  ),

  /** circleDot — Lucide-style stroke icon */
  circleDot: svg(
    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'
  ),

  /** tag — Lucide-style stroke icon */
  tag: svg(
    '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>'
  ),

  /** gitCommit — Lucide-style stroke icon */
  gitCommit: svg(
    '<circle cx="12" cy="12" r="3"/><path d="M5.25 12H3"/><path d="M21 12h-2.25"/><path d="M12 4.5v-1.5"/><path d="M12 21v-1.5"/>'
  ),

  /** sparkle — Lucide-style stroke icon */
  sparkle: svg(
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>'
  ),

  /** searchCheck — Lucide-style stroke icon */
  searchCheck: svg(
    '<path d="m8 11 2 2 4-4"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'
  ),

  /** gavel — Lucide-style stroke icon */
  gavel: svg(
    '<path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>'
  ),

  /** timer — Lucide-style stroke icon */
  timer: svg(
    '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>'
  ),

  /** barChart — Lucide-style stroke icon */
  barChart: svg(
    '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>'
  ),

  /** bell — Lucide-style stroke icon */
  bell: svg(
    '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'
  ),

  /** wallet — Lucide-style stroke icon */
  wallet: svg(
    '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>'
  ),

  /** creditCard — Lucide-style stroke icon */
  creditCard: svg(
    '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>'
  ),

  /** pieChart — Lucide-style stroke icon */
  pieChart: svg(
    '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>'
  ),

  /** receipt — Lucide-style stroke icon */
  receipt: svg(
    '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>'
  ),

  /** bugCheck — Lucide-style stroke icon */
  bugCheck: svg(
    '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3 3 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/><path d="m9 13 2 2 4-4"/>'
  ),

  /** fileCode — Lucide-style stroke icon */
  fileCode: svg(
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m10 12-2 2 2 2"/><path d="m14 16 2-2-2-2"/>'
  ),

  /** circleCheck — Lucide-style stroke icon */
  circleCheck: svg(
    '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'
  ),

  /** bookmark — Lucide-style stroke icon */
  bookmark: svg(
    '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>'
  ),

  /** externalLink — Lucide-style stroke icon */
  externalLink: svg(
    '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'
  ),

  /** beaker — Lucide-style stroke icon */
  beaker: svg(
    '<path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/>'
  ),

  /** testTube — Lucide-style stroke icon */
  testTube: svg(
    '<path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5h0c-1.4 0-2.5-1.1-2.5-2.5V2"/><path d="M8.5 2h7"/><path d="M14.5 16h-5"/>'
  ),

  /** eyePreview — Lucide-style stroke icon */
  eyePreview: svg(
    '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path d="m9 9 6 6"/>'
  ),

  /** sprout — Lucide-style stroke icon */
  sprout: svg(
    '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>'
  ),

  /** cpuChip — Lucide-style stroke icon */
  cpuChip: svg(
    '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>'
  ),

  /** terminal — Lucide-style stroke icon */
  terminal: svg(
    '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>'
  ),

  /** barbell — Lucide-style stroke icon */
  barbell: svg(
    '<path d="M6.5 6.5 17.5 17.5"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7 7"/><path d="m14 3 7 7"/>'
  ),

  /** list — Lucide-style stroke icon */
  list: svg(
    '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>'
  ),

  /** feather — Lucide-style stroke icon */
  feather: svg(
    '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" x2="2" y1="8" y2="22"/><line x1="17.5" x2="9" y1="15" y2="15"/>'
  ),

  /** gitPullRequest — Lucide-style stroke icon */
  gitPullRequest: svg(
    '<circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="M11 11h5a2 2 0 0 1 2 2v5"/><circle cx="18" cy="18" r="3"/>'
  ),

  /** users — Lucide-style stroke icon */
  users: svg(
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
  ),

  /** thumbsUp — Lucide-style stroke icon */
  thumbsUp: svg(
    '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>'
  ),

  /** penLine — Lucide-style stroke icon */
  penLine: svg(
    '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'
  ),

  /** fileEdit — Lucide-style stroke icon */
  fileEdit: svg(
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 14.5 11 12l3 3-2 2"/><path d="M15 17H9"/>'
  ),

  /** briefcase — Lucide-style stroke icon */
  briefcase: svg(
    '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'
  ),

  /** shield — Lucide-style stroke icon */
  shield: svg(
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>'
  ),

  /** filter — Lucide-style stroke icon */
  filter: svg(
    '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'
  ),

  /** bandage — Lucide-style stroke icon */
  bandage: svg(
    '<path d="M5 14a7 7 0 0 0 7 7L19 14a7 7 0 0 0 0-9.9 7 7 0 0 0-9.9 0L5 14Z"/><path d="M9 11h.01"/><path d="M11 13h.01"/><path d="M13 11h.01"/><path d="M11 9h.01"/><path d="M15 13h.01"/><path d="M17 11h.01"/>'
  ),

  /** scatter — Lucide-style stroke icon */
  scatter: svg(
    '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="12" cy="12" r="2"/>'
  ),

  /** alertOctagon — Lucide-style stroke icon */
  alertOctagon: svg(
    '<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86Z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
  ),

  /** lifeBuoy — Lucide-style stroke icon */
  lifeBuoy: svg(
    '<circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/>'
  ),

  /** messages — Lucide-style stroke icon */
  messages: svg(
    '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>'
  ),

  /** hourglass — Lucide-style stroke icon */
  hourglass: svg(
    '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>'
  ),

  /** clockSlash — Lucide-style stroke icon */
  clockSlash: svg(
    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>'
  ),

  /** thumbsUpDown — Lucide-style stroke icon */
  thumbsUpDown: svg(
    '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/><path d="M17 14v8"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L14 22h0a3.13 3.13 0 0 1-3-3.88Z"/>'
  ),

  /** handshake — Lucide-style stroke icon */
  handshake: svg(
    '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>'
  ),

  /** lightbulbArrow — Lucide-style stroke icon */
  lightbulbArrow: svg(
    '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/><path d="m9 11 3-3 3 3"/>'
  ),

  /** xOctagon — Lucide-style stroke icon */
  xOctagon: svg(
    '<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86Z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'
  ),

  /** bomb — Lucide-style stroke icon */
  bomb: svg(
    '<circle cx="11" cy="13" r="9"/><path d="M14.5 9.5 18 6"/><path d="m21 3-3 3"/><path d="M14 7l3-3"/>'
  ),

  /** skull — Lucide-style stroke icon */
  skull: svg(
    '<circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/>'
  ),

  /** search — Lucide-style stroke icon */
  search: svg(
    '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'
  ),

  /** film — Lucide-style stroke icon */
  film: svg(
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>'
  ),

  /** headphones — Lucide-style stroke icon */
  headphones: svg(
    '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-6a9 9 0 0 1 18 0v6a1 1 0 0 1-1 1h-2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>'
  ),

  /** mic — Lucide-style stroke icon */
  mic: svg(
    '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>'
  ),

  /** monitorPlay — Lucide-style stroke icon */
  monitorPlay: svg(
    '<rect width="20" height="14" x="2" y="3" rx="2"/><polygon points="10 8 16 11 10 14 10 8"/><line x1="8" y1="21" x2="16" y2="21"/>'
  ),

  /** ban — Lucide-style stroke icon */
  ban: svg(
    '<circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/>'
  ),

  /** thumbsDown — Lucide-style stroke icon */
  thumbsDown: svg(
    '<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L14 22h0a3.13 3.13 0 0 1-3-3.88Z"/>'
  ),

  /** shieldOff — Lucide-style stroke icon */
  shieldOff: svg(
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m3 3 18 18"/>'
  ),

  /** lockIcon — Lucide-style stroke icon */
  lockIcon: svg(
    '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1.5"/>'
  ),

  /** link2Break — Lucide-style stroke icon */
  link2Break: svg(
    '<path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 0 1 4.5 7.5"/><path d="M3 21l18-18"/>'
  ),

  /** eyeOff — Lucide-style stroke icon */
  eyeOff: svg(
    '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>'
  ),

  /** keyRound2 — Lucide-style stroke icon */
  keyRound2: svg(
    '<path d="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.726-4.726A2 2 0 0 1 8.938 2h6.124a2 2 0 0 1 1.414.586l4.726 4.726A2 2 0 0 1 21.788 9v6.244a2 2 0 0 1-.586 1.414l-4.726 4.726a2 2 0 0 1-1.414.586H8.938a2 2 0 0 1-1.414-.586z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'
  ),

  /** universalAccess — Lucide-style stroke icon */
  universalAccess: svg(
    '<circle cx="12" cy="12" r="10"/><path d="M10 8h4"/><path d="M9 14l3-3 3 3"/><path d="M12 5v2"/><circle cx="12" cy="5" r="1"/>'
  ),

  /** award — Lucide-style stroke icon */
  award: svg(
    '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>'
  ),

  /** map — Lucide-style stroke icon */
  map: svg(
    '<path d="m9 6 6-2v14l-6 2-6-2V4z"/><path d="m21 8-6 2"/><path d="M3 18l6-2"/><path d="M9 18v-6"/><path d="M15 14v-6"/>'
  ),

  /** mountain — Lucide-style stroke icon */
  mountain: svg(
    '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>'
  ),

  /** alarmClock — Lucide-style stroke icon */
  alarmClock: svg(
    '<circle cx="12" cy="13" r="8"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 2 22"/><path d="M17.64 18.7 22 22"/><path d="M12 9v4"/><path d="M12 17h.01"/>'
  ),

  /** batteryCharging — Lucide-style stroke icon */
  batteryCharging: svg(
    '<path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><path d="M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M2 11h3l2-2v6l-2-2H2"/><path d="M22 11h-3l-2-2v6l2-2h3"/>'
  ),

  /** slash — Lucide-style stroke icon */
  slash: svg(
    '<line x1="2" x2="22" y1="2" y2="22"/>'
  ),

  /** pieChart2 — Lucide-style stroke icon */
  pieChart2: svg(
    '<path d="M21 15a4 4 0 1 1-7-2.65"/><path d="M21 15V11a8 8 0 0 0-8-8h-4"/><circle cx="12" cy="12" r="10"/>'
  ),

  /** server — Lucide-style stroke icon */
  server: svg(
    '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>'
  ),

  /** partyPopper — Lucide-style stroke icon */
  partyPopper: svg(
    '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-1.5.5a2 2 0 0 0-1.45 2.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 22"/>'
  ),

  /** gift — Lucide-style stroke icon */
  gift: svg(
    '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>'
  ),

  /** userCircle — Lucide-style stroke icon */
  userCircle: svg(
    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>'
  ),

  /** bookUser — Lucide-style stroke icon */
  bookUser: svg(
    '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><circle cx="12" cy="10" r="2"/><path d="M9 17c0-2 2-3 3-3s3 1 3 3"/>'
  ),

  /** chevronsRight — Lucide-style stroke icon */
  chevronsRight: svg(
    '<path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>'
  ),

  /** code2 — Lucide-style stroke icon */
  code2: svg(
    '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>'
  ),

  /** listFilter — Lucide-style stroke icon */
  listFilter: svg(
    '<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>'
  ),

  /** command — Lucide-style stroke icon */
  command: svg(
    '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>'
  ),

  /** combo — Lucide-style stroke icon */
  combo: svg(
    '<path d="M15 6v.01"/><path d="M18 6v.01"/><path d="M21 6v.01"/><path d="M9 6h.01"/><path d="M6 6h.01"/><path d="M3 6h.01"/><rect width="18" height="12" x="3" y="10" rx="2"/><path d="M7 14h.01"/><path d="M11 14h.01"/><path d="M15 14h.01"/><path d="M7 18h.01"/><path d="M11 18h.01"/><path d="M15 18h.01"/>'
  ),

  /** terminalIcon — Lucide-style stroke icon */
  terminalIcon: svg(
    '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/><polyline points="20 7 14 13 20 17"/>'
  ),

  /** sliders — Lucide-style stroke icon */
  sliders: svg(
    '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>'
  ),

  /** wrenchIcon — Lucide-style stroke icon */
  wrenchIcon: svg(
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/><path d="M9 11l4 4"/>'
  ),

  /** serverIcon — Lucide-style stroke icon */
  serverIcon: svg(
    '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/><line x1="14" x2="14.01" y1="6" y2="6"/><line x1="14" x2="14.01" y1="18" y2="18"/>'
  ),

  /** wifi — Lucide-style stroke icon */
  wifi: svg(
    '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>'
  ),

  /** grid — Lucide-style stroke icon */
  grid: svg(
    '<rect width="8" height="8" x="3" y="3" rx="1"/><rect width="8" height="8" x="13" y="3" rx="1"/><rect width="8" height="8" x="3" y="13" rx="1"/><rect width="8" height="8" x="13" y="13" rx="1"/>'
  ),

  /** circuitBoard — Lucide-style stroke icon */
  circuitBoard: svg(
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M11 9h4a2 2 0 0 0 2-2V3"/><circle cx="9" cy="9" r="2"/><path d="M7 21v-4a2 2 0 0 1 2-2h4"/><circle cx="15" cy="15" r="2"/>'
  ),

  /** ruler — Lucide-style stroke icon */
  ruler: svg(
    '<path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4Z"/><path d="m7.5 10.5 2 2"/><path d="m10.5 7.5 2 2"/><path d="m13.5 4.5 2 2"/><path d="m4.5 13.5 2 2"/>'
  ),

  /** arrowsFlow — Lucide-style stroke icon */
  arrowsFlow: svg(
    '<path d="M3 8h12a3 3 0 0 1 3 3v0a3 3 0 0 0 3 3h0"/><path d="M3 16h12a3 3 0 0 0 3-3v0a3 3 0 0 1 3-3h0"/><path d="m6 5-3 3 3 3"/><path d="m18 11 3 3-3 3"/>'
  ),

  /** hammer — Lucide-style stroke icon */
  hammer: svg(
    '<path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/>'
  ),

  /** rocketLaunch — Lucide-style stroke icon */
  rocketLaunch: svg(
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/><path d="m2 22 2-2"/>'
  ),

  /** circlePlay — Lucide-style stroke icon */
  circlePlay: svg(
    '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>'
  ),

  /** code2Open — Lucide-style stroke icon */
  code2Open: svg(
    '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="12" y1="2" x2="12" y2="22"/>'
  ),

  /** circleC — Lucide-style stroke icon */
  circleC: svg(
    '<circle cx="12" cy="12" r="10"/><path d="M14.83 14.83a4 4 0 1 1 0-5.66"/><path d="M9 9h.01"/>'
  ),

  /** fileCheck — Lucide-style stroke icon */
  fileCheck: svg(
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/>'
  ),

  /** timerIcon — Lucide-style stroke icon */
  timerIcon: svg(
    '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/>'
  ),

  // ── Additional uniqueness patches (post-dedup pass) ────────────────────

  /** zapClipboard — Lucide-style stroke icon (dedup variant) */
  zapClipboard: svg(
    '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/><rect x="2" y="2" width="6" height="4" rx="1"/>'
  ),

  /** imagePlus — Lucide-style stroke icon (dedup variant) */
  imagePlus: svg(
    '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><path d="M19 3v4"/><path d="M17 5h4"/>'
  ),

  /** compass — Lucide-style stroke icon (dedup variant) */
  compass: svg(
    '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'
  ),

  /** gradCapCheck — Lucide-style stroke icon (dedup variant) */
  gradCapCheck: svg(
    '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 10 3 12 0v-5"/><path d="m9 14 2 2 4-4"/>'
  ),

  /** scrollSeal — Lucide-style stroke icon (dedup variant) */
  scrollSeal: svg(
    '<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H10"/><circle cx="15" cy="9" r="2"/>'
  ),

  /** gaugeNeedle — Lucide-style stroke icon (dedup variant) */
  gaugeNeedle: svg(
    '<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"/><path d="M12 6v6l3 3"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'
  ),

  /** archiveArrow — Lucide-style stroke icon (dedup variant) */
  archiveArrow: svg(
    '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M12 13v5"/><polyline points="10 15 12 13 14 15"/>'
  ),

  /** shieldBug — Lucide-style stroke icon (dedup variant) */
  shieldBug: svg(
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M9 9h.01"/><path d="M15 9h.01"/><path d="M9 13h6"/><path d="M12 7v6"/>'
  ),

  /** clipboardCheckCircle — Lucide-style stroke icon (dedup variant) */
  clipboardCheckCircle: svg(
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><circle cx="12" cy="13" r="3"/><path d="m10.5 13 1 1 2-2"/>'
  ),

  /** shieldStar — Lucide-style stroke icon (dedup variant) */
  shieldStar: svg(
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><polygon points="12 8 13.5 11 16.5 11 14 13 15 16 12 14 9 16 10 13 7.5 11 10.5 11 12 8"/>'
  ),

  /** bookSearch — Lucide-style stroke icon (dedup variant) */
  bookSearch: svg(
    '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><circle cx="11" cy="10" r="2"/><path d="m12.5 11.5 2 2"/>'
  ),

  /** clockBolt — Lucide-style stroke icon (dedup variant) */
  clockBolt: svg(
    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/><path d="M12 2v2"/><path d="M5 5 7 7"/><path d="M2 12h2"/>'
  ),

  /** historyIcon — Lucide-style stroke icon (dedup variant) */
  historyIcon: svg(
    '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>'
  ),

  /** logsIcon — Lucide-style stroke icon (dedup variant) */
  logsIcon: svg(
    '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/><line x1="12" x2="20" y1="15" y2="15"/><line x1="12" x2="20" y1="11" y2="11"/>'
  ),

  /** bookAlpha — Lucide-style stroke icon (dedup variant) */
  bookAlpha: svg(
    '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/><path d="M15 8v4"/><path d="M18 8l-3 6"/><path d="M15 12h2"/>'
  ),

  /** brainCircuit — Lucide-style stroke icon (dedup variant) */
  brainCircuit: svg(
    '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13h2"/><path d="M7 13h2"/><path d="M12 8v8"/>'
  ),

  /** usersHeart — Lucide-style stroke icon (dedup variant) */
  usersHeart: svg(
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11l-2 2-2-2a1.5 1.5 0 0 1 2-2 1.5 1.5 0 0 1 2 2z"/><path d="M16 16v5"/><path d="M19 16v5"/>'
  ),

  /** lightbulbCheck — Lucide-style stroke icon (dedup variant) */
  lightbulbCheck: svg(
    '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/><path d="m9 11 2 2 4-4"/>'
  ),

  /** pitfallIcon — Lucide-style stroke icon (dedup variant) */
  pitfallIcon: svg(
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><circle cx="12" cy="14" r="2"/>'
  ),

  /** bellRing — Lucide-style stroke icon (dedup variant) */
  bellRing: svg(
    '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M4 2C2.8 3.7 2 5.7 2 8"/><path d="M22 8c0-2.3-.8-4.3-2-6"/>'
  ),

  /** bugSearch — Lucide-style stroke icon (dedup variant) */
  bugSearch: svg(
    '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3 3 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><circle cx="14" cy="14" r="3"/><path d="m16 16 2 2"/>'
  ),

  /** flagTarget — Lucide-style stroke icon (dedup variant) */
  flagTarget: svg(
    '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/><circle cx="20" cy="9" r="2"/>'
  ),

  /** exceptionIcon — Lucide-style stroke icon (dedup variant) */
  exceptionIcon: svg(
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="m9 11 6 6"/><path d="m15 11-6 6"/>'
  ),

  /** messagePlus — Lucide-style stroke icon (dedup variant) */
  messagePlus: svg(
    '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9 10h6"/><path d="M12 7v6"/>'
  ),

  /** workflowPlay — Lucide-style stroke icon (dedup variant) */
  workflowPlay: svg(
    '<rect width="8" height="8" x="3" y="3" rx="2"/><rect width="8" height="8" x="13" y="13" rx="2"/><path d="M11 7h2a2 2 0 0 1 2 2v2"/><polygon points="6 17 8 18.5 6 20 6 17"/>'
  ),
} as const;

// ─── Color Families (oklch L C H) ───────────────────────────────────────────

const COLORS = {
  blue:    { colorL: 0.55, colorC: 0.18, colorH: 250 },
  green:   { colorL: 0.60, colorC: 0.17, colorH: 155 },
  purple:  { colorL: 0.55, colorC: 0.20, colorH: 300 },
  amber:   { colorL: 0.78, colorC: 0.16, colorH: 80  },
  orange:  { colorL: 0.68, colorC: 0.17, colorH: 55  },
  red:     { colorL: 0.58, colorC: 0.22, colorH: 25  },
  cyan:    { colorL: 0.60, colorC: 0.15, colorH: 195 },
  teal:    { colorL: 0.60, colorC: 0.15, colorH: 180 },
  pink:    { colorL: 0.62, colorC: 0.18, colorH: 345 },
  indigo:  { colorL: 0.50, colorC: 0.20, colorH: 270 },
  gray:    { colorL: 0.55, colorC: 0.02, colorH: 250 },
  silver:  { colorL: 0.65, colorC: 0.01, colorH: 250 },
} as const;

// ─── Built-in Callout Types ─────────────────────────────────────────────────

export const BUILT_IN_CALLOUTS: Record<string, CalloutTypeConfig> = {

  // ═══════════════════════════════════════════════════════════════════════
  //  BLUE family  (H ~250)
  // ═══════════════════════════════════════════════════════════════════════

  note: {
    defaultTitle: 'Note',
    icon: ICONS.infoCircle,
    ...COLORS.blue,
  },
  info: {
    defaultTitle: 'Info',
    icon: ICONS.infoSerif,
    ...COLORS.blue,
  },
  example: {
    defaultTitle: 'Example',
    icon: ICONS.code,
    ...COLORS.blue,
  },
  abstract: {
    defaultTitle: 'Abstract',
    icon: ICONS.clipboard,
    ...COLORS.blue,
  },
  summary: {
    defaultTitle: 'Summary',
    icon: ICONS.clipboardCheckIcon,
    ...COLORS.blue,
  },
  tldr: {
    defaultTitle: 'TL;DR',
    icon: ICONS.zapClipboard,
    ...COLORS.blue,
  },
  update: {
    defaultTitle: 'Update',
    icon: ICONS.refreshCw,
    ...COLORS.blue,
  },
  figure: {
    defaultTitle: 'Figure',
    icon: ICONS.image,
    ...COLORS.blue,
  },
  sidernote: {
    defaultTitle: 'Side Note',
    icon: ICONS.panelRight,
    ...COLORS.blue,
  },
  translation: {
    defaultTitle: 'Translation',
    icon: ICONS.globe,
    ...COLORS.blue,
  },

  // ── theorem cluster ───────────────────────────────────────────────────
  theorem: {
    defaultTitle: 'Theorem',
    icon: ICONS.graduationCap,
    ...COLORS.blue,
  },
  lemma: {
    defaultTitle: 'Lemma',
    icon: ICONS.sigma,
    ...COLORS.blue,
  },
  proof: {
    defaultTitle: 'Proof',
    icon: ICONS.checkSquare,
    ...COLORS.blue,
  },
  corollary: {
    defaultTitle: 'Corollary',
    icon: ICONS.arrowDownCircle,
    ...COLORS.blue,
  },
  axiom: {
    defaultTitle: 'Axiom',
    icon: ICONS.diamond,
    ...COLORS.blue,
  },

  // ── architecture / api / data / migration / download / backup ─────────
  architecture: {
    defaultTitle: 'Architecture',
    icon: ICONS.blocks,
    ...COLORS.blue,
  },
  design: {
    defaultTitle: 'Design',
    icon: ICONS.penTool,
    ...COLORS.blue,
  },
  structure: {
    defaultTitle: 'Structure',
    icon: ICONS.layers,
    ...COLORS.blue,
  },
  system: {
    defaultTitle: 'System',
    icon: ICONS.network,
    ...COLORS.blue,
  },
  'api-endpoint': {
    defaultTitle: 'API Endpoint',
    icon: ICONS.plug,
    ...COLORS.blue,
  },
  route: {
    defaultTitle: 'Route',
    icon: ICONS.gitFork,
    ...COLORS.blue,
  },
  uri: {
    defaultTitle: 'URI',
    icon: ICONS.link,
    ...COLORS.blue,
  },
  webhook: {
    defaultTitle: 'Webhook',
    icon: ICONS.radio,
    ...COLORS.blue,
  },
  graphql: {
    defaultTitle: 'GraphQL',
    icon: ICONS.project,
    ...COLORS.blue,
  },
  dataset: {
    defaultTitle: 'Dataset',
    icon: ICONS.database,
    ...COLORS.blue,
  },
  data: {
    defaultTitle: 'Data',
    icon: ICONS.table,
    ...COLORS.blue,
  },
  telemetry: {
    defaultTitle: 'Telemetry',
    icon: ICONS.activityPulse,
    ...COLORS.blue,
  },
  inputs: {
    defaultTitle: 'Inputs',
    icon: ICONS.logIn,
    ...COLORS.blue,
  },
  download: {
    defaultTitle: 'Download',
    icon: ICONS.download,
    ...COLORS.blue,
  },
  file: {
    defaultTitle: 'File',
    icon: ICONS.fileText,
    ...COLORS.blue,
  },
  asset: {
    defaultTitle: 'Asset',
    icon: ICONS.imagePlus,
    ...COLORS.blue,
  },
  resource: {
    defaultTitle: 'Resource',
    icon: ICONS.package,
    ...COLORS.blue,
  },
  migration: {
    defaultTitle: 'Migration',
    icon: ICONS.arrowRightCircle,
    ...COLORS.blue,
  },
  upgrade: {
    defaultTitle: 'Upgrade',
    icon: ICONS.trendingUp,
    ...COLORS.blue,
  },
  'breaking-change': {
    defaultTitle: 'Breaking Change',
    icon: ICONS.alertTriangleBolt,
    ...COLORS.blue,
  },
  'legacy-move': {
    defaultTitle: 'Legacy Move',
    icon: ICONS.archiveArrow,
    ...COLORS.blue,
  },
  backup: {
    defaultTitle: 'Backup',
    icon: ICONS.cloudUpload,
    ...COLORS.blue,
  },
  dr: {
    defaultTitle: 'Disaster Recovery',
    icon: ICONS.shieldAlert,
    ...COLORS.blue,
  },
  'disaster-recovery': {
    defaultTitle: 'Disaster Recovery',
    icon: ICONS.rotateCcw,
    ...COLORS.blue,
  },
  snapshot: {
    defaultTitle: 'Snapshot',
    icon: ICONS.camera,
    ...COLORS.blue,
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  GREEN family  (H ~155)
  // ═══════════════════════════════════════════════════════════════════════

  tip: {
    defaultTitle: 'Tip',
    icon: ICONS.lightbulb,
    ...COLORS.green,
  },
  hint: {
    defaultTitle: 'Hint',
    icon: ICONS.keyRound,
    ...COLORS.green,
  },
  success: {
    defaultTitle: 'Success',
    icon: ICONS.checkCircle,
    ...COLORS.green,
  },
  check: {
    defaultTitle: 'Check',
    icon: ICONS.check,
    ...COLORS.green,
  },
  done: {
    defaultTitle: 'Done',
    icon: ICONS.circleDot,
    ...COLORS.green,
  },
  prerequisite: {
    defaultTitle: 'Prerequisite',
    icon: ICONS.shieldCheck,
    ...COLORS.green,
  },
  exercise: {
    defaultTitle: 'Exercise',
    icon: ICONS.dumbbell,
    ...COLORS.green,
  },

  // ── changelog ────────────────────────────────────────────────────────
  changelog: {
    defaultTitle: 'Changelog',
    icon: ICONS.rocket,
    ...COLORS.green,
  },
  release: {
    defaultTitle: 'Release',
    icon: ICONS.tag,
    ...COLORS.green,
  },
  version: {
    defaultTitle: 'Version',
    icon: ICONS.gitCommit,
    ...COLORS.green,
  },
  new: {
    defaultTitle: 'New',
    icon: ICONS.sparkle,
    ...COLORS.green,
  },

  // ── compliance ────────────────────────────────────────────────────────
  compliance: {
    defaultTitle: 'Compliance',
    icon: ICONS.badgeCheck,
    ...COLORS.green,
  },
  audit: {
    defaultTitle: 'Audit',
    icon: ICONS.searchCheck,
    ...COLORS.green,
  },
  gdpr: {
    defaultTitle: 'GDPR',
    icon: ICONS.shieldStar,
    ...COLORS.green,
  },
  regulatory: {
    defaultTitle: 'Regulatory',
    icon: ICONS.gavel,
    ...COLORS.green,
  },

  // ── performance ──────────────────────────────────────────────────────
  performance: {
    defaultTitle: 'Performance',
    icon: ICONS.gauge,
    ...COLORS.green,
  },
  benchmark: {
    defaultTitle: 'Benchmark',
    icon: ICONS.timer,
    ...COLORS.green,
  },
  optimization: {
    defaultTitle: 'Optimization',
    icon: ICONS.gaugeNeedle,
    ...COLORS.green,
  },
  latency: {
    defaultTitle: 'Latency',
    icon: ICONS.clockBolt,
    ...COLORS.green,
  },

  // ── monitoring ───────────────────────────────────────────────────────
  monitoring: {
    defaultTitle: 'Monitoring',
    icon: ICONS.activity,
    ...COLORS.green,
  },
  logs: {
    defaultTitle: 'Logs',
    icon: ICONS.logsIcon,
    ...COLORS.green,
  },
  metrics: {
    defaultTitle: 'Metrics',
    icon: ICONS.barChart,
    ...COLORS.green,
  },
  alert: {
    defaultTitle: 'Alert',
    icon: ICONS.bell,
    ...COLORS.green,
  },

  // ── cost ─────────────────────────────────────────────────────────────
  cost: {
    defaultTitle: 'Cost',
    icon: ICONS.dollarSign,
    ...COLORS.green,
  },
  budget: {
    defaultTitle: 'Budget',
    icon: ICONS.wallet,
    ...COLORS.green,
  },
  spend: {
    defaultTitle: 'Spend',
    icon: ICONS.creditCard,
    ...COLORS.green,
  },
  finops: {
    defaultTitle: 'FinOps',
    icon: ICONS.pieChart,
    ...COLORS.green,
  },
  bill: {
    defaultTitle: 'Bill',
    icon: ICONS.receipt,
    ...COLORS.green,
  },

  // ── test-case ────────────────────────────────────────────────────────
  'test-case': {
    defaultTitle: 'Test Case',
    icon: ICONS.clipboardCheck,
    ...COLORS.green,
  },
  qa: {
    defaultTitle: 'QA',
    icon: ICONS.bugCheck,
    ...COLORS.green,
  },
  'test-spec': {
    defaultTitle: 'Test Spec',
    icon: ICONS.fileCode,
    ...COLORS.green,
  },
  validation: {
    defaultTitle: 'Validation',
    icon: ICONS.clipboardCheckCircle,
    ...COLORS.green,
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  PURPLE family  (H ~300)
  // ═══════════════════════════════════════════════════════════════════════

  important: {
    defaultTitle: 'Important',
    icon: ICONS.exclamationCircle,
    ...COLORS.purple,
  },
  quote: {
    defaultTitle: 'Quote',
    icon: ICONS.quote,
    ...COLORS.purple,
  },
  cite: {
    defaultTitle: 'Cite',
    icon: ICONS.bookmark,
    ...COLORS.purple,
  },
  definition: {
    defaultTitle: 'Definition',
    icon: ICONS.book,
    ...COLORS.purple,
  },
  aside: {
    defaultTitle: 'Aside',
    icon: ICONS.messageSquare,
    ...COLORS.purple,
  },
  timeline: {
    defaultTitle: 'Timeline',
    icon: ICONS.clock,
    ...COLORS.purple,
  },
  bibliography: {
    defaultTitle: 'Bibliography',
    icon: ICONS.bookOpen,
    ...COLORS.purple,
  },

  // ── experimental / ai-model ──────────────────────────────────────────
  experimental: {
    defaultTitle: 'Experimental',
    icon: ICONS.flaskConical,
    ...COLORS.purple,
  },
  beta: {
    defaultTitle: 'Beta',
    icon: ICONS.beaker,
    ...COLORS.purple,
  },
  alpha: {
    defaultTitle: 'Alpha',
    icon: ICONS.testTube,
    ...COLORS.purple,
  },
  preview: {
    defaultTitle: 'Preview',
    icon: ICONS.eyePreview,
    ...COLORS.purple,
  },
  incubator: {
    defaultTitle: 'Incubator',
    icon: ICONS.sprout,
    ...COLORS.purple,
  },
  'ai-model': {
    defaultTitle: 'AI Model',
    icon: ICONS.brain,
    ...COLORS.purple,
  },
  llm: {
    defaultTitle: 'LLM',
    icon: ICONS.brainCircuit,
    ...COLORS.purple,
  },
  prompt: {
    defaultTitle: 'Prompt',
    icon: ICONS.terminal,
    ...COLORS.purple,
  },
  weights: {
    defaultTitle: 'Weights',
    icon: ICONS.barbell,
    ...COLORS.purple,
  },
  training: {
    defaultTitle: 'Training',
    icon: ICONS.gradCapCheck,
    ...COLORS.purple,
  },

  // ── glossary / lore ─────────────────────────────────────────────────
  glossary: {
    defaultTitle: 'Glossary',
    icon: ICONS.bookSearch,
    ...COLORS.purple,
  },
  terms: {
    defaultTitle: 'Terms',
    icon: ICONS.list,
    ...COLORS.purple,
  },
  vocabulary: {
    defaultTitle: 'Vocabulary',
    icon: ICONS.bookAlpha,
    ...COLORS.purple,
  },
  lore: {
    defaultTitle: 'Lore',
    icon: ICONS.scrollText,
    ...COLORS.purple,
  },
  worldbuilding: {
    defaultTitle: 'Worldbuilding',
    icon: ICONS.compass,
    ...COLORS.purple,
  },
  'flavor-text': {
    defaultTitle: 'Flavor Text',
    icon: ICONS.feather,
    ...COLORS.purple,
  },
  history: {
    defaultTitle: 'History',
    icon: ICONS.historyIcon,
    ...COLORS.purple,
  },

  // ── review ───────────────────────────────────────────────────────────
  review: {
    defaultTitle: 'Review',
    icon: ICONS.scanEye,
    ...COLORS.purple,
  },
  pr: {
    defaultTitle: 'PR',
    icon: ICONS.gitPullRequest,
    ...COLORS.purple,
  },
  'peer-review': {
    defaultTitle: 'Peer Review',
    icon: ICONS.users,
    ...COLORS.purple,
  },
  approval: {
    defaultTitle: 'Approval',
    icon: ICONS.thumbsUp,
    ...COLORS.purple,
  },
  signoff: {
    defaultTitle: 'Sign-off',
    icon: ICONS.penLine,
    ...COLORS.purple,
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  AMBER / YELLOW family  (H ~80)
  // ═══════════════════════════════════════════════════════════════════════

  warning: {
    defaultTitle: 'Warning',
    icon: ICONS.triangleAlert,
    ...COLORS.amber,
  },
  attention: {
    defaultTitle: 'Attention',
    icon: ICONS.megaphone,
    ...COLORS.amber,
  },
  todo: {
    defaultTitle: 'Todo',
    icon: ICONS.checkbox,
    ...COLORS.amber,
  },
  correction: {
    defaultTitle: 'Correction',
    icon: ICONS.pencil,
    ...COLORS.amber,
  },
  draft: {
    defaultTitle: 'Draft',
    icon: ICONS.fileEdit,
    ...COLORS.amber,
  },

  // ── disclaimer ───────────────────────────────────────────────────────
  disclaimer: {
    defaultTitle: 'Disclaimer',
    icon: ICONS.scale,
    ...COLORS.amber,
  },
  legal: {
    defaultTitle: 'Legal',
    icon: ICONS.briefcase,
    ...COLORS.amber,
  },
  'legal-terms': {
    defaultTitle: 'Legal Terms',
    icon: ICONS.scrollSeal,
    ...COLORS.amber,
  },
  policy: {
    defaultTitle: 'Policy',
    icon: ICONS.shield,
    ...COLORS.amber,
  },

  // ── troubleshooting ──────────────────────────────────────────────────
  troubleshooting: {
    defaultTitle: 'Troubleshooting',
    icon: ICONS.wrench,
    ...COLORS.amber,
  },
  debug: {
    defaultTitle: 'Debug',
    icon: ICONS.bugSearch,
    ...COLORS.amber,
  },
  triage: {
    defaultTitle: 'Triage',
    icon: ICONS.filter,
    ...COLORS.amber,
  },
  'error-fix': {
    defaultTitle: 'Error Fix',
    icon: ICONS.bandage,
    ...COLORS.amber,
  },

  // ── edge-case ────────────────────────────────────────────────────────
  'edge-case': {
    defaultTitle: 'Edge Case',
    icon: ICONS.target,
    ...COLORS.amber,
  },
  outlier: {
    defaultTitle: 'Outlier',
    icon: ICONS.scatter,
    ...COLORS.amber,
  },
  anomaly: {
    defaultTitle: 'Anomaly',
    icon: ICONS.alertOctagon,
    ...COLORS.amber,
  },
  exception: {
    defaultTitle: 'Exception',
    icon: ICONS.exceptionIcon,
    ...COLORS.amber,
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  ORANGE family  (H ~55)
  // ═══════════════════════════════════════════════════════════════════════

  question: {
    defaultTitle: 'Question',
    icon: ICONS.helpCircle,
    ...COLORS.orange,
  },
  help: {
    defaultTitle: 'Help',
    icon: ICONS.lifeBuoy,
    ...COLORS.orange,
  },
  faq: {
    defaultTitle: 'FAQ',
    icon: ICONS.messages,
    ...COLORS.orange,
  },
  'further-reading': {
    defaultTitle: 'Further Reading',
    icon: ICONS.externalLink,
    ...COLORS.orange,
  },
  discussion: {
    defaultTitle: 'Discussion',
    icon: ICONS.messageCircle,
    ...COLORS.orange,
  },

  // ── deprecation ──────────────────────────────────────────────────────
  deprecation: {
    defaultTitle: 'Deprecation',
    icon: ICONS.trash2,
    ...COLORS.orange,
  },
  deprecated: {
    defaultTitle: 'Deprecated',
    icon: ICONS.archive,
    ...COLORS.orange,
  },
  obsolete: {
    defaultTitle: 'Obsolete',
    icon: ICONS.hourglass,
    ...COLORS.orange,
  },
  legacy: {
    defaultTitle: 'Legacy',
    icon: ICONS.clockSlash,
    ...COLORS.orange,
  },

  // ── trade-off ────────────────────────────────────────────────────────
  'trade-off': {
    defaultTitle: 'Trade-off',
    icon: ICONS.balance,
    ...COLORS.orange,
  },
  'pros-cons': {
    defaultTitle: 'Pros & Cons',
    icon: ICONS.thumbsUpDown,
    ...COLORS.orange,
  },
  compromise: {
    defaultTitle: 'Compromise',
    icon: ICONS.handshake,
    ...COLORS.orange,
  },
  rationale: {
    defaultTitle: 'Rationale',
    icon: ICONS.lightbulbArrow,
    ...COLORS.orange,
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  RED family  (H ~25)
  // ═══════════════════════════════════════════════════════════════════════

  caution: {
    defaultTitle: 'Caution',
    icon: ICONS.hand,
    ...COLORS.red,
  },
  danger: {
    defaultTitle: 'Danger',
    icon: ICONS.zap,
    ...COLORS.red,
  },
  error: {
    defaultTitle: 'Error',
    icon: ICONS.xOctagon,
    ...COLORS.red,
  },
  failure: {
    defaultTitle: 'Failure',
    icon: ICONS.bomb,
    ...COLORS.red,
  },
  fail: {
    defaultTitle: 'Fail',
    icon: ICONS.skull,
    ...COLORS.red,
  },
  missing: {
    defaultTitle: 'Missing',
    icon: ICONS.search,
    ...COLORS.red,
  },
  bug: {
    defaultTitle: 'Bug',
    icon: ICONS.bug,
    ...COLORS.red,
  },
  announcement: {
    defaultTitle: 'Announcement',
    icon: ICONS.bellRing,
    ...COLORS.red,
  },

  // ── media ────────────────────────────────────────────────────────────
  media: {
    defaultTitle: 'Media',
    icon: ICONS.playCircle,
    ...COLORS.red,
  },
  video: {
    defaultTitle: 'Video',
    icon: ICONS.film,
    ...COLORS.red,
  },
  audio: {
    defaultTitle: 'Audio',
    icon: ICONS.headphones,
    ...COLORS.red,
  },
  podcast: {
    defaultTitle: 'Podcast',
    icon: ICONS.mic,
    ...COLORS.red,
  },
  demo: {
    defaultTitle: 'Demo',
    icon: ICONS.monitorPlay,
    ...COLORS.red,
  },

  // ── anti-pattern ─────────────────────────────────────────────────────
  'anti-pattern': {
    defaultTitle: 'Anti-pattern',
    icon: ICONS.xCircle,
    ...COLORS.red,
  },
  pitfall: {
    defaultTitle: 'Pitfall',
    icon: ICONS.pitfallIcon,
    ...COLORS.red,
  },
  avoid: {
    defaultTitle: 'Avoid',
    icon: ICONS.ban,
    ...COLORS.red,
  },
  'bad-practice': {
    defaultTitle: 'Bad Practice',
    icon: ICONS.thumbsDown,
    ...COLORS.red,
  },

  // ── blocker ──────────────────────────────────────────────────────────
  blocker: {
    defaultTitle: 'Blocker',
    icon: ICONS.octagonX,
    ...COLORS.red,
  },
  impediment: {
    defaultTitle: 'Impediment',
    icon: ICONS.shieldOff,
    ...COLORS.red,
  },
  stuck: {
    defaultTitle: 'Stuck',
    icon: ICONS.lockIcon,
    ...COLORS.red,
  },
  dependency: {
    defaultTitle: 'Dependency',
    icon: ICONS.link2Break,
    ...COLORS.red,
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  CYAN family  (H ~195)
  // ═══════════════════════════════════════════════════════════════════════

  security: {
    defaultTitle: 'Security',
    icon: ICONS.lock,
    ...COLORS.cyan,
  },
  privacy: {
    defaultTitle: 'Privacy',
    icon: ICONS.eyeOff,
    ...COLORS.cyan,
  },
  vulnerability: {
    defaultTitle: 'Vulnerability',
    icon: ICONS.shieldBug,
    ...COLORS.cyan,
  },
  auth: {
    defaultTitle: 'Auth',
    icon: ICONS.keyRound2,
    ...COLORS.cyan,
  },
  accessibility: {
    defaultTitle: 'Accessibility',
    icon: ICONS.eye,
    ...COLORS.cyan,
  },
  a11y: {
    defaultTitle: 'A11y',
    icon: ICONS.universalAccess,
    ...COLORS.cyan,
  },
  inclusion: {
    defaultTitle: 'Inclusion',
    icon: ICONS.usersHeart,
    ...COLORS.cyan,
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  TEAL family  (H ~180)
  // ═══════════════════════════════════════════════════════════════════════

  'best-practice': {
    defaultTitle: 'Best Practice',
    icon: ICONS.star,
    ...COLORS.teal,
  },
  recommendation: {
    defaultTitle: 'Recommendation',
    icon: ICONS.lightbulbCheck,
    ...COLORS.teal,
  },
  'pro-tip': {
    defaultTitle: 'Pro Tip',
    icon: ICONS.award,
    ...COLORS.teal,
  },
  milestone: {
    defaultTitle: 'Milestone',
    icon: ICONS.flag,
    ...COLORS.teal,
  },
  roadmap: {
    defaultTitle: 'Roadmap',
    icon: ICONS.map,
    ...COLORS.teal,
  },
  epic: {
    defaultTitle: 'Epic',
    icon: ICONS.mountain,
    ...COLORS.teal,
  },
  'sprint-goal': {
    defaultTitle: 'Sprint Goal',
    icon: ICONS.flagTarget,
    ...COLORS.teal,
  },
  deadline: {
    defaultTitle: 'Deadline',
    icon: ICONS.alarmClock,
    ...COLORS.teal,
  },
  scalability: {
    defaultTitle: 'Scalability',
    icon: ICONS.maximize,
    ...COLORS.teal,
  },
  capacity: {
    defaultTitle: 'Capacity',
    icon: ICONS.batteryCharging,
    ...COLORS.teal,
  },
  limits: {
    defaultTitle: 'Limits',
    icon: ICONS.slash,
    ...COLORS.teal,
  },
  quotas: {
    defaultTitle: 'Quotas',
    icon: ICONS.pieChart2,
    ...COLORS.teal,
  },
  load: {
    defaultTitle: 'Load',
    icon: ICONS.server,
    ...COLORS.teal,
  },
  'rate-limit': {
    defaultTitle: 'Rate Limit',
    icon: ICONS.timerIcon,
    ...COLORS.teal,
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  PINK family  (H ~345)
  // ═══════════════════════════════════════════════════════════════════════

  trivia: {
    defaultTitle: 'Trivia',
    icon: ICONS.sparkles,
    ...COLORS.pink,
  },
  'fun-fact': {
    defaultTitle: 'Fun Fact',
    icon: ICONS.partyPopper,
    ...COLORS.pink,
  },
  'easter-egg': {
    defaultTitle: 'Easter Egg',
    icon: ICONS.gift,
    ...COLORS.pink,
  },
  'ux-insight': {
    defaultTitle: 'UX Insight',
    icon: ICONS.userSearch,
    ...COLORS.pink,
  },
  persona: {
    defaultTitle: 'Persona',
    icon: ICONS.userCircle,
    ...COLORS.pink,
  },
  'user-story': {
    defaultTitle: 'User Story',
    icon: ICONS.bookUser,
    ...COLORS.pink,
  },
  feedback: {
    defaultTitle: 'Feedback',
    icon: ICONS.messagePlus,
    ...COLORS.pink,
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  INDIGO family  (H ~270)
  // ═══════════════════════════════════════════════════════════════════════

  'deep-dive': {
    defaultTitle: 'Deep Dive',
    icon: ICONS.microscope,
    ...COLORS.indigo,
  },
  advanced: {
    defaultTitle: 'Advanced',
    icon: ICONS.chevronsRight,
    ...COLORS.indigo,
  },
  technical: {
    defaultTitle: 'Technical',
    icon: ICONS.code2,
    ...COLORS.indigo,
  },
  details: {
    defaultTitle: 'Details',
    icon: ICONS.listFilter,
    ...COLORS.indigo,
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  GRAY family  (C ~0.02 — low chroma, neutral)
  // ═══════════════════════════════════════════════════════════════════════

  shortcut: {
    defaultTitle: 'Shortcut',
    icon: ICONS.keyboard,
    ...COLORS.gray,
  },
  hotkey: {
    defaultTitle: 'Hotkey',
    icon: ICONS.command,
    ...COLORS.gray,
  },
  keybind: {
    defaultTitle: 'Keybind',
    icon: ICONS.combo,
    ...COLORS.gray,
  },
  environment: {
    defaultTitle: 'Environment',
    icon: ICONS.settings,
    ...COLORS.gray,
  },
  env: {
    defaultTitle: 'Env',
    icon: ICONS.terminalIcon,
    ...COLORS.gray,
  },
  config: {
    defaultTitle: 'Config',
    icon: ICONS.sliders,
    ...COLORS.gray,
  },
  setup: {
    defaultTitle: 'Setup',
    icon: ICONS.wrenchIcon,
    ...COLORS.gray,
  },
  infrastructure: {
    defaultTitle: 'Infrastructure',
    icon: ICONS.serverIcon,
    ...COLORS.gray,
  },
  hardware: {
    defaultTitle: 'Hardware',
    icon: ICONS.cpu,
    ...COLORS.gray,
  },
  iot: {
    defaultTitle: 'IoT',
    icon: ICONS.wifi,
    ...COLORS.gray,
  },
  pinout: {
    defaultTitle: 'Pinout',
    icon: ICONS.grid,
    ...COLORS.gray,
  },
  schematic: {
    defaultTitle: 'Schematic',
    icon: ICONS.circuitBoard,
    ...COLORS.gray,
  },
  specs: {
    defaultTitle: 'Specs',
    icon: ICONS.ruler,
    ...COLORS.gray,
  },
  'ci-cd': {
    defaultTitle: 'CI/CD',
    icon: ICONS.gitBranch,
    ...COLORS.gray,
  },
  pipeline: {
    defaultTitle: 'Pipeline',
    icon: ICONS.arrowsFlow,
    ...COLORS.gray,
  },
  build: {
    defaultTitle: 'Build',
    icon: ICONS.hammer,
    ...COLORS.gray,
  },
  deploy: {
    defaultTitle: 'Deploy',
    icon: ICONS.rocketLaunch,
    ...COLORS.gray,
  },
  'github-actions': {
    defaultTitle: 'GitHub Actions',
    icon: ICONS.workflowPlay,
    ...COLORS.gray,
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  SILVER family  (C ~0.01 — near-neutral)
  // ═══════════════════════════════════════════════════════════════════════

  licensing: {
    defaultTitle: 'Licensing',
    icon: ICONS.copyright,
    ...COLORS.silver,
  },
  oss: {
    defaultTitle: 'OSS',
    icon: ICONS.code2Open,
    ...COLORS.silver,
  },
  copyright: {
    defaultTitle: 'Copyright',
    icon: ICONS.circleC,
    ...COLORS.silver,
  },
  eula: {
    defaultTitle: 'EULA',
    icon: ICONS.fileCheck,
    ...COLORS.silver,
  },
};

/** All built-in type keys, for quick lookup. */
export const BUILT_IN_KEYS = Object.keys(BUILT_IN_CALLOUTS);