import type { Blockquote, Paragraph, Root } from 'mdast';
import type {
  CalloutNode,
  CalloutOptions,
  CalloutTypeConfig,
  Foldable,
  ParsedCallout,
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
 *
 * Captures:
 *   1 → type key  (e.g., "NOTE", "WARNING", "BEST-PRACTICE") — may include hyphens
 *   2 → foldable  ("+" or "-" or undefined) — comes AFTER the closing bracket
 *   3 → title     (everything after optional foldable char, trimmed)
 *
 * Note: `[^\S\n]*` is used instead of `\s*` so that newlines are NOT
 * consumed. If remark-parse merges blockquote lines into a single text
 * node like `[!NOTE]\nBody here`, the `\n` must remain so the body
 * text after it can be extracted by `transformBlockquote` rather than
 * being captured as the title.
 */
const CALLOUT_RE = /^\[!([\w-]+)\]([\+\-])?[^\S\n]*(.*)/;

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

  const [, rawType, foldChar, title] = match;
  const type = rawType.toLowerCase();

  let foldable: Foldable = false;
  if (enableFoldable) {
    if (foldChar === '+') foldable = 'open';
    else if (foldChar === '-') foldable = 'closed';
  }

  return {
    type,
    title: (title ?? '').trim(),
    foldable,
    markerLength: match[0].length,
  };
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

  return {
    types,
    showTitle,
    showIcon,
    enableFoldable,
    tag,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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
  const typeConfig = config.types[parsed.type];

  // Default title: use the resolved config, or title-case the type key
  const title = parsed.title || typeConfig?.defaultTitle || capitalize(parsed.type);
  const icon = typeConfig?.icon ?? STUB_DEFAULTS.icon;

  // Build oklch color CSS variables as inline data for the handler
  const colorL = typeConfig?.colorL ?? STUB_DEFAULTS.colorL;
  const colorC = typeConfig?.colorC ?? STUB_DEFAULTS.colorC;
  const colorH = typeConfig?.colorH ?? STUB_DEFAULTS.colorH;

  // Collect the body children (everything after the first paragraph)
  const bodyChildren = blockquote.children.slice(1);

  // Extract any inline body content from the first paragraph (after the marker).
  // The marker occupies `parsed.markerLength` characters at the start of the
  // first text node. Anything remaining after stripping it is body text.
  // Inline siblings (strong, em, link, code, ...) after the marker text are
  // preserved as additional children of the inline paragraph — they were
  // previously silently dropped (see audit BUG #1).
  const firstParagraph = blockquote.children[0];
  if (firstParagraph && firstParagraph.type === 'paragraph') {
    const firstChild = firstParagraph.children[0];
    if (firstChild && firstChild.type === 'text') {
      const remaining = firstChild.value.slice(parsed.markerLength).trimStart();
      const otherChildren = firstParagraph.children.slice(1);
      if (remaining.length > 0 || otherChildren.length > 0) {
        const newChildren: any[] = [];
        if (remaining.length > 0) {
          newChildren.push({ ...firstChild, value: remaining });
        }
        newChildren.push(...otherChildren);
        const inlineParagraph: Paragraph = {
          type: 'paragraph',
          children: newChildren,
        };
        bodyChildren.unshift(inlineParagraph as any);
      }
    } else if (firstChild) {
      // First child isn't text (e.g., starts with bold) but the marker was
      // somehow extracted from a later text node — preserve the paragraph
      // minus the consumed text portion. This is rare but defensive.
      const otherChildren = firstParagraph.children.slice(1);
      if (otherChildren.length > 0) {
        const inlineParagraph: Paragraph = {
          type: 'paragraph',
          children: otherChildren as any,
        };
        bodyChildren.unshift(inlineParagraph as any);
      }
    }
  }

  const node: CalloutNode = {
    type: 'callout',
    data: {
      calloutType: parsed.type,
      calloutTitle: title,
      calloutIcon: icon,
      foldable: parsed.foldable,
      showTitle: config.showTitle,
      showIcon: config.showIcon,
      hName: parsed.foldable !== false ? 'details' : config.tag,
      // Only `style` is read from hProperties by calloutToHast — the
      // className / data-callout / data-callout-fold attributes are built
      // directly in the handler (single source of truth, avoids the
      // "properties set twice" anti-pattern that previously existed when
      // state.applyData was called).
      //
      // hName IS still read by the handler (it computes tagName from it
      // for non-foldable callouts), so we keep it above.
      hProperties: {
        style: `--callout-l: ${colorL}; --callout-c: ${colorC}; --callout-h: ${colorH};`,
      },
    },
    children: bodyChildren,
  };

  return node;
}

/**
 * Main remark plugin transformer.
 *
 * Visits all blockquotes, detects callout markers, and replaces them
 * with custom `callout` MDAST nodes.
 *
 * Handles nested callouts via a recursive descent: after a blockquote is
 * replaced with a `callout` node, we recurse into the new callout's children
 * to catch any inner blockquotes that should themselves be callouts. This
 * is single-pass with no nesting cap (the previous multi-pass + SKIP
 * approach was both wasteful and failed to descend into newly created
 * callout nodes).
 */
export function remarkCalloutTransformer(
  tree: Root,
  config: ResolvedConfig
): void {
  const { enableFoldable } = config;

  // Recursive walker that descends into every parent's children and
  // transforms callout blockquotes in place.
  function walk(parent: { children: any[] }): void {
    const children = parent.children;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];

      // Recurse into any parent first (depth-first), so inner callouts
      // are detected before we possibly replace `node` itself.
      if (node && Array.isArray(node.children) && node.children.length > 0) {
        walk(node);
      }

      // Now check if `node` itself is a callout blockquote.
      if (node && node.type === 'blockquote') {
        const parsed = isCalloutBlockquote(node as Blockquote, enableFoldable);
        if (parsed) {
          const calloutNode = transformBlockquote(node as Blockquote, parsed, config);
          children[i] = calloutNode;
          // The new callout's children may themselves contain blockquotes
          // that were inside the original blockquote (e.g., nested callouts).
          // We already recursed into them above when they were children of
          // the original blockquote — but `transformBlockquote` shallow-copies
          // them into the new callout node, so the recursion already ran on
          // the live reference. No need to re-walk.
          //
          // HOWEVER, the inner blockquote's transformation may have produced
          // a `callout` node that is now a child of THIS new callout. That's
          // correct — the inner callout is properly nested.
          //
          // Edge case: if the inner blockquote was NOT yet a callout (because
          // its marker wasn't recognized on the first pass), it remains a
          // blockquote. We do NOT re-walk here because we already visited
          // its children above.
        }
      }
    }
  }

  walk(tree);
}
