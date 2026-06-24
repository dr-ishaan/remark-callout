import type { Blockquote, Paragraph, Root } from 'mdast';
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
 * The optional `{#id}` block must appear immediately after `]` (before any
 * foldable char). The ID must start with a letter and contain only letters,
 * digits, hyphens, and underscores (valid HTML id characters).
 */
const CALLOUT_RE = /^\[!([A-Za-z][A-Za-z0-9-]*)\](?:\{#([A-Za-z][\w-]*)\})?([\+\-])?[^\S\n]*(.*)/;

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
const ACCORDION_RE = /^\[!!\](?:\{#([A-Za-z][\w-]*)\})?([\+\-])?[^\S\n]*(.*)/;

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
const ACCORDION_ICON_RE = /^\[!\s*([\s\S]+?)\s*!\](?:\{#([A-Za-z][\w-]*)\})?([\+\-])?[^\S\n]*(.*)/;

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
  if (bestDistance <= 3) return bestMatch;
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
  const firstParagraph = blockquote.children[0];
  if (firstParagraph && firstParagraph.type === 'paragraph') {
    const titleNodes: any[] = [];
    const bodyInline: any[] = [];

    if (parsed.title.length > 0) {
      titleNodes.push({ type: 'text', value: parsed.title });
    }

    let firstTextSkipped = false;
    let foundNewline = false;

    for (const child of firstParagraph.children as any[]) {
      if (child.type === 'text') {
        let text: string;
        if (!firstTextSkipped) {
          text = child.value.slice(parsed.markerLength);
          firstTextSkipped = true;
        } else {
          text = child.value;
        }

        const nlIdx = text.indexOf('\n');
        if (nlIdx === -1) {
          if (!foundNewline) {
            const trimmed = text.trim();
            if (trimmed.length > 0) {
              titleNodes.push({ ...child, value: trimmed });
            }
          } else {
            const trimmed = text.replace(/^\s+/, '');
            if (trimmed.length > 0) {
              bodyInline.push({ ...child, value: trimmed });
            }
          }
        } else {
          const before = text.slice(0, nlIdx).trim();
          const after = text.slice(nlIdx + 1);
          if (!foundNewline && before.length > 0) {
            titleNodes.push({ ...child, value: before });
          }
          foundNewline = true;
          const afterTrimmed = after.replace(/^\s+/, '');
          if (afterTrimmed.length > 0) {
            bodyInline.push({ ...child, value: afterTrimmed });
          }
        }
      } else {
        if (!foundNewline) {
          titleNodes.push(child);
        } else {
          bodyInline.push(child);
        }
      }
    }

    if (bodyInline.length > 0) {
      bodyChildren.unshift({ type: 'paragraph', children: bodyInline } as any);
    }
  }

  const title = parsed.title || '';
  const hName = variant === 'aside' || variant === 'sidebar' ? 'aside' : 'figure';

  const node: CalloutNode = {
    type: 'callout',
    data: {
      calloutType: variant,
      calloutTitle: title,
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
  enableFoldable: boolean
): CalloutNode[] | null {
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

  const nodes: CalloutNode[] = [];
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

    nodes.push(transformAccordion(syntheticBlockquote, parsed));
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
      const isAccordion =
        child &&
        child.type === 'callout' &&
        child.data &&
        child.data.calloutType === 'accordion';

      if (isAccordion) {
        if (runStart === -1) runStart = i;
      } else {
        if (runStart !== -1) {
          groupCounter++;
          const groupId = `accordion-group-${groupCounter}`;
          for (let j = runStart; j < i; j++) {
            children[j].data.accordionGroupId = groupId;
          }
          runStart = -1;
        }
      }
    }
  }
}

// ─── MDAST Transform ────────────────────────────────────────────────────────

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
    return transformLiterary(blockquote, parsed, variant);
  }

  const typeConfig = config.types[parsed.type];
  const icon = typeConfig?.icon ?? STUB_DEFAULTS.icon;

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
  // The marker regex's `(.*)` capture stops at `\n`, so `parsed.markerLength`
  // only covers up to the end of the marker line. But remark-parse may split
  // the marker line across multiple MDAST children (e.g., `[!NOTE] ` as text,
  // `**bold**` as strong, `\nbody` as text). We walk the children and split
  // them at the first newline: everything before is title, everything after
  // is body.
  const titleNodes: any[] = [];
  const bodyInline: any[] = [];

  // `parsed.title` is the plain-text portion of the title captured by the
  // regex (everything after `]` and optional `+`/`-`, up to the first `\n`).
  // `parsed.markerLength` includes this title text. We re-add it as a text
  // node here, then walk the paragraph's children to find any additional
  // inline content (strong, em, link, code) that belongs to the title.
  if (parsed.title.length > 0) {
    titleNodes.push({ type: 'text', value: parsed.title });
  }

  const firstParagraph = blockquote.children[0];
  if (firstParagraph && firstParagraph.type === 'paragraph') {
    let firstTextSkipped = false;
    let foundNewline = false;

    for (const child of firstParagraph.children as any[]) {
      if (child.type === 'text') {
        // For the first text child, slice off `markerLength` chars (the
        // marker + any title text the regex already captured). For
        // subsequent text children, use the full value.
        let text: string;
        if (!firstTextSkipped) {
          text = child.value.slice(parsed.markerLength);
          firstTextSkipped = true;
        } else {
          text = child.value;
        }

        const nlIdx = text.indexOf('\n');
        if (nlIdx === -1) {
          // No newline in this text node
          if (!foundNewline) {
            // Before any newline → title (skip whitespace-only, since
            // parsed.title already captured the meaningful text from the
            // first text node)
            const trimmed = text.trim();
            if (trimmed.length > 0) {
              titleNodes.push({ ...child, value: trimmed });
            }
          } else {
            // After newline → body
            const trimmed = text.replace(/^\s+/, '');
            if (trimmed.length > 0) {
              bodyInline.push({ ...child, value: trimmed });
            }
          }
        } else {
          // Newline found — split this text node
          const before = text.slice(0, nlIdx);
          const after = text.slice(nlIdx + 1);
          // `before` is title (skip if whitespace-only — parsed.title
          // already has the meaningful text from the first text node)
          const beforeTrimmed = before.trim();
          if (!foundNewline && beforeTrimmed.length > 0) {
            titleNodes.push({ ...child, value: beforeTrimmed });
          }
          foundNewline = true;
          // `after` is body
          const afterTrimmed = after.replace(/^\s+/, '');
          if (afterTrimmed.length > 0) {
            bodyInline.push({ ...child, value: afterTrimmed });
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
  }

  // If we found body content in the first paragraph (after a newline),
  // prepend it as an inline paragraph to the body children.
  if (bodyInline.length > 0) {
    bodyChildren.unshift({ type: 'paragraph', children: bodyInline } as any);
  }

  // Determine the plain-text fallback title (used when titleNodes is empty
  // OR when showTitle renders the text fallback).
  const fallbackTitle = parsed.title || typeConfig?.defaultTitle || capitalize(parsed.type);

  const node: CalloutNode = {
    type: 'callout',
    data: {
      calloutType: parsed.type,
      calloutTitle: fallbackTitle,
      calloutTitleNodes: titleNodes.length > 0 ? titleNodes : undefined,
      calloutIcon: icon,
      foldable: parsed.foldable,
      showTitle: config.showTitle,
      showIcon: config.showIcon,
      hName: parsed.foldable !== false ? 'details' : config.tag,
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
  const warnUnknownType = (type: string) => {
    if (process.env.NODE_ENV === 'production') return;
    if (warnedTypes.has(type)) return;
    warnedTypes.add(type);
    // Find closest match for a helpful suggestion
    const allTypes = Object.keys(config.types);
    const suggestion = findClosestType(type, allTypes);
    const hint = suggestion ? ` Did you mean "${suggestion}"?` : '';
    console.warn(`[remark-callout-plus] Unknown callout type "${type}".${hint} Falling back to plain blockquote.`);
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
        const accordionNodes = transformAccordionBlockquote(node as Blockquote, enableFoldable);
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
            // Dev-mode warning for types that ARE known but not whitelisted:
            // skip the warning (the user explicitly chose to exclude them).
            // Warn only for truly unknown types (not in config.types at all).
            if (!config.types[parsed.type]) {
              warnUnknownType(parsed.type);
            }
            continue;  // leave as plain blockquote
          }

          // Warn for unknown types even when no whitelist is set (dev mode only).
          if (!allowedTypes && !config.types[parsed.type] && !LITERARY_TYPES.has(parsed.type)) {
            warnUnknownType(parsed.type);
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
