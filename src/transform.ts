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
    titleNodes: [],  // populated by transformBlockquote from MDAST inline children
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
