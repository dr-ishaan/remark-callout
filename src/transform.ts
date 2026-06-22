import { visit } from 'unist-util-visit';
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
 *   1 → type key  (e.g., "NOTE", "WARNING", "BEST-PRACTICE")
 *   2 → foldable  ("+" or "-" or undefined) — comes AFTER the closing bracket
 *   3 → title     (everything after optional foldable char, trimmed)
 */
const CALLOUT_RE = /^\[!([\w-]+)\]([\+\-])?\s*(.*)/;

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
 * Merge user options with built-in defaults to produce a resolved config.
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

  // Start with built-in types (or empty if disabled)
  const types: Record<string, CalloutTypeConfig> = disableBuiltins
    ? {}
    : { ...BUILT_IN_CALLOUTS };

  // Apply user-defined callout types
  for (const [key, partial] of Object.entries(callouts)) {
    const existing = types[key];
    const p = partial as Partial<CalloutTypeConfig> & { defaultTitle?: string };
    types[key] = {
      defaultTitle: p.defaultTitle ?? existing?.defaultTitle ?? capitalize(key),
      icon: p.icon ?? existing?.icon ?? BUILT_IN_CALLOUTS.note.icon,
      colorL: p.colorL ?? existing?.colorL ?? 0.55,
      colorC: p.colorC ?? existing?.colorC ?? 0.18,
      colorH: p.colorH ?? existing?.colorH ?? 250,
    };
  }

  // Apply icon overrides
  for (const [key, icon] of Object.entries(icons)) {
    if (types[key]) {
      types[key] = { ...types[key], icon };
    }
  }

  // Apply title overrides
  for (const [key, title] of Object.entries(titles)) {
    if (types[key]) {
      types[key] = { ...types[key], defaultTitle: title };
    }
  }

  // Store showTitle / showIcon into a data attribute for the handler
  // (we attach these to the config for the toHast handler to read)
  return {
    types,
    showTitle,
    showIcon,
    enableFoldable,
    tag,
  } as ResolvedConfig;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
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
 * remaining on the marker line (after the marker text is stripped) is
 * preserved as the first child of the callout body. Remaining blockquote
 * children (subsequent paragraphs, lists, etc.) follow.
 */
export function transformBlockquote(
  blockquote: Blockquote,
  parsed: ParsedCallout,
  config: ResolvedConfig
): CalloutNode {
  const typeConfig = config.types[parsed.type];

  // Default title: use the resolved config, or title-case the type key
  const title = parsed.title || typeConfig?.defaultTitle || capitalize(parsed.type);
  const icon = typeConfig?.icon ?? BUILT_IN_CALLOUTS.note.icon;

  // Build oklch color CSS variables as inline data for the handler
  const colorL = typeConfig?.colorL ?? 0.55;
  const colorC = typeConfig?.colorC ?? 0.18;
  const colorH = typeConfig?.colorH ?? 250;

  // Collect the body children (everything after the first paragraph)
  const bodyChildren = blockquote.children.slice(1);

  // Extract any inline body content from the first paragraph (after the marker).
  // The marker occupies `parsed.markerLength` characters at the start of the
  // first text node. Anything remaining after stripping it is body text.
  const firstParagraph = blockquote.children[0];
  if (firstParagraph && firstParagraph.type === 'paragraph') {
    const firstChild = firstParagraph.children[0];
    if (firstChild && firstChild.type === 'text') {
      const remaining = firstChild.value.slice(parsed.markerLength).trimStart();
      if (remaining.length > 0) {
        // Replace the text node with just the remaining content
        const updatedFirst = { ...firstChild, value: remaining };
        const inlineParagraph: Paragraph = {
          type: 'paragraph',
          children: [updatedFirst, ...firstParagraph.children.slice(1)],
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
      hName: parsed.foldable !== false ? 'details' : config.tag,
      hProperties: {
        className: [
          'callout',
          `callout-${parsed.type}`,
          ...(parsed.foldable !== false ? ['callout-foldable'] : []),
        ],
        'data-callout': parsed.type,
        style: `--callout-l: ${colorL}; --callout-c: ${colorC}; --callout-h: ${colorH};`,
        ...(parsed.foldable !== false
          ? { 'data-callout-fold': parsed.foldable }
          : {}),
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
 * Handles nested callouts by running multiple passes (max depth = 10).
 */
export function remarkCalloutTransformer(
  tree: Root,
  config: ResolvedConfig
): void {
  const { enableFoldable } = config;
  const MAX_PASSES = 10;

  // Multiple passes handle nested callouts:
  // Pass 1 transforms outer callouts, exposing inner blockquotes.
  // Pass 2 catches those inner blockquotes, and so on.
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let transformed = false;

    visit(tree, 'blockquote', (node: Blockquote, index: number | undefined, parent) => {
      if (index == null || !parent) return;

      const parsed = isCalloutBlockquote(node, enableFoldable);
      if (!parsed) return;

      const calloutNode = transformBlockquote(node, parsed, config);
      parent.children.splice(index, 1, calloutNode as any);
      transformed = true;
    });

    if (!transformed) break;
  }
}