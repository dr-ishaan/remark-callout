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
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

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
    icon: ICONS.infoCircle,
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
    icon: ICONS.clipboard,
    ...COLORS.blue,
  },
  tldr: {
    defaultTitle: 'TL;DR',
    icon: ICONS.clipboard,
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
    icon: ICONS.graduationCap,
    ...COLORS.blue,
  },
  proof: {
    defaultTitle: 'Proof',
    icon: ICONS.graduationCap,
    ...COLORS.blue,
  },
  corollary: {
    defaultTitle: 'Corollary',
    icon: ICONS.graduationCap,
    ...COLORS.blue,
  },
  axiom: {
    defaultTitle: 'Axiom',
    icon: ICONS.graduationCap,
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
    icon: ICONS.blocks,
    ...COLORS.blue,
  },
  structure: {
    defaultTitle: 'Structure',
    icon: ICONS.blocks,
    ...COLORS.blue,
  },
  system: {
    defaultTitle: 'System',
    icon: ICONS.blocks,
    ...COLORS.blue,
  },
  'api-endpoint': {
    defaultTitle: 'API Endpoint',
    icon: ICONS.plug,
    ...COLORS.blue,
  },
  route: {
    defaultTitle: 'Route',
    icon: ICONS.plug,
    ...COLORS.blue,
  },
  uri: {
    defaultTitle: 'URI',
    icon: ICONS.plug,
    ...COLORS.blue,
  },
  webhook: {
    defaultTitle: 'Webhook',
    icon: ICONS.plug,
    ...COLORS.blue,
  },
  graphql: {
    defaultTitle: 'GraphQL',
    icon: ICONS.plug,
    ...COLORS.blue,
  },
  dataset: {
    defaultTitle: 'Dataset',
    icon: ICONS.database,
    ...COLORS.blue,
  },
  data: {
    defaultTitle: 'Data',
    icon: ICONS.database,
    ...COLORS.blue,
  },
  telemetry: {
    defaultTitle: 'Telemetry',
    icon: ICONS.database,
    ...COLORS.blue,
  },
  inputs: {
    defaultTitle: 'Inputs',
    icon: ICONS.database,
    ...COLORS.blue,
  },
  download: {
    defaultTitle: 'Download',
    icon: ICONS.download,
    ...COLORS.blue,
  },
  file: {
    defaultTitle: 'File',
    icon: ICONS.download,
    ...COLORS.blue,
  },
  asset: {
    defaultTitle: 'Asset',
    icon: ICONS.download,
    ...COLORS.blue,
  },
  resource: {
    defaultTitle: 'Resource',
    icon: ICONS.download,
    ...COLORS.blue,
  },
  migration: {
    defaultTitle: 'Migration',
    icon: ICONS.arrowRightCircle,
    ...COLORS.blue,
  },
  upgrade: {
    defaultTitle: 'Upgrade',
    icon: ICONS.arrowRightCircle,
    ...COLORS.blue,
  },
  'breaking-change': {
    defaultTitle: 'Breaking Change',
    icon: ICONS.arrowRightCircle,
    ...COLORS.blue,
  },
  'legacy-move': {
    defaultTitle: 'Legacy Move',
    icon: ICONS.arrowRightCircle,
    ...COLORS.blue,
  },
  backup: {
    defaultTitle: 'Backup',
    icon: ICONS.cloudUpload,
    ...COLORS.blue,
  },
  dr: {
    defaultTitle: 'Disaster Recovery',
    icon: ICONS.cloudUpload,
    ...COLORS.blue,
  },
  'disaster-recovery': {
    defaultTitle: 'Disaster Recovery',
    icon: ICONS.cloudUpload,
    ...COLORS.blue,
  },
  snapshot: {
    defaultTitle: 'Snapshot',
    icon: ICONS.cloudUpload,
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
    icon: ICONS.lightbulb,
    ...COLORS.green,
  },
  success: {
    defaultTitle: 'Success',
    icon: ICONS.checkCircle,
    ...COLORS.green,
  },
  check: {
    defaultTitle: 'Check',
    icon: ICONS.checkCircle,
    ...COLORS.green,
  },
  done: {
    defaultTitle: 'Done',
    icon: ICONS.checkCircle,
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
    icon: ICONS.rocket,
    ...COLORS.green,
  },
  version: {
    defaultTitle: 'Version',
    icon: ICONS.rocket,
    ...COLORS.green,
  },
  new: {
    defaultTitle: 'New',
    icon: ICONS.rocket,
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
    icon: ICONS.badgeCheck,
    ...COLORS.green,
  },
  gdpr: {
    defaultTitle: 'GDPR',
    icon: ICONS.badgeCheck,
    ...COLORS.green,
  },
  regulatory: {
    defaultTitle: 'Regulatory',
    icon: ICONS.badgeCheck,
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
    icon: ICONS.gauge,
    ...COLORS.green,
  },
  optimization: {
    defaultTitle: 'Optimization',
    icon: ICONS.gauge,
    ...COLORS.green,
  },
  latency: {
    defaultTitle: 'Latency',
    icon: ICONS.gauge,
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
    icon: ICONS.activity,
    ...COLORS.green,
  },
  metrics: {
    defaultTitle: 'Metrics',
    icon: ICONS.activity,
    ...COLORS.green,
  },
  alert: {
    defaultTitle: 'Alert',
    icon: ICONS.activity,
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
    icon: ICONS.dollarSign,
    ...COLORS.green,
  },
  spend: {
    defaultTitle: 'Spend',
    icon: ICONS.dollarSign,
    ...COLORS.green,
  },
  finops: {
    defaultTitle: 'FinOps',
    icon: ICONS.dollarSign,
    ...COLORS.green,
  },
  bill: {
    defaultTitle: 'Bill',
    icon: ICONS.dollarSign,
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
    icon: ICONS.clipboardCheck,
    ...COLORS.green,
  },
  'test-spec': {
    defaultTitle: 'Test Spec',
    icon: ICONS.clipboardCheck,
    ...COLORS.green,
  },
  validation: {
    defaultTitle: 'Validation',
    icon: ICONS.clipboardCheck,
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
    icon: ICONS.quote,
    ...COLORS.purple,
  },
  definition: {
    defaultTitle: 'Definition',
    icon: ICONS.book,
    ...COLORS.purple,
  },
  aside: {
    defaultTitle: 'Aside',
    icon: ICONS.panelRight,
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
    icon: ICONS.flaskConical,
    ...COLORS.purple,
  },
  alpha: {
    defaultTitle: 'Alpha',
    icon: ICONS.flaskConical,
    ...COLORS.purple,
  },
  preview: {
    defaultTitle: 'Preview',
    icon: ICONS.flaskConical,
    ...COLORS.purple,
  },
  incubator: {
    defaultTitle: 'Incubator',
    icon: ICONS.flaskConical,
    ...COLORS.purple,
  },
  'ai-model': {
    defaultTitle: 'AI Model',
    icon: ICONS.brain,
    ...COLORS.purple,
  },
  llm: {
    defaultTitle: 'LLM',
    icon: ICONS.brain,
    ...COLORS.purple,
  },
  prompt: {
    defaultTitle: 'Prompt',
    icon: ICONS.brain,
    ...COLORS.purple,
  },
  weights: {
    defaultTitle: 'Weights',
    icon: ICONS.brain,
    ...COLORS.purple,
  },
  training: {
    defaultTitle: 'Training',
    icon: ICONS.brain,
    ...COLORS.purple,
  },

  // ── glossary / lore ─────────────────────────────────────────────────
  glossary: {
    defaultTitle: 'Glossary',
    icon: ICONS.tags,
    ...COLORS.purple,
  },
  terms: {
    defaultTitle: 'Terms',
    icon: ICONS.tags,
    ...COLORS.purple,
  },
  vocabulary: {
    defaultTitle: 'Vocabulary',
    icon: ICONS.tags,
    ...COLORS.purple,
  },
  lore: {
    defaultTitle: 'Lore',
    icon: ICONS.scrollText,
    ...COLORS.purple,
  },
  worldbuilding: {
    defaultTitle: 'Worldbuilding',
    icon: ICONS.scrollText,
    ...COLORS.purple,
  },
  'flavor-text': {
    defaultTitle: 'Flavor Text',
    icon: ICONS.scrollText,
    ...COLORS.purple,
  },
  history: {
    defaultTitle: 'History',
    icon: ICONS.scrollText,
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
    icon: ICONS.scanEye,
    ...COLORS.purple,
  },
  'peer-review': {
    defaultTitle: 'Peer Review',
    icon: ICONS.scanEye,
    ...COLORS.purple,
  },
  approval: {
    defaultTitle: 'Approval',
    icon: ICONS.scanEye,
    ...COLORS.purple,
  },
  signoff: {
    defaultTitle: 'Sign-off',
    icon: ICONS.scanEye,
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
    icon: ICONS.triangleAlert,
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
    icon: ICONS.pencil,
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
    icon: ICONS.scale,
    ...COLORS.amber,
  },
  'legal-terms': {
    defaultTitle: 'Legal Terms',
    icon: ICONS.scale,
    ...COLORS.amber,
  },
  policy: {
    defaultTitle: 'Policy',
    icon: ICONS.scale,
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
    icon: ICONS.wrench,
    ...COLORS.amber,
  },
  triage: {
    defaultTitle: 'Triage',
    icon: ICONS.wrench,
    ...COLORS.amber,
  },
  'error-fix': {
    defaultTitle: 'Error Fix',
    icon: ICONS.wrench,
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
    icon: ICONS.target,
    ...COLORS.amber,
  },
  anomaly: {
    defaultTitle: 'Anomaly',
    icon: ICONS.target,
    ...COLORS.amber,
  },
  exception: {
    defaultTitle: 'Exception',
    icon: ICONS.target,
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
    icon: ICONS.helpCircle,
    ...COLORS.orange,
  },
  faq: {
    defaultTitle: 'FAQ',
    icon: ICONS.helpCircle,
    ...COLORS.orange,
  },
  'further-reading': {
    defaultTitle: 'Further Reading',
    icon: ICONS.bookOpen,
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
    icon: ICONS.trash2,
    ...COLORS.orange,
  },
  obsolete: {
    defaultTitle: 'Obsolete',
    icon: ICONS.trash2,
    ...COLORS.orange,
  },
  legacy: {
    defaultTitle: 'Legacy',
    icon: ICONS.trash2,
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
    icon: ICONS.balance,
    ...COLORS.orange,
  },
  compromise: {
    defaultTitle: 'Compromise',
    icon: ICONS.balance,
    ...COLORS.orange,
  },
  rationale: {
    defaultTitle: 'Rationale',
    icon: ICONS.balance,
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
    icon: ICONS.zap,
    ...COLORS.red,
  },
  failure: {
    defaultTitle: 'Failure',
    icon: ICONS.zap,
    ...COLORS.red,
  },
  fail: {
    defaultTitle: 'Fail',
    icon: ICONS.zap,
    ...COLORS.red,
  },
  missing: {
    defaultTitle: 'Missing',
    icon: ICONS.zap,
    ...COLORS.red,
  },
  bug: {
    defaultTitle: 'Bug',
    icon: ICONS.bug,
    ...COLORS.red,
  },
  announcement: {
    defaultTitle: 'Announcement',
    icon: ICONS.megaphone,
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
    icon: ICONS.playCircle,
    ...COLORS.red,
  },
  audio: {
    defaultTitle: 'Audio',
    icon: ICONS.playCircle,
    ...COLORS.red,
  },
  podcast: {
    defaultTitle: 'Podcast',
    icon: ICONS.playCircle,
    ...COLORS.red,
  },
  demo: {
    defaultTitle: 'Demo',
    icon: ICONS.playCircle,
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
    icon: ICONS.xCircle,
    ...COLORS.red,
  },
  avoid: {
    defaultTitle: 'Avoid',
    icon: ICONS.xCircle,
    ...COLORS.red,
  },
  'bad-practice': {
    defaultTitle: 'Bad Practice',
    icon: ICONS.xCircle,
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
    icon: ICONS.octagonX,
    ...COLORS.red,
  },
  stuck: {
    defaultTitle: 'Stuck',
    icon: ICONS.octagonX,
    ...COLORS.red,
  },
  dependency: {
    defaultTitle: 'Dependency',
    icon: ICONS.octagonX,
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
    icon: ICONS.lock,
    ...COLORS.cyan,
  },
  vulnerability: {
    defaultTitle: 'Vulnerability',
    icon: ICONS.lock,
    ...COLORS.cyan,
  },
  auth: {
    defaultTitle: 'Auth',
    icon: ICONS.lock,
    ...COLORS.cyan,
  },
  accessibility: {
    defaultTitle: 'Accessibility',
    icon: ICONS.eye,
    ...COLORS.cyan,
  },
  a11y: {
    defaultTitle: 'A11y',
    icon: ICONS.eye,
    ...COLORS.cyan,
  },
  inclusion: {
    defaultTitle: 'Inclusion',
    icon: ICONS.eye,
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
    icon: ICONS.star,
    ...COLORS.teal,
  },
  'pro-tip': {
    defaultTitle: 'Pro Tip',
    icon: ICONS.star,
    ...COLORS.teal,
  },
  milestone: {
    defaultTitle: 'Milestone',
    icon: ICONS.flag,
    ...COLORS.teal,
  },
  roadmap: {
    defaultTitle: 'Roadmap',
    icon: ICONS.flag,
    ...COLORS.teal,
  },
  epic: {
    defaultTitle: 'Epic',
    icon: ICONS.flag,
    ...COLORS.teal,
  },
  'sprint-goal': {
    defaultTitle: 'Sprint Goal',
    icon: ICONS.flag,
    ...COLORS.teal,
  },
  deadline: {
    defaultTitle: 'Deadline',
    icon: ICONS.flag,
    ...COLORS.teal,
  },
  scalability: {
    defaultTitle: 'Scalability',
    icon: ICONS.maximize,
    ...COLORS.teal,
  },
  capacity: {
    defaultTitle: 'Capacity',
    icon: ICONS.maximize,
    ...COLORS.teal,
  },
  limits: {
    defaultTitle: 'Limits',
    icon: ICONS.maximize,
    ...COLORS.teal,
  },
  quotas: {
    defaultTitle: 'Quotas',
    icon: ICONS.maximize,
    ...COLORS.teal,
  },
  load: {
    defaultTitle: 'Load',
    icon: ICONS.maximize,
    ...COLORS.teal,
  },
  'rate-limit': {
    defaultTitle: 'Rate Limit',
    icon: ICONS.maximize,
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
    icon: ICONS.sparkles,
    ...COLORS.pink,
  },
  'easter-egg': {
    defaultTitle: 'Easter Egg',
    icon: ICONS.sparkles,
    ...COLORS.pink,
  },
  'ux-insight': {
    defaultTitle: 'UX Insight',
    icon: ICONS.userSearch,
    ...COLORS.pink,
  },
  persona: {
    defaultTitle: 'Persona',
    icon: ICONS.userSearch,
    ...COLORS.pink,
  },
  'user-story': {
    defaultTitle: 'User Story',
    icon: ICONS.userSearch,
    ...COLORS.pink,
  },
  feedback: {
    defaultTitle: 'Feedback',
    icon: ICONS.userSearch,
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
    icon: ICONS.microscope,
    ...COLORS.indigo,
  },
  technical: {
    defaultTitle: 'Technical',
    icon: ICONS.microscope,
    ...COLORS.indigo,
  },
  details: {
    defaultTitle: 'Details',
    icon: ICONS.microscope,
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
    icon: ICONS.keyboard,
    ...COLORS.gray,
  },
  keybind: {
    defaultTitle: 'Keybind',
    icon: ICONS.keyboard,
    ...COLORS.gray,
  },
  environment: {
    defaultTitle: 'Environment',
    icon: ICONS.settings,
    ...COLORS.gray,
  },
  env: {
    defaultTitle: 'Env',
    icon: ICONS.settings,
    ...COLORS.gray,
  },
  config: {
    defaultTitle: 'Config',
    icon: ICONS.settings,
    ...COLORS.gray,
  },
  setup: {
    defaultTitle: 'Setup',
    icon: ICONS.settings,
    ...COLORS.gray,
  },
  infrastructure: {
    defaultTitle: 'Infrastructure',
    icon: ICONS.settings,
    ...COLORS.gray,
  },
  hardware: {
    defaultTitle: 'Hardware',
    icon: ICONS.cpu,
    ...COLORS.gray,
  },
  iot: {
    defaultTitle: 'IoT',
    icon: ICONS.cpu,
    ...COLORS.gray,
  },
  pinout: {
    defaultTitle: 'Pinout',
    icon: ICONS.cpu,
    ...COLORS.gray,
  },
  schematic: {
    defaultTitle: 'Schematic',
    icon: ICONS.cpu,
    ...COLORS.gray,
  },
  specs: {
    defaultTitle: 'Specs',
    icon: ICONS.cpu,
    ...COLORS.gray,
  },
  'ci-cd': {
    defaultTitle: 'CI/CD',
    icon: ICONS.gitBranch,
    ...COLORS.gray,
  },
  pipeline: {
    defaultTitle: 'Pipeline',
    icon: ICONS.gitBranch,
    ...COLORS.gray,
  },
  build: {
    defaultTitle: 'Build',
    icon: ICONS.gitBranch,
    ...COLORS.gray,
  },
  deploy: {
    defaultTitle: 'Deploy',
    icon: ICONS.gitBranch,
    ...COLORS.gray,
  },
  'github-actions': {
    defaultTitle: 'GitHub Actions',
    icon: ICONS.gitBranch,
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
    icon: ICONS.copyright,
    ...COLORS.silver,
  },
  copyright: {
    defaultTitle: 'Copyright',
    icon: ICONS.copyright,
    ...COLORS.silver,
  },
  eula: {
    defaultTitle: 'EULA',
    icon: ICONS.copyright,
    ...COLORS.silver,
  },
};

/** All built-in type keys, for quick lookup. */
export const BUILT_IN_KEYS = Object.keys(BUILT_IN_CALLOUTS);