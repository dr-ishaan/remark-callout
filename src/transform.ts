import type { Blockquote, Paragraph, Root } from 'mdast';
import type { ElementContent } from 'hast';
import type {
  CalloutNode,
  CalloutOptions,
  CalloutTypeConfig,
  Foldable,
  ParsedCallout,
  ParsedAccordion,
  ResolvedConfig,
} from './types.js';
import { BUILT_IN_CALLOUTS } from './defaults.js';
import { fromHtml } from 'hast-util-from-html';

// ─── Callout Marker Parser ──────────────────────────────────────────────────

/**
 * Regex to match a callout marker at the start of a text node.
 *
 * Examples it matches:
 *   [!NOTE]
 *   [!NOTE]+
 *   [!WARNING]-
 *   [!TIP] Custom title here
 *   [!DANGER]- Watch out
 *   [!BEST-PRACTICE]+ Expandable
 *   [!NOTE]{#my-id}                  ← custom anchor ID
 *   [!NOTE]{#my-id}+ Custom title    ← ID + foldable + title
 *
 * Captures:
 *   1 → type key  (e.g., "NOTE", "WARNING", "BEST-PRACTICE") — letters,
 *       digits, and hyphens only. First char must be a letter. Underscores
 *       and leading digits are NOT allowed (issue #4) — use hyphens instead.
 *   2 → foldable  ("+" or "-" or undefined) — comes AFTER the closing bracket
 *       (and after the optional {#id})
 *   3 → id        (anchor ID from {#id} syntax, or undefined)
 *   4 → title     (everything after optional foldable char, trimmed)
 *
 * Note: `[^\S\n]*` is used instead of `\s*` so that newlines are NOT
 * consumed. If remark-parse merges blockquote lines into a single text
 * node like `[!NOTE]\nBody here`, the `\n` must remain so the body
 * text after it can be extracted by `transformBlockquote` rather than
 * being captured as the title.
 *
 * The optional `{#id}` block may appear after `]`, optionally separated by
 * whitespace (issue #7 fix — `[!NOTE] {#id}` now works as documented in the
 * README). The ID must start with a letter and contain only letters, digits,
 * hyphens, and underscores (valid HTML id characters).
 */
// Issue #4 + #7 fixes: allow optional whitespace inside the brackets
// (`[! NOTE ]`) AND between `]` and `{#id}` (`[!NOTE] {#id}`).
// `[^\S\n]*` matches whitespace except newlines (so we don't eat body content
// when remark-parse merges blockquote lines into a single text node).
const CALLOUT_RE = /^\[!\s*([A-Za-z][A-Za-z0-9-]*)\s*\][^\S\n]*(?:\{#([A-Za-z][\w-]*)\})?[^\S\n]*([\+\-])?[^\S\n]*(.*)/;

/**
 * Parse a text value for a callout marker.
 * Returns null if the text does not start with a callout marker.
 */
export function parseCalloutMarker(
  text: string,
  enableFoldable: boolean
): ParsedCallout | null {
  const match = text.match(CALLOUT_RE);
  if (!match) return null;

  const [, rawType, id, foldChar, title] = match;
  const type = rawType.toLowerCase();

  let foldable: Foldable = false;
  if (enableFoldable) {
    if (foldChar === '+') foldable = 'open';
    else if (foldChar === '-') foldable = 'closed';
  }

  return {
    type,
    title: (title ?? '').trim(),
    titleNodes: [],  // populated by transformBlockquote from MDAST inline children
    foldable,
    markerLength: match[0].length,
    id: id || undefined,
  };
}

// ─── Accordion Marker Parser ───────────────────────────────────────────────

/**
 * Regex to match the BARE accordion marker `[!!]` at the start of a text node.
 *
 * Accordions use a bare `[!!]` marker (no TYPE inside the brackets, unlike
 * callouts which use `[!TYPE]`). An optional `{#id}` block (anchor ID) and
 * an optional `+` / `-` after the closing bracket control open/closed state
 * (default: closed).
 *
 * Captures:
 *   1 → id        (anchor ID from {#id} syntax, or undefined)
 *   2 → foldChar  ("+" or "-" or undefined)
 *   3 → rest      (everything after — may contain `[! icon !]` + title)
 */
// Issue #7 fix: allow optional whitespace between `]` and `{#id}`.
const ACCORDION_RE = /^\[!!\][^\S\n]*(?:\{#([A-Za-z][\w-]*)\})?[^\S\n]*([\+\-])?[^\S\n]*(.*)/;

/**
 * Regex to match an accordion-WITH-ICON marker `[! icon !]`, OR extract an
 * optional `[! icon !]` sub-token from the "rest" string captured by
 * ACCORDION_RE.
 *
 * This regex serves DUAL purposes:
 *   1. As a standalone accordion marker: `[! icon !] Title` (shorthand for
 *      `[!!] [! icon !] Title`).
 *   2. As a sub-token regex after `[!!]`: `[!!] [! icon !] Title` (legacy
 *      long form, still supported for backward compatibility).
 *
 * Captures:
 *   1 → iconRaw    (raw icon content between `[!` and `!]`)
 *   2 → id         (anchor ID from {#id} syntax, or undefined)
 *   3 → foldChar   ("+" or "-" or undefined)
 *   4 → title      (everything after optional foldable char)
 *
 * Disambiguation from callouts: `[!TYPE]` (callout) requires `]` immediately
 * after the type, with NO `!` before the `]`. This regex requires `!]` (with
 * a `!` immediately before `]`). The two patterns are mutually exclusive.
 */
// Issue #7 fix: allow optional whitespace between `]` and `{#id}`.
const ACCORDION_ICON_RE = /^\[!\s*([\s\S]+?)\s*!\][^\S\n]*(?:\{#([A-Za-z][\w-]*)\})?[^\S\n]*([\+\-])?[^\S\n]*(.*)/;

/**
 * Parse a text value for an accordion marker.
 *
 * Accepts TWO syntactic forms:
 *   1. `[!!]`            — bare accordion (no icon). May be followed by an
 *                          optional `[! icon !]` sub-token + title.
 *   2. `[! icon !]`      — accordion WITH icon (shorthand). The icon appears
 *                          between the two `!`s. May be followed by an
 *                          optional `+`/`-` foldable char + title.
 *
 * Both forms support an optional `{#id}` block for anchor IDs:
 *   [!!]{#my-id} Title
 *   [! 💻 !]{#laptop} Title
 *
 * Returns null if the text matches neither form. Callouts (`[!TYPE]`) do NOT
 * match either form.
 */
export function parseAccordionMarker(
  text: string,
  enableFoldable: boolean
): ParsedAccordion | null {
  // Default foldable state for accordions is 'closed'.
  // `+` forces open, `-` forces closed (same as default).
  const resolveFoldable = (foldChar: string | undefined): 'open' | 'closed' =>
    enableFoldable && foldChar === '+' ? 'open' : 'closed';

  // Form 1: bare `[!!]` marker, optionally followed by `[! icon !]` + title.
  const bareMatch = text.match(ACCORDION_RE);
  if (bareMatch) {
    const [, id, foldChar, rest] = bareMatch;

    let icon = '';
    let title = rest.trim();
    const iconMatch = rest.match(ACCORDION_ICON_RE);
    if (iconMatch) {
      icon = iconMatch[1].trim();
      title = (iconMatch[4] ?? '').trim();
    }

    return {
      icon,
      title,
      foldable: resolveFoldable(foldChar),
      markerLength: bareMatch[0].length,
      id: id || undefined,
    };
  }

  // Form 2: shorthand `[! icon !]` marker (no `[!!]` prefix).
  const iconMatch = text.match(ACCORDION_ICON_RE);
  if (iconMatch) {
    const [, iconRaw, id, foldChar, title] = iconMatch;
    return {
      icon: iconRaw.trim(),
      title: (title ?? '').trim(),
      foldable: resolveFoldable(foldChar),
      markerLength: iconMatch[0].length,
      id: id || undefined,
    };
  }

  return null;
}

// ─── Config Resolution ──────────────────────────────────────────────────────

/**
 * Default color/icon used when a user supplies an `icons`/`titles` override
 * for a type that has no entry yet (e.g., `disableBuiltins: true`). Kept
 * constant so the behavior is predictable and inspectable.
 */
const STUB_DEFAULTS = {
  icon: BUILT_IN_CALLOUTS.note.icon,
  colorL: 0.55,
  colorC: 0.18,
  colorH: 250,
} as const;

/**
 * Merge user options with built-in defaults to produce a resolved config.
 *
 * All type keys (`callouts`, `icons`, `titles`) are normalized to lowercase
 * so that `[!MYTYPE]` in markdown matches `callouts: { myType: {...} }`.
 */
export function resolveConfig(options: CalloutOptions = {}): ResolvedConfig {
  const {
    showTitle = true,
    showIcon = true,
    enableFoldable = true,
    tag = 'div',
    disableBuiltins = false,
    callouts = {},
    icons = {},
    titles = {},
    types: typeWhitelist,
  } = options;

  // Start with built-in types (or empty if disabled). Lowercase keys.
  const types: Record<string, CalloutTypeConfig> = disableBuiltins
    ? {}
    : Object.fromEntries(
        Object.entries(BUILT_IN_CALLOUTS).map(([k, v]) => [k.toLowerCase(), v])
      );

  // Apply user-defined callout types (keys normalized to lowercase).
  for (const [rawKey, partial] of Object.entries(callouts)) {
    const key = rawKey.toLowerCase();
    const existing = types[key];
    const p = partial as Partial<CalloutTypeConfig> & { defaultTitle?: string };
    types[key] = {
      defaultTitle: p.defaultTitle ?? existing?.defaultTitle ?? capitalize(key),
      icon: p.icon ?? existing?.icon ?? STUB_DEFAULTS.icon,
      colorL: p.colorL ?? existing?.colorL ?? STUB_DEFAULTS.colorL,
      colorC: p.colorC ?? existing?.colorC ?? STUB_DEFAULTS.colorC,
      colorH: p.colorH ?? existing?.colorH ?? STUB_DEFAULTS.colorH,
    };
  }

  // Apply icon overrides — auto-create a stub type entry if missing so the
  // override is not silently dropped (e.g., when `disableBuiltins: true`).
  for (const [rawKey, icon] of Object.entries(icons)) {
    const key = rawKey.toLowerCase();
    if (!types[key]) {
      types[key] = {
        defaultTitle: capitalize(key),
        icon,
        colorL: STUB_DEFAULTS.colorL,
        colorC: STUB_DEFAULTS.colorC,
        colorH: STUB_DEFAULTS.colorH,
      };
    } else {
      types[key] = { ...types[key], icon };
    }
  }

  // Apply title overrides — same auto-create behavior.
  for (const [rawKey, title] of Object.entries(titles)) {
    const key = rawKey.toLowerCase();
    if (!types[key]) {
      types[key] = {
        defaultTitle: title,
        icon: STUB_DEFAULTS.icon,
        colorL: STUB_DEFAULTS.colorL,
        colorC: STUB_DEFAULTS.colorC,
        colorH: STUB_DEFAULTS.colorH,
      };
    } else {
      types[key] = { ...types[key], defaultTitle: title };
    }
  }

  // Build the allowedTypes whitelist (lowercase). When set (even if empty),
  // only types in this list render as callouts; others fall through to plain
  // blockquotes. An empty array means NO callout types are allowed (only
  // literary types and accordions render). Literary types and accordions are
  // always allowed regardless.
  const LITERARY_TYPES = new Set(['epigraph', 'pullquote', 'pull', 'aside', 'sidebar']);
  const allowedTypes = Array.isArray(typeWhitelist)
    ? new Set(typeWhitelist.map(t => t.toLowerCase()))
    : null;

  return {
    types,
    showTitle,
    showIcon,
    enableFoldable,
    tag,
    allowedTypes,
    onUnknownCallout: options.onUnknownCallout,
    icon: options.icon,
    title: options.title,
    root: options.root,
    useNativeHast: options.useNativeHast ?? false,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Find the closest matching callout type name using Levenshtein distance.
 * Used by dev-mode warnings to suggest "Did you mean ...?" when an unknown
 * type is encountered. Returns the closest match if its edit distance is ≤ 3,
 * otherwise returns null.
 */
function findClosestType(input: string, candidates: string[]): string | null {
  if (candidates.length === 0) return null;
  let bestMatch: string | null = null;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const dist = levenshtein(input, candidate);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestMatch = candidate;
    }
  }
  // Only suggest if the edit distance is reasonable (≤ 3) or the input is
  // a prefix/substring of the candidate.
  // Issue #2 fix: threshold was ≤ 3, which missed common typos like
  // "notexist" → "note" (distance 4). Broadened to ≤ 4.
  if (bestDistance <= 4) return bestMatch;
  if (bestMatch && (bestMatch.startsWith(input) || bestMatch.includes(input))) {
    return bestMatch;
  }
  return null;
}

/**
 * Compute the Levenshtein edit distance between two strings.
 * Used by findClosestType for "Did you mean ...?" suggestions.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,        // deletion
        dp[i][j - 1] + 1,        // insertion
        dp[i - 1][j - 1] + cost  // substitution
      );
    }
  }
  return dp[m][n];
}

/**
 * Capitalize a type key for use as a fallback title.
 * Hyphenated keys are converted to space-separated words: 'my-type' → 'My Type'.
 */
function capitalize(str: string): string {
  return str
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a blockquote starts with a callout marker.
 */
function isCalloutBlockquote(
  node: Blockquote,
  enableFoldable: boolean
): ParsedCallout | null {
  const first = node.children[0];
  if (!first || first.type !== 'paragraph') return null;

  const firstChild = first.children[0];
  if (!firstChild || firstChild.type !== 'text') return null;

  return parseCalloutMarker(firstChild.value, enableFoldable);
}

// ─── Accordion Helpers ─────────────────────────────────────────────────────

/**
 * Try to parse a paragraph as an accordion marker.
 *
 * Concatenates leading text+html children of the paragraph to handle inline
 * SVG icons that remark-parse splits into multiple `html` MDAST nodes.
 */
function tryParseAccordionParagraph(
  paragraph: Paragraph,
  enableFoldable: boolean
): ParsedAccordion | null {
  const firstChild = paragraph.children[0];
  if (!firstChild || firstChild.type !== 'text') return null;

  // Quick check: text must start with `[!` for any accordion/callout marker.
  if (!firstChild.value.startsWith('[!')) return null;

  const fullText = extractLeadingInlineText(paragraph);
  return parseAccordionMarker(fullText, enableFoldable);
}

/**
 * Concatenate the `value` of all leading `text` and `html` children of a
 * paragraph, stopping at the first non-text/non-html child.
 *
 * This reconstructs the full marker string when remark-parse splits inline
 * HTML (like `<svg>`) into separate `html` MDAST nodes.
 */
function extractLeadingInlineText(paragraph: Paragraph): string {
  let result = '';
  for (const child of paragraph.children) {
    if (child.type === 'text' || child.type === 'html') {
      result += child.value;
    } else {
      break;
    }
  }
  return result;
}

/**
 * Extract the body inline content from a paragraph after stripping `markerLength`
 * characters from the start.
 *
 * The marker may span multiple MDAST nodes (text + html) when the icon is an
 * inline SVG. We walk the children, accumulating their text length, and:
 *   - Skip nodes entirely within the marker
 *   - Slice the node that straddles the marker/body boundary
 *   - Keep all subsequent nodes unchanged
 */
function extractBodyInline(paragraph: Paragraph, markerLength: number): any[] {
  const result: any[] = [];
  let consumed = 0;

  for (const child of paragraph.children) {
    const childLen =
      child.type === 'text' || child.type === 'html'
        ? (child as any).value.length
        : 0;

    if (consumed >= markerLength) {
      result.push(child);
      continue;
    }

    if (consumed + childLen <= markerLength) {
      consumed += childLen;
      continue;
    }

    // This node straddles the marker/body boundary — slice it.
    const sliceOffset = markerLength - consumed;
    const childValue: string = (child as any).value;
    const remaining = childValue.slice(sliceOffset).trimStart();
    if (remaining.length > 0) {
      result.push({ ...child, value: remaining });
    }
    consumed = markerLength;
  }

  return result;
}

// ─── Title/Body Splitter (shared by transformBlockquote + transformLiterary) ─

/**
 * Walk a paragraph's inline children and split them at the FIRST newline:
 * everything before → title nodes, everything after → body inline nodes.
 *
 * Issue #6 (GitHub #18) fix: the original inline-duplicated code in
 * `transformBlockquote` and `transformLiterary` had a data-loss bug — when a
 * text node contained a newline AND `foundNewline` was already true (from a
 * previous text node), the `before` portion was silently dropped. This
 * happened whenever the marker line had multiple text nodes with newlines
 * (e.g., `[!bio] Title\n**Born:** value\n**Died:** value`), causing field
 * values to vanish.
 *
 * This helper also preserves newlines in body text nodes (rather than
 * stripping them) so downstream consumers like `parseStructuredBody` can
 * split on `\n` to recover line structure.
 *
 * @param paragraph     The first paragraph of the blockquote (marker line).
 * @param markerLength  Length of the marker (incl. captured title text) to
 *                      slice off the first text child.
 * @param initialTitle  Plain-text title captured by the regex (prepended to
 *                      titleNodes if non-empty).
 */
function splitTitleAndBody(
  paragraph: Paragraph,
  markerLength: number,
  initialTitle: string
): { titleNodes: any[]; bodyInline: any[] } {
  const titleNodes: any[] = [];
  const bodyInline: any[] = [];

  if (initialTitle.length > 0) {
    titleNodes.push({ type: 'text', value: initialTitle });
  }

  let firstTextSkipped = false;
  let foundNewline = false;

  for (const child of paragraph.children as any[]) {
    if (child.type === 'text') {
      let text: string;
      if (!firstTextSkipped) {
        text = child.value.slice(markerLength);
        firstTextSkipped = true;
      } else {
        text = child.value;
      }

      if (!foundNewline) {
        // Still looking for the title/body boundary (the first `\n`).
        const nlIdx = text.indexOf('\n');
        if (nlIdx === -1) {
          // No newline — entire text node is part of the title.
          // Skip whitespace-only (parsed.title/initialTitle already has the
          // meaningful text from the regex capture).
          const trimmed = text.trim();
          if (trimmed.length > 0) {
            titleNodes.push({ ...child, value: trimmed });
          }
        } else {
          // Newline found — split: before → title, after → body.
          // PRESERVE the `after` portion verbatim (including any further
          // newlines) so structured-data parsers can split on `\n` later.
          const before = text.slice(0, nlIdx);
          const after = text.slice(nlIdx + 1);
          const beforeTrimmed = before.trim();
          if (beforeTrimmed.length > 0) {
            titleNodes.push({ ...child, value: beforeTrimmed });
          }
          foundNewline = true;
          if (after.length > 0) {
            bodyInline.push({ ...child, value: after });
          }
        }
      } else {
        // Already in body territory — preserve the entire text node,
        // including any internal newlines, for downstream line-splitting.
        if (text.length > 0) {
          bodyInline.push({ ...child, value: text });
        }
      }
    } else {
      // Non-text child (strong, em, link, code, ...)
      if (!foundNewline) {
        titleNodes.push(child);
      } else {
        bodyInline.push(child);
      }
    }
  }

  return { titleNodes, bodyInline };
}

// ─── Literary Transformer (Epigraph, Pullquote, Aside, Sidebar) ─────────────

/**
 * Literary type variants — render as non-callout-box HTML elements.
 *   - epigraph, pullquote → <figure><blockquote/><figcaption/></figure>
 *   - aside, sidebar      → <aside>[(<p class="{variant}-title"/>)? body...]</aside>
 */
type LiteraryVariant = 'epigraph' | 'pullquote' | 'aside' | 'sidebar';

/**
 * Check if a parsed callout type is a literary variant.
 */
function isLiteraryType(type: string): type is LiteraryVariant {
  return (
    type === 'epigraph' ||
    type === 'pullquote' ||
    type === 'pull' ||
    type === 'aside' ||
    type === 'sidebar'
  );
}

/**
 * Normalize literary type aliases:
 *   [!PULL] → 'pullquote'
 *   [!SIDEBAR] stays 'sidebar' (own variant, not alias of 'aside')
 */
function normalizeLiteraryVariant(type: string): LiteraryVariant {
  if (type === 'epigraph') return 'epigraph';
  if (type === 'aside') return 'aside';
  if (type === 'sidebar') return 'sidebar';
  return 'pullquote'; // covers 'pullquote' AND 'pull' alias
}

/**
 * Transform a blockquote marked with a literary callout type into a callout
 * node that will be rendered as a non-callout-box HTML element (<figure> or
 * <aside>).
 *
 * The custom title from the marker line becomes the attribution for
 * epigraph/pullquote, or the heading for aside/sidebar.
 */
function transformLiterary(
  blockquote: Blockquote,
  parsed: ParsedCallout,
  variant: LiteraryVariant
): CalloutNode {
  // Collect body children (same extraction logic as regular callouts)
  const bodyChildren = blockquote.children.slice(1);
  let titleNodes: any[] = [];
  const firstParagraph = blockquote.children[0];
  if (firstParagraph && firstParagraph.type === 'paragraph') {
    const split = splitTitleAndBody(
      firstParagraph,
      parsed.markerLength,
      parsed.title
    );
    titleNodes = split.titleNodes;
    if (split.bodyInline.length > 0) {
      bodyChildren.unshift({ type: 'paragraph', children: split.bodyInline } as any);
    }
  }

  // Claim #2 fix: literary types must preserve inline markdown in titles.
  // `parsed.title` is the plain-text portion captured by the regex (stops at
  // the first inline markdown node). `titleNodes` contains the FULL title
  // including inline-formatted children (strong, em, link, code). We pass
  // both: `calloutTitle` as the plain-text fallback, `calloutTitleNodes`
  // for rich rendering. If titleNodes is empty, the renderer falls back to
  // calloutTitle.
  const title = parsed.title || '';
  const hName = variant === 'aside' || variant === 'sidebar' ? 'aside' : 'figure';

  const node: CalloutNode = {
    type: 'callout',
    data: {
      calloutType: variant,
      calloutTitle: title,
      calloutTitleNodes: titleNodes.length > 0 ? titleNodes : undefined,
      calloutIcon: '',
      foldable: false,
      showTitle: true,
      showIcon: true,
      hName,
      hProperties: {},
      calloutId: parsed.id,
    },
    children: bodyChildren,
  };

  return node;
}

// ─── Accordion Transformer ─────────────────────────────────────────────────

/**
 * Transform a blockquote marked with `[!!]` into an accordion panel node.
 *
 * The accordion node is stored as a `callout` MDAST node with
 * `calloutType: 'accordion'` so the to-hast dispatch can route it to
 * `renderAccordion()`.
 */
function transformAccordion(
  blockquote: Blockquote,
  parsed: ParsedAccordion
): CalloutNode {
  const bodyChildren = blockquote.children.slice(1);

  // Extract any inline body content from the first paragraph (after the marker).
  const firstParagraph = blockquote.children[0];
  if (firstParagraph && firstParagraph.type === 'paragraph') {
    const remainingInline = extractBodyInline(firstParagraph, parsed.markerLength);
    if (remainingInline.length > 0) {
      bodyChildren.unshift({ type: 'paragraph', children: remainingInline } as any);
    }
  }

  const node: CalloutNode = {
    type: 'callout',
    data: {
      calloutType: 'accordion',
      calloutTitle: parsed.title,
      calloutIcon: parsed.icon,
      foldable: parsed.foldable,
      showTitle: true,
      showIcon: true,
      accordionGroupId: '',  // assigned during adjacency pass
      hName: 'details',
      hProperties: {},
      calloutId: parsed.id,
    },
    children: bodyChildren,
  };

  return node;
}

/**
 * Transform a blockquote containing one or more accordion markers into an
 * array of accordion panel nodes.
 *
 * A single blockquote may contain MULTIPLE accordion markers separated by
 * blank `>` lines. This function scans every paragraph in the blockquote,
 * finds each accordion marker, and splits the blockquote into one accordion
 * node per marker paragraph.
 *
 * Returns null if the blockquote contains NO accordion markers.
 */
function transformAccordionBlockquote(
  blockquote: Blockquote,
  enableFoldable: boolean,
  useNativeHast: boolean = false
): Blockquote[] | null {
  const children = blockquote.children;
  if (children.length === 0) return null;

  const markerIndices: { idx: number; parsed: ParsedAccordion }[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type !== 'paragraph') continue;
    const parsed = tryParseAccordionParagraph(child, enableFoldable);
    if (parsed) {
      markerIndices.push({ idx: i, parsed });
    }
  }

  if (markerIndices.length === 0) return null;

  const nodes: Blockquote[] = [];
  for (let s = 0; s < markerIndices.length; s++) {
    const { idx: startIdx, parsed } = markerIndices[s];
    const endIdx =
      s + 1 < markerIndices.length
        ? markerIndices[s + 1].idx
        : children.length;

    const sectionChildren = children.slice(startIdx, endIdx);
    const syntheticBlockquote: Blockquote = {
      type: 'blockquote',
      children: sectionChildren as any,
    };

    // v2.1.0: Native HAST mode for accordions
    if (useNativeHast) {
      nodes.push(transformAccordionNative(syntheticBlockquote, parsed));
    } else {
      nodes.push(transformAccordion(syntheticBlockquote, parsed) as any);
    }
  }

  return nodes;
}

// ─── Adjacency Grouping ────────────────────────────────────────────────────

/**
 * Post-transform pass: group adjacent accordion nodes by assigning each group
 * a unique `name` attribute for native `<details>` exclusive expansion.
 *
 * Two accordion nodes are "adjacent" if they are siblings in the same parent
 * AND there is no non-accordion node between them.
 */
function groupAdjacentAccordions(tree: Root): void {
  let groupCounter = 0;

  const stack: { children: any[] }[] = [tree as any];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const children = current.children;
    if (!Array.isArray(children)) continue;

    for (const child of children) {
      if (child && Array.isArray(child.children)) {
        stack.push(child);
      }
    }

    let runStart = -1;
    for (let i = 0; i <= children.length; i++) {
      const child = children[i];
      // Detect both handler-mode accordions (callout node with calloutType='accordion')
      // and native HAST accordions (blockquote with hName='details' and data-accordion-native)
      const isHandlerAccordion =
        child &&
        child.type === 'callout' &&
        child.data &&
        child.data.calloutType === 'accordion';
      const isNativeAccordion =
        child &&
        child.type === 'blockquote' &&
        child.data &&
        child.data.hName === 'details' &&
        child.data.hProperties &&
        child.data.hProperties['data-accordion-native'] === 'true';
      const isAccordion = isHandlerAccordion || isNativeAccordion;

      if (isAccordion) {
        if (runStart === -1) runStart = i;
      } else {
        if (runStart !== -1) {
          groupCounter++;
          const groupId = `accordion-group-${groupCounter}`;
          for (let j = runStart; j < i; j++) {
            // For handler accordions, set accordionGroupId on data
            if (children[j].data.calloutType === 'accordion') {
              children[j].data.accordionGroupId = groupId;
            }
            // For native accordions, set the name attribute on hProperties
            if (children[j].data.hName === 'details') {
              children[j].data.hProperties.name = groupId;
            }
          }
          runStart = -1;
        }
      }
    }
  }
}

// ─── MDAST Transform ────────────────────────────────────────────────────────

// ─── Native HAST Transformer (v1.3.0+: no handler required) ────────────────

/**
 * Parse an SVG string into HAST ElementContent[] using hast-util-from-html.
 * Used by the native HAST transformer to pre-parse icons so they can be
 * stored as `hChildren` on MDAST nodes.
 */
function svgToHastElements(svgString: string): ElementContent[] {
  try {
    const hastRoot = fromHtml(svgString, { fragment: true });
    return hastRoot.children.filter(
      (child: { type: string }): child is ElementContent =>
        child.type === 'element' || child.type === 'text'
    );
  } catch {
    return [];
  }
}

/**
 * Transform a blockquote into a callout using the NATIVE HAST approach:
 * sets `hName`/`hProperties`/`hChildren` on the blockquote and its children
 * so `remark-rehype` transforms them natively — NO custom HAST handler needed.
 *
 * The blockquote is kept as a blockquote (not replaced with a custom `callout`
 * node). Its children are restructured into:
 *   1. A header paragraph (hName='div' or 'summary') containing icon + title
 *   2. A body blockquote (hName='div') containing the callout body content
 *
 * For foldable callouts, the root uses hName='details' and the header uses
 * hName='summary'.
 *
 * @since v1.3.0
 */
function transformBlockquoteNative(
  blockquote: Blockquote,
  parsed: ParsedCallout,
  config: ResolvedConfig
): Blockquote {
  const typeConfig = config.types[parsed.type];
  const calloutCtx = { type: parsed.type, title: parsed.title, foldable: parsed.foldable };
  const icon = config.icon
    ? config.icon(calloutCtx)
    : typeConfig?.icon ?? STUB_DEFAULTS.icon;
  const fallbackTitle = config.title
    ? config.title(calloutCtx)
    : typeConfig?.defaultTitle ?? capitalize(parsed.type);
  const rootTag = parsed.foldable !== false
    ? 'details'
    : config.root
      ? config.root(calloutCtx)
      : config.tag;

  const colorL = typeConfig?.colorL ?? STUB_DEFAULTS.colorL;
  const colorC = typeConfig?.colorC ?? STUB_DEFAULTS.colorC;
  const colorH = typeConfig?.colorH ?? STUB_DEFAULTS.colorH;

  const isFoldable = parsed.foldable !== false;
  const isClosed = parsed.foldable === 'closed';

  // ── Extract title/body using the shared splitter ────────────────────
  const bodyChildren = blockquote.children.slice(1);
  const titleNodes: any[] = [];
  const bodyInline: any[] = [];

  const firstParagraph = blockquote.children[0];
  if (firstParagraph && firstParagraph.type === 'paragraph') {
    const split = splitTitleAndBody(firstParagraph, parsed.markerLength, parsed.title);
    titleNodes.push(...split.titleNodes);
    bodyInline.push(...split.bodyInline);
  } else if (parsed.title.length > 0) {
    titleNodes.push({ type: 'text', value: parsed.title });
  }

  if (bodyInline.length > 0) {
    bodyChildren.unshift({ type: 'paragraph', children: bodyInline } as any);
  }

  const finalFallbackTitle = parsed.title || fallbackTitle;

  // ── Build header children (icon + title) ────────────────────────────
  const headerChildren: any[] = [];

  // Icon — a paragraph with hName='span', hProperties for class, hChildren for SVG
  if (config.showIcon !== false && icon) {
    const svgElements = svgToHastElements(icon);
    if (svgElements.length > 0) {
      headerChildren.push({
        type: 'paragraph',
        data: {
          hName: 'span',
          hProperties: {
            className: ['callout-icon'],
            'aria-hidden': 'true',
          },
          hChildren: svgElements,
        },
        children: [],
      });
    }
  }

  // Title — a paragraph with hName='span', inline children for rich title
  if (config.showTitle !== false) {
    let titleContent: any[];
    if (titleNodes.length > 0) {
      titleContent = titleNodes;
    } else {
      titleContent = [{ type: 'text', value: finalFallbackTitle }];
    }
    headerChildren.push({
      type: 'paragraph',
      data: {
        hName: 'span',
        hProperties: { className: ['callout-title'] },
      },
      children: titleContent,
    });
  }

  // ── Build header element (div or summary) ───────────────────────────
  const headerProperties: any = { className: ['callout-header'] };
  if (isFoldable) {
    headerProperties['aria-expanded'] = isClosed ? 'false' : 'true';
  }

  const headerNode: Blockquote = {
    type: 'blockquote',
    data: {
      hName: isFoldable ? 'summary' : 'div',
      hProperties: headerProperties,
    },
    children: headerChildren as any,
  };

  // ── Build body element (div) ────────────────────────────────────────
  const bodyNode: Blockquote = {
    type: 'blockquote',
    data: {
      hName: 'div',
      hProperties: { className: ['callout-body'] },
    },
    children: bodyChildren as any,
  };

  // ── Build root properties ───────────────────────────────────────────
  const rootClassName = [
    'callout',
    `callout-${parsed.type}`,
    ...(isFoldable ? ['callout-foldable'] : []),
    ...(bodyChildren.length === 0 ? ['callout-empty'] : []),
  ];
  const rootProperties: any = {
    className: rootClassName,
    'data-callout': parsed.type,
    style: `--callout-l: ${colorL}; --callout-c: ${colorC}; --callout-h: ${colorH};`,
  };
  if (isFoldable) {
    rootProperties['data-callout-fold'] = isClosed ? 'closed' : 'open';
  }
  if (parsed.id) {
    rootProperties.id = parsed.id;
  }
  // For foldable open, set the `open` attribute
  if (isFoldable && !isClosed) {
    rootProperties.open = true;
  }

  // ── Return the restructured blockquote ──────────────────────────────
  return {
    type: 'blockquote',
    data: {
      hName: rootTag,
      hProperties: rootProperties,
    },
    children: [headerNode, bodyNode],
  } as Blockquote;
}

/**
 * Native HAST transformer for literary types (epigraph, pullquote).
 *
 * Renders as <figure class="{variant}"> containing:
 *   <div class="{variant}-quote">{...children...}</div>
 *   [<figcaption class="{variant}-attribution">— Author</figcaption>]
 *
 * Em-dash attribution detection reuses the shared `extractEmDashAttribution`
 * logic (imported lazily via the to-hast module's approach — but since we
 * can't import from to-hast without circular deps, we inline a minimal
 * version here that operates on the callout's body children).
 *
 * @since v2.1.0
 */
function transformLiteraryNative(
  blockquote: Blockquote,
  parsed: ParsedCallout,
  variant: 'epigraph' | 'pullquote'
): Blockquote {
  let bodyMdast = blockquote.children.slice(1);
  const titleNodes: any[] = [];
  const bodyInline: any[] = [];

  const firstParagraph = blockquote.children[0];
  if (firstParagraph && firstParagraph.type === 'paragraph') {
    const split = splitTitleAndBody(firstParagraph, parsed.markerLength, parsed.title);
    titleNodes.push(...split.titleNodes);
    bodyInline.push(...split.bodyInline);
  }
  if (bodyInline.length > 0) {
    bodyMdast.unshift({ type: 'paragraph', children: bodyInline } as any);
  }

  // Em-dash attribution detection — scan ALL children of last paragraph
  let attributionText: string | undefined =
    parsed.title && parsed.title.length > 0 ? parsed.title : undefined;
  let attributionNodes: any[] | undefined =
    titleNodes.length > 0 ? titleNodes : undefined;

  {
    const result = extractEmDashAttributionInline(bodyMdast);
    bodyMdast = result.bodyMdast;
    if (result.attribution && !attributionText && !attributionNodes) {
      attributionText = result.attribution;
    }
  }

  // Build figure children: the quote div + optional figcaption
  const figureChildren: any[] = [];

  // Quote div (wraps body content) — use blockquote with hName='div'
  figureChildren.push({
    type: 'blockquote',
    data: {
      hName: 'div',
      hProperties: { className: [`${variant}-quote`] },
    },
    children: bodyMdast,
  });

  // Figcaption (if attribution)
  if (attributionNodes || attributionText) {
    let figcaptionChildren: any[];
    if (attributionNodes && attributionNodes.length > 0) {
      figcaptionChildren = [{ type: 'text', value: '— ' }, ...attributionNodes];
    } else {
      figcaptionChildren = [{ type: 'text', value: `— ${attributionText ?? ''}` }];
    }
    figureChildren.push({
      type: 'paragraph',
      data: {
        hName: 'figcaption',
        hProperties: { className: [`${variant}-attribution`] },
      },
      children: figcaptionChildren,
    });
  }

  const figureProperties: any = { className: [variant] };
  if (parsed.id) figureProperties.id = parsed.id;

  return {
    type: 'blockquote',
    data: {
      hName: 'figure',
      hProperties: figureProperties,
    },
    children: figureChildren,
  } as Blockquote;
}

/**
 * Native HAST transformer for aside/sidebar literary types.
 *
 * Renders as <aside class="{variant}"> containing:
 *   [<p class="{variant}-title">Title</p>]
 *   <div class="{variant}-body">{...children...}</div>
 *   [<p class="{variant}-attribution">— Author</p>]
 *
 * @since v2.1.0
 */
function transformAsideNative(
  blockquote: Blockquote,
  parsed: ParsedCallout,
  variant: 'aside' | 'sidebar'
): Blockquote {
  let bodyMdast = blockquote.children.slice(1);
  const titleNodes: any[] = [];
  const bodyInline: any[] = [];

  const firstParagraph = blockquote.children[0];
  if (firstParagraph && firstParagraph.type === 'paragraph') {
    const split = splitTitleAndBody(firstParagraph, parsed.markerLength, parsed.title);
    titleNodes.push(...split.titleNodes);
    bodyInline.push(...split.bodyInline);
  }
  if (bodyInline.length > 0) {
    bodyMdast.unshift({ type: 'paragraph', children: bodyInline } as any);
  }

  const headingText = parsed.title || undefined;
  const headingNodes = titleNodes.length > 0 ? titleNodes : undefined;

  // Em-dash attribution detection
  let attribution: string | undefined;
  {
    const result = extractEmDashAttributionInline(bodyMdast);
    bodyMdast = result.bodyMdast;
    attribution = result.attribution;
  }

  const asideChildren: any[] = [];

  // Heading paragraph (if title)
  if (headingNodes || headingText) {
    let headingChildren: any[];
    if (headingNodes && headingNodes.length > 0) {
      headingChildren = headingNodes;
    } else {
      headingChildren = [{ type: 'text', value: headingText ?? '' }];
    }
    asideChildren.push({
      type: 'paragraph',
      data: {
        hName: 'p',
        hProperties: { className: [`${variant}-title`] },
      },
      children: headingChildren,
    });
  }

  // Body div
  asideChildren.push({
    type: 'blockquote',
    data: {
      hName: 'div',
      hProperties: { className: [`${variant}-body`] },
    },
    children: bodyMdast,
  });

  // Attribution paragraph
  if (attribution) {
    asideChildren.push({
      type: 'paragraph',
      data: {
        hName: 'p',
        hProperties: { className: [`${variant}-attribution`] },
      },
      children: [{ type: 'text', value: `— ${attribution}` }],
    });
  }

  const asideProperties: any = { className: [variant] };
  if (parsed.id) asideProperties.id = parsed.id;

  return {
    type: 'blockquote',
    data: {
      hName: 'aside',
      hProperties: asideProperties,
    },
    children: asideChildren,
  } as Blockquote;
}

/**
 * Inline em-dash attribution extractor for the native HAST transformers.
 *
 * This is a minimal duplicate of `extractEmDashAttribution` from to-hast.ts,
 * kept inline to avoid a circular import. It scans ALL children of the last
 * paragraph in reverse, finds the last text node containing an em-dash line,
 * and strips it from the body.
 */
function extractEmDashAttributionInline(
  bodyMdast: any[]
): { attribution: string | undefined; bodyMdast: any[] } {
  if (bodyMdast.length === 0) return { attribution: undefined, bodyMdast };
  const last = bodyMdast[bodyMdast.length - 1];
  if (!last || last.type !== 'paragraph') return { attribution: undefined, bodyMdast };

  const lastPara = last as { type: 'paragraph'; children: any[] };
  const children = lastPara.children;

  for (let childIdx = children.length - 1; childIdx >= 0; childIdx--) {
    const child = children[childIdx];
    if (!child || child.type !== 'text') continue;

    const text = child.value.replace(/\r\n/g, '\n');
    const lines = text.split('\n');

    let attrLineIdx = -1;
    let attrText = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      const m = lines[i].match(/^\s*(?:--|—|–)\s*(.+)/);
      if (m) {
        attrLineIdx = i;
        attrText = m[1].trim();
        break;
      }
    }
    if (attrLineIdx < 0) continue;

    const beforeEmDash = lines.slice(0, attrLineIdx).join('\n').replace(/\s+$/, '');
    let newBodyMdast = [...bodyMdast];

    if (beforeEmDash.length > 0) {
      const newChildren = children.slice(0, childIdx);
      newChildren.push({ ...child, value: beforeEmDash });
      const newPara = { ...lastPara, children: newChildren };
      newBodyMdast[newBodyMdast.length - 1] = newPara;
    } else {
      const newChildren = children.slice(0, childIdx);
      if (newChildren.length > 0) {
        const newPara = { ...lastPara, children: newChildren };
        newBodyMdast[newBodyMdast.length - 1] = newPara;
      } else {
        newBodyMdast = newBodyMdast.slice(0, -1);
      }
    }
    return { attribution: attrText, bodyMdast: newBodyMdast };
  }
  return { attribution: undefined, bodyMdast };
}

/**
 * Native HAST transformer for accordion panels.
 *
 * Renders as <details class="accordion" name="accordion-group-N" [open]>:
 *   <summary class="accordion-header" aria-expanded="...">
 *     [<span class="accordion-icon">{icon}</span>]
 *     [<span class="accordion-title">{title}</span>]
 *     <span class="accordion-chevron" aria-hidden="true"></span>
 *   </summary>
 *   <div class="accordion-body">{...children...}</div>
 * </details>
 *
 * @since v2.1.0
 */
function transformAccordionNative(
  blockquote: Blockquote,
  parsed: ParsedAccordion
): Blockquote {
  const bodyChildren = blockquote.children.slice(1);

  // Extract any inline body content from the first paragraph (after the marker)
  const firstParagraph = blockquote.children[0];
  if (firstParagraph && firstParagraph.type === 'paragraph') {
    const remainingInline = extractBodyInline(firstParagraph, parsed.markerLength);
    if (remainingInline.length > 0) {
      bodyChildren.unshift({ type: 'paragraph', children: remainingInline } as any);
    }
  }

  const isOpen = parsed.foldable === 'open';

  // Build summary children
  const summaryChildren: any[] = [];

  // Optional icon
  if (parsed.icon) {
    let iconChildren: any[];
    if (parsed.icon.startsWith('<svg')) {
      iconChildren = svgToHastElements(parsed.icon);
    } else {
      iconChildren = [{ type: 'text', value: parsed.icon }];
    }
    if (iconChildren.length > 0) {
      summaryChildren.push({
        type: 'paragraph',
        data: {
          hName: 'span',
          hProperties: {
            className: ['accordion-icon'],
            'aria-hidden': 'true',
          },
          hChildren: iconChildren,
        },
        children: [],
      });
    }
  }

  // Optional title
  if (parsed.title) {
    summaryChildren.push({
      type: 'paragraph',
      data: {
        hName: 'span',
        hProperties: { className: ['accordion-title'] },
      },
      children: [{ type: 'text', value: parsed.title }],
    });
  }

  // Chevron (empty span)
  summaryChildren.push({
    type: 'paragraph',
    data: {
      hName: 'span',
      hProperties: {
        className: ['accordion-chevron'],
        'aria-hidden': 'true',
      },
      hChildren: [],
    },
    children: [],
  });

  // Summary element
  const summaryNode: Blockquote = {
    type: 'blockquote',
    data: {
      hName: 'summary',
      hProperties: {
        className: ['accordion-header'],
        'aria-expanded': isOpen ? 'true' : 'false',
      },
    },
    children: summaryChildren as any,
  };

  // Body element
  const bodyNode: Blockquote = {
    type: 'blockquote',
    data: {
      hName: 'div',
      hProperties: { className: ['accordion-body'] },
    },
    children: bodyChildren as any,
  };

  // Root <details> properties
  const rootProperties: any = { className: ['accordion'] };
  // groupId is assigned during the adjacency pass — we use a placeholder
  // data attribute that the adjacency pass will update. But since the
  // adjacency pass operates on `callout` nodes, we need to use a different
  // approach: store the group id on the node's data so the pass can find it.
  // For native HAST, we'll use a data attribute and a marker.
  // Actually, the adjacency pass sets `accordionGroupId` on callout nodes.
  // For native HAST, we don't have callout nodes — so we need to handle
  // adjacency differently. For now, we set a placeholder and rely on a
  // post-processing pass that scans for native accordion blockquotes.
  // Simplification: set name to '' and let a separate adjacency pass fix it.
  // We'll mark native accordions with a data attribute so they can be found.
  rootProperties['data-accordion-native'] = 'true';
  if (parsed.id) rootProperties.id = parsed.id;
  if (isOpen) rootProperties.open = true;

  return {
    type: 'blockquote',
    data: {
      hName: 'details',
      hProperties: rootProperties,
    },
    children: [summaryNode, bodyNode],
  } as Blockquote;
}

/**
 * Native HAST transformer for structured-data types (bio, event).
 *
 * Renders as a standard callout box with a <dl> for "Key: Value" fields:
 *   <div class="callout callout-{type}" ...>
 *     <div class="callout-header">
 *       <span class="callout-icon">{SVG}</span>
 *       <span class="callout-title">{title}</span>
 *     </div>
 *     <div class="callout-body">
 *       <dl class="callout-fields">
 *         <dt>{label}</dt><dd>{value}</dd>
 *         ...
 *       </dl>
 *     </div>
 *   </div>
 *
 * @since v2.1.0
 */
function transformStructuredNative(
  blockquote: Blockquote,
  parsed: ParsedCallout,
  config: ResolvedConfig
): Blockquote {
  const typeConfig = config.types[parsed.type];
  const calloutCtx = { type: parsed.type, title: parsed.title, foldable: parsed.foldable };
  const icon = config.icon
    ? config.icon(calloutCtx)
    : typeConfig?.icon ?? STUB_DEFAULTS.icon;
  const fallbackTitle = config.title
    ? config.title(calloutCtx)
    : typeConfig?.defaultTitle ?? capitalize(parsed.type);

  const colorL = typeConfig?.colorL ?? STUB_DEFAULTS.colorL;
  const colorC = typeConfig?.colorC ?? STUB_DEFAULTS.colorC;
  const colorH = typeConfig?.colorH ?? STUB_DEFAULTS.colorH;

  const bodyChildrenRaw = blockquote.children.slice(1);
  const titleNodes: any[] = [];
  const bodyInline: any[] = [];

  const firstParagraph = blockquote.children[0];
  if (firstParagraph && firstParagraph.type === 'paragraph') {
    const split = splitTitleAndBody(firstParagraph, parsed.markerLength, parsed.title);
    titleNodes.push(...split.titleNodes);
    bodyInline.push(...split.bodyInline);
  }
  if (bodyInline.length > 0) {
    bodyChildrenRaw.unshift({ type: 'paragraph', children: bodyInline } as any);
  }

  const finalFallbackTitle = parsed.title || fallbackTitle;

  // Build header children (icon + title)
  const headerChildren: any[] = [];

  if (config.showIcon !== false && icon) {
    const svgElements = svgToHastElements(icon);
    if (svgElements.length > 0) {
      headerChildren.push({
        type: 'paragraph',
        data: {
          hName: 'span',
          hProperties: { className: ['callout-icon'], 'aria-hidden': 'true' },
          hChildren: svgElements,
        },
        children: [],
      });
    }
  }

  if (config.showTitle !== false) {
    let titleContent: any[];
    if (titleNodes.length > 0) {
      titleContent = titleNodes;
    } else {
      titleContent = [{ type: 'text', value: finalFallbackTitle }];
    }
    headerChildren.push({
      type: 'paragraph',
      data: {
        hName: 'span',
        hProperties: { className: ['callout-title'] },
      },
      children: titleContent,
    });
  }

  const headerNode: Blockquote = {
    type: 'blockquote',
    data: {
      hName: 'div',
      hProperties: { className: ['callout-header'] },
    },
    children: headerChildren as any,
  };

  // Parse structured fields from body
  const { fields, extra } = parseStructuredBodyInline(bodyChildrenRaw);

  const bodyChildren: any[] = [];

  if (fields.length > 0) {
    const dlChildren: any[] = [];
    for (const field of fields) {
      // <dt> with label nodes
      dlChildren.push({
        type: 'paragraph',
        data: {
          hName: 'dt',
          hProperties: {},
        },
        children: field.dt,
      });
      // <dd> with value nodes
      dlChildren.push({
        type: 'paragraph',
        data: {
          hName: 'dd',
          hProperties: {},
        },
        children: field.dd,
      });
    }
    bodyChildren.push({
      type: 'blockquote',
      data: {
        hName: 'dl',
        hProperties: { className: ['callout-fields'] },
      },
      children: dlChildren,
    });
  }

  // Append non-field content
  for (const item of extra) {
    bodyChildren.push(item);
  }

  const bodyNode: Blockquote = {
    type: 'blockquote',
    data: {
      hName: 'div',
      hProperties: { className: ['callout-body'] },
    },
    children: bodyChildren as any,
  };

  const rootProperties: any = {
    className: ['callout', `callout-${parsed.type}`],
    'data-callout': parsed.type,
    style: `--callout-l: ${colorL}; --callout-c: ${colorC}; --callout-h: ${colorH};`,
  };
  if (parsed.id) rootProperties.id = parsed.id;

  return {
    type: 'blockquote',
    data: {
      hName: 'div',
      hProperties: rootProperties,
    },
    children: [headerNode, bodyNode],
  } as Blockquote;
}

/**
 * Inline structured-data body parser for the native HAST transformer.
 *
 * Duplicates the logic from to-hast.ts's `parseStructuredBody` +
 * `splitParagraphIntoLines` + `splitLineOnColon` to avoid a circular import.
 * Parses "Key: Value" lines into dt/dd node arrays, preserving inline
 * formatting (bold labels, links in values, etc.).
 */
function parseStructuredBodyInline(
  children: any[]
): { fields: { dt: any[]; dd: any[] }[]; extra: any[] } {
  const fields: { dt: any[]; dd: any[] }[] = [];
  const extra: any[] = [];

  for (const child of children) {
    if (child.type === 'paragraph' && child.children?.length > 0) {
      const lines = splitParagraphIntoLinesInline(child);
      const lineFields: { dt: any[]; dd: any[] }[] = [];
      let allLinesAreFields = true;

      for (const line of lines) {
        const split = splitLineOnColonInline(line);
        if (split) {
          lineFields.push({ dt: split.label, dd: split.value });
        } else {
          allLinesAreFields = false;
          break;
        }
      }

      if (allLinesAreFields && lineFields.length > 0) {
        fields.push(...lineFields);
      } else {
        extra.push(child);
      }
    } else {
      extra.push(child);
    }
  }

  return { fields, extra };
}

function splitParagraphIntoLinesInline(paragraph: any): any[][] {
  const lines: any[][] = [[]];
  for (const child of paragraph.children ?? []) {
    if (child.type === 'text') {
      const parts = child.value.split('\n');
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) lines.push([]);
        if (parts[i].length > 0) {
          lines[lines.length - 1].push({ ...child, value: parts[i] });
        }
      }
    } else {
      lines[lines.length - 1].push(child);
    }
  }
  while (lines.length > 0 && lines[lines.length - 1].length === 0) {
    lines.pop();
  }
  return lines;
}

function splitLineOnColonInline(lineNodes: any[]): { label: any[]; value: any[] } | null {
  let fullText = '';
  const segments: { node: any; start: number; end: number; isText: boolean }[] = [];
  for (const node of lineNodes) {
    const text = nodeToTextInline(node);
    segments.push({
      node,
      start: fullText.length,
      end: fullText.length + text.length,
      isText: node.type === 'text',
    });
    fullText += text;
  }

  const colonIdx = fullText.indexOf(':');
  if (colonIdx === -1) return null;

  const beforeColon = fullText.slice(0, colonIdx);
  const afterColon = fullText.slice(colonIdx + 1);
  if (!beforeColon.trim() || !afterColon.trim()) return null;

  const label: any[] = [];
  const value: any[] = [];

  for (const seg of segments) {
    if (seg.end <= colonIdx + 1) {
      label.push(seg.node);
    } else if (seg.start > colonIdx) {
      value.push(seg.node);
    } else if (seg.isText) {
      const offset = colonIdx - seg.start;
      const before = seg.node.value.slice(0, offset + 1);
      const after = seg.node.value.slice(offset + 1);
      if (before.trim().length > 0) label.push({ ...seg.node, value: before });
      if (after.replace(/^\s+/, '').length > 0) {
        value.push({ ...seg.node, value: after.replace(/^\s+/, '') });
      }
    } else {
      label.push(seg.node);
    }
  }

  // Trim trailing whitespace from last label text node
  for (let i = label.length - 1; i >= 0; i--) {
    if (label[i].type === 'text') {
      const trimmed = label[i].value.trimEnd();
      if (trimmed.length === 0) label.splice(i, 1);
      else label[i] = { ...label[i], value: trimmed };
      break;
    }
    break;
  }

  // Trim leading whitespace from first value text node
  for (let i = 0; i < value.length; i++) {
    if (value[i].type === 'text') {
      const trimmed = value[i].value.replace(/^\s+/, '');
      if (trimmed.length === 0) { value.splice(i, 1); i--; }
      else value[i] = { ...value[i], value: trimmed };
      break;
    }
    break;
  }

  return { label, value };
}

function nodeToTextInline(node: any): string {
  if (node.type === 'text') return node.value;
  if (node.children) return (node.children as any[]).map(nodeToTextInline).join('');
  return '';
}

/**
 * Transform a blockquote into a callout node.
 *
 * The first paragraph is consumed as the marker line. Any inline content
 * remaining on the marker line (after the marker text is stripped) — whether
 * text, bold, italic, link, code, etc. — is preserved as the first child of
 * the callout body. Remaining blockquote children (subsequent paragraphs,
 * lists, etc.) follow.
 */
export function transformBlockquote(
  blockquote: Blockquote,
  parsed: ParsedCallout,
  config: ResolvedConfig
): CalloutNode {
  // Special routing for literary types — render as <figure> or <aside>,
  // not as a callout box. No icon, no colored title, no border, no foldable.
  if (isLiteraryType(parsed.type)) {
    const variant = normalizeLiteraryVariant(parsed.type);
    // v2.1.0: Native HAST mode for literary types
    if (config.useNativeHast) {
      if (variant === 'epigraph' || variant === 'pullquote') {
        return transformLiteraryNative(blockquote, parsed, variant) as any;
      }
      return transformAsideNative(blockquote, parsed, variant as 'aside' | 'sidebar') as any;
    }
    return transformLiterary(blockquote, parsed, variant);
  }

  // v2.1.0: Native HAST mode for structured-data types (bio, event)
  if (config.useNativeHast && (parsed.type === 'bio' || parsed.type === 'event')) {
    return transformStructuredNative(blockquote, parsed, config) as any;
  }

  // v1.3.0: Native HAST mode for standard callouts (no handler required).
  // Literary types and structured-data types still use the handler path.
  if (config.useNativeHast) {
    return transformBlockquoteNative(blockquote, parsed, config) as any;
  }

  const typeConfig = config.types[parsed.type];
  // v1.3.0: callback-based config takes precedence over static maps.
  const calloutCtx = { type: parsed.type, title: parsed.title, foldable: parsed.foldable };
  const icon = config.icon
    ? config.icon(calloutCtx)
    : typeConfig?.icon ?? STUB_DEFAULTS.icon;
  const fallbackTitle = config.title
    ? config.title(calloutCtx)
    : typeConfig?.defaultTitle ?? capitalize(parsed.type);
  // v1.3.0: callback-based root tag (foldable always uses <details>)
  const rootTag = parsed.foldable !== false
    ? 'details'
    : config.root
      ? config.root(calloutCtx)
      : config.tag;

  // Build oklch color CSS variables as inline data for the handler
  const colorL = typeConfig?.colorL ?? STUB_DEFAULTS.colorL;
  const colorC = typeConfig?.colorC ?? STUB_DEFAULTS.colorC;
  const colorH = typeConfig?.colorH ?? STUB_DEFAULTS.colorH;

  // Collect the body children (everything after the first paragraph)
  const bodyChildren = blockquote.children.slice(1);

  // ── Extract inline content from the marker line ───────────────────────
  // The marker occupies `parsed.markerLength` characters at the start of the
  // first text node. Anything remaining on the SAME LINE as the marker
  // becomes the RICH TITLE (issue #3). Content on subsequent lines (after a
  // newline) is body content, NOT title.
  //
  // Issue #6 fix: use the shared `splitTitleAndBody` helper, which correctly
  // preserves text between multiple newlines (the old inline code dropped
  // segments when `foundNewline` was already true, causing data loss in
  // `[!bio]`/`[!event]` with inline-formatted labels).
  const firstParagraph = blockquote.children[0];
  const titleNodes: any[] = [];
  const bodyInline: any[] = [];

  if (firstParagraph && firstParagraph.type === 'paragraph') {
    const split = splitTitleAndBody(
      firstParagraph,
      parsed.markerLength,
      parsed.title
    );
    titleNodes.push(...split.titleNodes);
    bodyInline.push(...split.bodyInline);
  } else if (parsed.title.length > 0) {
    titleNodes.push({ type: 'text', value: parsed.title });
  }

  // If we found body content in the first paragraph (after a newline),
  // prepend it as an inline paragraph to the body children.
  if (bodyInline.length > 0) {
    bodyChildren.unshift({ type: 'paragraph', children: bodyInline } as any);
  }

  // Determine the plain-text fallback title (used when titleNodes is empty
  // OR when showTitle renders the text fallback).
  // v1.3.0: uses callback-based `fallbackTitle` (resolved above) which
  // respects the `title` callback > static `titles` map > built-in default.
  const finalFallbackTitle = parsed.title || fallbackTitle;

  const node: CalloutNode = {
    type: 'callout',
    data: {
      calloutType: parsed.type,
      calloutTitle: finalFallbackTitle,
      calloutTitleNodes: titleNodes.length > 0 ? titleNodes : undefined,
      calloutIcon: icon,
      foldable: parsed.foldable,
      showTitle: config.showTitle,
      showIcon: config.showIcon,
      hName: rootTag,
      hProperties: {
        style: `--callout-l: ${colorL}; --callout-c: ${colorC}; --callout-h: ${colorH};`,
      },
      calloutId: parsed.id,
    },
    children: bodyChildren,
  };

  return node;
}

/**
 * Main remark plugin transformer.
 *
 * Visits all blockquotes, detects callout/accordion markers, and replaces them
 * with custom `callout` MDAST nodes.
 *
 * Accordions (`[!!]` and `[! icon !]`) are checked FIRST so that they are
 * not mistaken for callouts. After the recursive descent completes, a final
 * adjacency pass groups consecutive accordion nodes for exclusive
 * `<details name="...">` behavior.
 */
export function remarkCalloutTransformer(
  tree: Root,
  config: ResolvedConfig
): void {
  const { enableFoldable, allowedTypes } = config;

  // Literary types are always allowed regardless of the `types` whitelist.
  const LITERARY_TYPES = new Set(['epigraph', 'pullquote', 'pull', 'aside', 'sidebar']);

  // Dev-mode warning helper — only fires when NODE_ENV !== 'production'.
  // Warns once per unknown type to avoid log spam.
  const warnedTypes = new Set<string>();
  const findSuggestion = (type: string): string | null => {
    const allTypes = Object.keys(config.types);
    return findClosestType(type, allTypes);
  };
  // Issue #2 fix: the original warning said "Falling back to plain blockquote"
  // but the code actually renders a styled callout with default colors/icon
  // (backward compat). The message now accurately describes what happens.
  // The "Did you mean ...?" suggestion also now uses a more lenient threshold
  // (Levenshtein distance ≤ 4 OR prefix/substring match) so common typos like
  // "notexist"→"note" still get a helpful hint.
  const warnUnknownType = (type: string, willRender: boolean) => {
    if (process.env.NODE_ENV === 'production') return;
    if (warnedTypes.has(type)) return;
    warnedTypes.add(type);
    const suggestion = findSuggestion(type);
    const hint = suggestion ? ` Did you mean "${suggestion}"?` : '';
    const action = willRender
      ? 'Rendering with default styling (note colors/icon).'
      : 'Falling back to plain blockquote.';
    console.warn(`[remark-callout-plus] Unknown callout type "${type}".${hint} ${action}`);
  };

  // Recursive walker that descends into every parent's children and
  // transforms callout/accordion blockquotes in place.
  function walk(parent: { children: any[] }): void {
    const children = parent.children;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];

      // Recurse into any parent first (depth-first), so inner callouts
      // are detected before we possibly replace `node` itself.
      if (node && Array.isArray(node.children) && node.children.length > 0) {
        walk(node);
      }

      // Now check if `node` itself is a blockquote that should be transformed.
      if (node && node.type === 'blockquote') {
        // Check for accordion markers FIRST — `[!!]` and `[! icon !]` must
        // not be mistaken for callouts.
        const accordionNodes = transformAccordionBlockquote(node as Blockquote, enableFoldable, config.useNativeHast);
        if (accordionNodes && accordionNodes.length > 0) {
          // Splice the (possibly multiple) accordion nodes in place of the
          // original blockquote.
          children.splice(i, 1, ...accordionNodes as any);
          // Adjust index since we may have inserted multiple nodes
          i += accordionNodes.length - 1;
          continue;
        }

        // Fall through to callout detection.
        const parsed = isCalloutBlockquote(node as Blockquote, enableFoldable);
        if (parsed) {
          // Check the types whitelist (literary types are always allowed).
          // If the type is not in the whitelist and not literary, fall through
          // to a plain blockquote (don't transform).
          if (allowedTypes && !allowedTypes.has(parsed.type) && !LITERARY_TYPES.has(parsed.type)) {
            // v1.3.0: if onUnknownCallout is set, give the consumer a chance
            // to remap the unknown type or explicitly drop it.
            if (config.onUnknownCallout) {
              const remapped = config.onUnknownCallout({
                type: parsed.type,
                title: parsed.title || undefined,
                foldable: parsed.foldable,
                id: parsed.id,
              });
              if (remapped) {
                // Consumer remapped — use the new type's config
                parsed.type = remapped.type.toLowerCase();
                if (remapped.title !== undefined) parsed.title = remapped.title;
                parsed.foldable = remapped.foldable;
                parsed.id = remapped.id;
                const calloutNode = transformBlockquote(node as Blockquote, parsed, config);
                children[i] = calloutNode;
                continue;
              }
              // Consumer returned undefined → fall through to plain blockquote
            }
            // Dev-mode warning for types that ARE known but not whitelisted:
            // skip the warning (the user explicitly chose to exclude them).
            // Warn only for truly unknown types (not in config.types at all).
            if (!config.types[parsed.type]) {
              warnUnknownType(parsed.type, /* willRender */ false);
            }
            continue;  // leave as plain blockquote
          }

          // Warn for unknown types even when no whitelist is set (dev mode only).
          if (!allowedTypes && !config.types[parsed.type] && !LITERARY_TYPES.has(parsed.type)) {
            // v1.3.0: if onUnknownCallout is set, give the consumer a chance
            // to remap or drop the unknown type.
            if (config.onUnknownCallout) {
              const remapped = config.onUnknownCallout({
                type: parsed.type,
                title: parsed.title || undefined,
                foldable: parsed.foldable,
                id: parsed.id,
              });
              if (remapped) {
                parsed.type = remapped.type.toLowerCase();
                if (remapped.title !== undefined) parsed.title = remapped.title;
                parsed.foldable = remapped.foldable;
                parsed.id = remapped.id;
                const calloutNode = transformBlockquote(node as Blockquote, parsed, config);
                children[i] = calloutNode;
                continue;
              }
              // Consumer returned undefined → fall through to plain blockquote
              continue;
            }
            warnUnknownType(parsed.type, /* willRender */ true);
            // Still render as a callout (backward compat) — just warn.
          }

          const calloutNode = transformBlockquote(node as Blockquote, parsed, config);
          children[i] = calloutNode;
        }
      }
    }
  }

  walk(tree);

  // Final pass: group adjacent accordion nodes for exclusive expansion.
  groupAdjacentAccordions(tree);
}
